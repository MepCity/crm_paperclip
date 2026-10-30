import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const actor = {
  orgId: "org-write-example",
  orgSlug: "example",
  orgName: "Example",
  userId: "user-example",
  role: "admin" as const,
};
vi.mock("@crm/core", async (original) => ({
  ...(await original<typeof import("@crm/core")>()),
  getSession: vi.fn(async () => ({ user: { id: actor.userId } })),
  requireOrgContext: vi.fn(async (_headers: Headers, slug: string) => {
    if (slug !== actor.orgSlug) {
      const { NotFoundError } = await import("@crm/core/errors");
      throw new NotFoundError();
    }
    return { ...actor };
  }),
}));

import { getSession } from "@crm/core";
import { MAX_OUTBOUND_ATTACHMENT_BYTES, MAX_OUTBOUND_RECIPIENTS } from "@crm/core/mail/outbox";
import { DELETE, POST as LINK } from "@/app/crm/v2.2/mail/messages/[id]/links/route";
import { PATCH } from "@/app/crm/v2.2/mail/messages/[id]/sharing/route";
import { POST } from "@/app/crm/v2.2/mail/messages/route";
import { createMailSeed } from "./seed";
import { mailReadSource } from "./service";
import { createMailState } from "./state";
import { mailWriteSource } from "./write";

let state: Awaited<ReturnType<typeof createMailState>>;
let canReadRecord = vi.fn(async () => true);
const payload = () => ({
  idempotencyKey: "example-send",
  mailboxId: "mailbox-demo",
  from: { address: "sender@example.test" },
  to: [{ address: "recipient@example.test" }],
  subject: "Example subject",
  body: "Example body",
});
const call = (
  method = "POST",
  body: unknown = payload(),
  id = "message-demo-1",
  headers: Record<string, string> = {},
) => {
  const request = new Request("http://crm.test/crm/v2.2/mail/messages", {
    method,
    headers: { Origin: "http://localhost:3000", "X-CRM-ORG": "example", ...headers },
    body: JSON.stringify(body),
  });
  const context = { params: Promise.resolve({ id }) };
  return method === "PATCH"
    ? PATCH(request, context)
    : method === "DELETE"
      ? DELETE(request, context)
      : POST(request, context);
};
const link = (body: unknown, id = "message-demo-1") =>
  LINK(
    new Request("http://crm.test/crm/v2.2/mail/messages/links", {
      method: "POST",
      headers: { Origin: "http://localhost:3000", "X-CRM-ORG": "example" },
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ id }) },
  );

beforeEach(async () => {
  vi.stubEnv("APP_URL", "http://localhost:3000");
  vi.stubEnv("DATABASE_URL", "postgres://localhost/example");
  vi.stubEnv("APP_SECRET", "x".repeat(40));
  vi.stubEnv("MAIL_TEST_RECIPIENT", "recipient@example.test");
  actor.userId = "user-example";
  state = await createMailState(actor, { includeMessages: true });
  canReadRecord = vi.fn(async () => true);
  vi.spyOn(mailWriteSource, "create").mockImplementation(async () => ({
    ...state,
    recordAddressLookup: { findByAddress: async () => [] },
    canReadRecord,
    readContent: async (id) => state.content.get(id) ?? { body: "", unread: false },
  }));
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("mail write HTTP routes", () => {
  it("queues once, stores body privately and returns the same result on replay", async () => {
    const first = await call();
    expect(first.status).toBe(200);
    expect(first.headers.get("cache-control")).toBe("no-store");
    const result = await first.json();
    expect(result).toEqual({
      data: { id: "example-send-draft", status: "queued", scheduledAt: null },
    });
    expect(await (await call()).json()).toEqual(result);
    const snapshot = await state.repository.read(actor.orgId);
    expect(snapshot.outbox).toHaveLength(1);
    const draft = snapshot.messages.find((row) => row.id === result.data.id);
    expect(state.bodies.get(draft?.bodyRef ?? "")).toBe("Example body");
    expect(JSON.stringify(result)).not.toMatch(
      /bodyRef|blobRef|organizationId|mailboxId|outbox|credential|provider/,
    );
    expect(
      await state.queue.claim({ workerId: "test-worker", limit: 10, leaseMs: 1000 }),
    ).toHaveLength(1);
  });
  it("serializes simultaneous replays and rejects different content for the same key", async () => {
    const replies = await Promise.all([call(), call()]);
    expect(replies.map((r) => r.status)).toEqual([200, 200]);
    expect(await replies[0]?.json()).toEqual(await replies[1]?.json());
    expect((await call("POST", { ...payload(), body: "Different body" })).status).toBe(400);
    expect(state.bodies.size).toBe(1);
    expect((await state.repository.read(actor.orgId)).outbox).toHaveLength(1);
  });
  it("schedules the queue job and parses normalized free-text recipients", async () => {
    const scheduledAt = "2099-01-01T10:00:00Z";
    const response = await call("POST", {
      ...payload(),
      to: "Example <RECIPIENT@example.test>",
      scheduledAt,
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ data: { scheduledAt } });
    const snapshot = await state.repository.read(actor.orgId);
    expect(snapshot.messages.at(-1)?.to).toEqual([
      { address: "recipient@example.test", name: "Example" },
    ]);
    expect(
      await state.queue.claim({ workerId: "test-worker", limit: 10, leaseMs: 1000 }),
    ).toHaveLength(0);
  });
  it("requires session, organization membership and same origin before source access", async () => {
    const source = vi.mocked(mailWriteSource.create);
    vi.mocked(getSession).mockResolvedValueOnce(null as never);
    expect((await call()).status).toBe(401);
    expect(
      (await call("POST", payload(), undefined, { Origin: "https://other.test" })).status,
    ).toBe(403);
    expect((await call("POST", payload(), undefined, { "X-CRM-ORG": "" })).status).toBe(400);
    expect((await call("POST", payload(), undefined, { "X-CRM-ORG": "other" })).status).toBe(404);
    expect(source).not.toHaveBeenCalled();
  });
  it("denies another mailbox owner even for admin and hides missing mailboxes", async () => {
    actor.userId = "other-user";
    expect((await call()).status).toBe(403);
    expect((await call("POST", { ...payload(), mailboxId: "missing" })).status).toBe(404);
    expect((await state.repository.read(actor.orgId)).outbox).toHaveLength(0);
    expect(state.bodies.size).toBe(0);
  });
  it.each([
    { to: [] },
    { to: "invalid" },
    {
      to: Array.from({ length: MAX_OUTBOUND_RECIPIENTS + 1 }, () => ({
        address: "recipient@example.test",
      })),
    },
    { cc: [{ address: "other@example.test" }] },
    { bcc: "other@example.test" },
    { body: "é".repeat(524289) },
    { bodyRef: "client-private-reference" },
    { scheduledAt: "not-a-date" },
    {
      attachments: [
        {
          id: "file",
          name: "example.txt",
          size: MAX_OUTBOUND_ATTACHMENT_BYTES + 1,
          contentType: "text/plain",
          blobRef: "private-file",
        },
      ],
    },
    {
      attachments: [
        {
          id: "file",
          name: "example.exe",
          size: 1,
          contentType: "application/octet-stream",
          blobRef: "private-file",
        },
      ],
    },
  ])("rejects invalid compose without enqueuing", async (change) => {
    const response = await call("POST", { ...payload(), ...change });
    expect([400, 422]).toContain(response.status);
    expect(await response.json()).toMatchObject({
      status: "error",
      details: { fields: expect.any(Object) },
    });
    expect((await state.repository.read(actor.orgId)).outbox).toHaveLength(0);
    expect(state.bodies.size).toBe(0);
  });
  it("fails closed without a configured test recipient", async () => {
    vi.stubEnv("MAIL_TEST_RECIPIENT", "");
    expect((await call()).status).toBe(400);
  });
  it("accepts the UTF-8 body boundary and outbound total attachment boundary", async () => {
    const attachments = [1, 2].map((id) => ({
      id: `file-${id}`,
      name: "example.txt",
      size: MAX_OUTBOUND_ATTACHMENT_BYTES / 2,
      contentType: "text/plain",
      blobRef: `private-${id}`,
    }));
    expect(
      (await call("POST", { ...payload(), body: "é".repeat(524288), attachments })).status,
    ).toBe(200);
    expect((await state.repository.read(actor.orgId)).attachments).toHaveLength(3);
  });
  it("requires ownership to share and persists both sharing states", async () => {
    for (const shared of [true, false]) {
      const response = await call("PATCH", { shared });
      expect(response.status).toBe(200);
      expect((await state.repository.read(actor.orgId)).messages[0]?.sharedByOwner).toBe(shared);
    }
    actor.userId = "other-user";
    expect((await call("PATCH", { shared: true })).status).toBe(403);
    expect((await call("PATCH", { shared: true }, "missing")).status).toBe(404);
  });
  it("links and unlinks only records readable now, with no internal metadata in responses", async () => {
    const target = { module: "leads", recordId: "example-record" };
    const added = await link(target);
    expect(added.status).toBe(200);
    expect(await added.json()).toEqual({ data: { id: "message-demo-1", ...target, linked: true } });
    expect((await state.repository.read(actor.orgId)).links).toHaveLength(1);
    canReadRecord.mockResolvedValue(false);
    expect((await link(target)).status).toBe(404);
    expect((await call("DELETE", target)).status).toBe(404);
    expect((await state.repository.read(actor.orgId)).links).toHaveLength(1);
    canReadRecord.mockResolvedValue(true);
    expect((await call("DELETE", target)).status).toBe(200);
    expect((await state.repository.read(actor.orgId)).links).toHaveLength(0);
    actor.userId = "other-user";
    expect((await link(target)).status).toBe(403);
    expect((await call("DELETE", target)).status).toBe(403);
  });
  it.each(["PATCH", "DELETE", "POST"])(
    "maps malformed JSON to validation for %s",
    async (method) => {
      const handler = method === "PATCH" ? PATCH : method === "DELETE" ? DELETE : POST;
      const response = await handler(
        new Request("http://crm.test/", {
          method,
          headers: { Origin: "http://localhost:3000", "X-CRM-ORG": "example" },
          body: "{",
        }),
        { params: Promise.resolve({ id: "message-demo-1" }) },
      );
      expect(response.status).toBe(400);
    },
  );
  it("supports manual deal links", async () => {
    const target = { module: "deals", recordId: "example-record" };
    expect((await link(target)).status).toBe(200);
    expect((await state.repository.read(actor.orgId)).links).toEqual([
      expect.objectContaining(target),
    ]);
    expect((await call("DELETE", target)).status).toBe(200);
  });
  it("rejects invalid sharing and link shapes", async () => {
    expect((await call("PATCH", { shared: "true" })).status).toBe(400);
    expect((await link({ module: "unsupported", recordId: "example-record" })).status).toBe(400);
    expect((await call("DELETE", { module: "leads" })).status).toBe(400);
  });
  it("ignores foreign-tenant rows even if an adapter accidentally returns them", async () => {
    const read = state.repository.read.bind(state.repository);
    state.repository.read = async (org) => {
      const data = await read(org);
      return {
        ...data,
        mailboxes: data.mailboxes.map((m) => ({ ...m, organizationId: "foreign-org" })),
        messages: data.messages.map((m) => ({ ...m, organizationId: "foreign-org" })),
      };
    };
    expect((await call()).status).toBe(404);
    expect((await call("PATCH", { shared: true })).status).toBe(404);
    expect((await link({ module: "leads", recordId: "example-record" })).status).toBe(404);
    expect((await call("DELETE", { module: "leads", recordId: "example-record" })).status).toBe(
      404,
    );
  });
  it("uses one tenant state across actual read/write source instances", async () => {
    vi.mocked(mailWriteSource.create).mockRestore();
    const context = { ...actor, orgId: "org-state-example" };
    const first = await mailWriteSource.create(context);
    const second = await mailWriteSource.create(context);
    expect(first.repository).toBe(second.repository);
    const seed = await createMailSeed(context, { includeMessages: true });
    const message = (await seed.repository.read(context.orgId)).messages[0];
    if (!message) throw new Error("Missing test message");
    await first.repository.upsertMessage(message);
    await first.repository.setShared(context.orgId, "message-demo-1", true);
    const reader = await mailReadSource.create(context);
    expect((await reader.repository.read(context.orgId)).messages[0]?.sharedByOwner).toBe(true);
    const foreign = await mailWriteSource.create({ ...context, orgId: "org-state-other" });
    expect(foreign.repository).not.toBe(first.repository);
    expect((await foreign.repository.read(context.orgId)).messages).toEqual([]);
  });
});
