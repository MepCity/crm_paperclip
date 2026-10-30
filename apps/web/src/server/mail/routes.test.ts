import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ctx = {
  orgId: "org-example",
  orgSlug: "example",
  orgName: "Example",
  userId: "user-example",
  role: "admin" as const,
};
vi.mock("@crm/core", async (original) => ({
  ...(await original<typeof import("@crm/core")>()),
  getSession: vi.fn(async () => ({ user: { id: ctx.userId } })),
  requireOrgContext: vi.fn(async (_h: Headers, slug: string) => {
    if (slug !== ctx.orgSlug) {
      const { NotFoundError } = await import("@crm/core/errors");
      throw new NotFoundError();
    }
    return ctx;
  }),
}));

import { getSession } from "@crm/core";
import { GET } from "@/app/crm/v2.2/mail/conversations/route";
import { createMailSeed } from "./seed";
import { mailReadSource } from "./service";

const request = (folder = "inbox", headers = { "X-CRM-ORG": "example" }) =>
  GET(new Request(`http://crm.test/crm/v2.2/mail/conversations?folder=${folder}`, { headers }), {});
afterEach(() => vi.restoreAllMocks());

describe("mail conversation read route", () => {
  beforeEach(() => {
    vi.spyOn(mailReadSource, "create").mockImplementation(async () => {
      const { repository, content } = await createMailSeed(ctx, { includeMessages: true });
      return {
        repository,
        recordAddressLookup: { findByAddress: async () => [] },
        canReadRecord: async () => true,
        readContent: async (id) => content.get(id) ?? { body: "", unread: false },
      };
    });
  });

  it("does not populate the production inbox with example messages", async () => {
    vi.restoreAllMocks();
    const response = await request();
    expect(response.status).toBe(200);
    expect((await response.json()).data).toEqual([]);
  });
  it.each(["inbox", "sent", "drafts", "scheduled"])("reads %s", async (folder) => {
    const response = await request(folder);
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    const body = await response.json();
    expect(body.connected).toBe(true);
    expect(body.data).toHaveLength(folder === "inbox" || folder === "sent" ? 1 : 0);
    if (body.data.length) expect(body.data[0].folder).toBe(folder);
  });
  it("rejects unknown or missing folder", async () => {
    for (const folder of ["unknown", ""]) {
      const response = await request(folder);
      expect(response.status).toBe(400);
      expect(await response.json()).toMatchObject({ code: "INVALID_FOLDER" });
    }
  });
  it("requires session and tenant before reading", async () => {
    const source = vi.spyOn(mailReadSource, "create");
    vi.mocked(getSession).mockResolvedValueOnce(null as never);
    expect((await request()).status).toBe(401);
    expect((await request("inbox", {} as never)).status).toBe(400);
    expect((await request("inbox", { "X-CRM-ORG": "other" })).status).toBe(404);
    expect(source).not.toHaveBeenCalled();
  });
  it("groups a thread, keeps chronological messages and any-unread state", async () => {
    const { data } = await (await request()).json();
    expect(data[0]).toMatchObject({
      id: "thread-demo",
      unread: true,
      messages: [
        {
          id: "message-demo-1",
          body: "Message content.",
          attachments: [{ sizeLabel: "1.2 KB" }],
        },
        { id: "message-demo-2" },
      ],
    });
    expect(JSON.stringify(data)).not.toMatch(/bodyRef|credentialRef|providerMessageKey|bcc/);
  });
  it.each(["disconnected", "error", "missing"])(
    "is disconnected for %s mailbox",
    async (status) => {
      const seed = await createMailSeed(ctx, { includeMessages: true });
      const read = seed.repository.read.bind(seed.repository);
      seed.repository.read = async (org) => {
        const data = await read(org);
        return {
          ...data,
          mailboxes:
            status === "missing"
              ? []
              : data.mailboxes.map((m) => ({ ...m, status: status as "error" | "disconnected" })),
        };
      };
      vi.spyOn(mailReadSource, "create").mockResolvedValue({
        ...seed,
        recordAddressLookup: { findByAddress: async () => [] },
        canReadRecord: () => false,
        readContent: async () => ({ body: "", unread: false }),
      });
      expect(await (await request()).json()).toEqual({ connected: false, data: [] });
    },
  );
  it("enforces core private/shared and current linked-record access even for admin", async () => {
    const seed = await createMailSeed(ctx, { includeMessages: true });
    const repository = seed.repository;
    await repository.createMailbox({
      organizationId: ctx.orgId,
      id: "other-mailbox",
      ownerUserId: "other-user",
      provider: "google",
      status: "connected",
      credentialRef: null,
      lastSyncAt: null,
      lastError: null,
    });
    const template = (await repository.read(ctx.orgId)).messages[0];
    if (!template) throw new Error("Missing seed message.");
    for (const id of ["private", "shared", "unreadable"]) {
      await repository.upsertMessage({
        ...template,
        id,
        providerMessageKey: id,
        mailboxId: "other-mailbox",
        threadId: null,
        sentAt: "2026-02-01T10:00:00+02:00",
      });
      if (id !== "private") {
        await repository.setShared(ctx.orgId, id, true);
        await repository.putLink({
          organizationId: ctx.orgId,
          messageId: id,
          module: "leads",
          recordId: id,
          source: "manual",
          ambiguous: false,
        });
      }
    }
    const readContent = vi.fn(async (_id: string) => ({ body: "Authorized body", unread: false }));
    let allowed = true;
    vi.spyOn(mailReadSource, "create").mockResolvedValue({
      repository,
      recordAddressLookup: { findByAddress: async () => [] },
      canReadRecord: (_ctx, _module, id) => allowed && id === "shared",
      readContent,
    });
    const { data } = await (await request()).json();
    expect(data.map((c: { id: string }) => c.id)).toEqual(["shared", "thread-demo"]);
    expect(readContent.mock.calls.flat()).not.toContain("private");
    expect(readContent.mock.calls.flat()).not.toContain("unreadable");
    allowed = false;
    expect((await (await request()).json()).data.map((c: { id: string }) => c.id)).toEqual([
      "thread-demo",
    ]);
  });
  it("rejects foreign-tenant rows even if the repository returns them", async () => {
    const seed = await createMailSeed(ctx, { includeMessages: true });
    const foreign = await createMailSeed(
      { ...ctx, orgId: "foreign-org" },
      { includeMessages: true },
    );
    const foreignRows = await foreign.repository.read("foreign-org");
    const read = seed.repository.read.bind(seed.repository);
    seed.repository.read = async (org) => {
      const local = await read(org);
      return {
        ...local,
        messages: [
          ...local.messages,
          ...foreignRows.messages.map((m) => ({ ...m, id: `foreign-${m.id}` })),
        ],
      };
    };
    const readContent = vi.fn(async (_id: string) => ({ body: "Example", unread: false }));
    vi.spyOn(mailReadSource, "create").mockResolvedValue({
      ...seed,
      recordAddressLookup: { findByAddress: async () => [] },
      canReadRecord: () => true,
      readContent,
    });
    const { data } = await (await request()).json();
    expect(data).toHaveLength(1);
    expect(readContent.mock.calls.flat().some((id) => id.startsWith("foreign-"))).toBe(false);
  });
});

const recordRequest = (query = "module=Leads&recordId=record-example") =>
  GET(
    new Request(`http://crm.test/crm/v2.2/mail/conversations?${query}`, {
      headers: { "X-CRM-ORG": "example" },
    }),
    {},
  );

async function recordSource() {
  const seed = await createMailSeed(ctx, { includeMessages: true });
  const canReadRecord = vi.fn(() => true);
  const readContent = vi.fn(async (_id: string) => ({ body: "Example body", unread: false }));
  vi.spyOn(mailReadSource, "create").mockResolvedValue({
    ...seed,
    recordAddressLookup: { findByAddress: async () => [] },
    canReadRecord,
    readContent,
  });
  return { ...seed, canReadRecord, readContent };
}

describe("record-linked mail conversations", () => {
  it.each(["Leads", "Contacts", "Accounts", "Deals"])(
    "lists linked %s mail newest first",
    async (module) => {
      const { repository, canReadRecord } = await recordSource();
      for (const messageId of ["message-demo-1", "message-demo-sent"]) {
        await repository.putLink({
          organizationId: ctx.orgId,
          messageId,
          module: module.toLowerCase() as "leads" | "contacts" | "accounts" | "deals",
          recordId: "record-example",
          source: "manual",
          ambiguous: false,
        });
      }
      const response = await recordRequest(`module=${module}&recordId=record-example`);
      expect(response.status).toBe(200);
      expect(response.headers.get("cache-control")).toBe("no-store");
      const body = await response.json();
      expect(body.connected).toBe(true);
      expect(body.data.map((r: { id: string }) => r.id)).toEqual([
        "message-demo-sent",
        "thread-demo",
      ]);
      // The other message in the same thread is not linked and must not leak.
      expect(body.data[1].messages.map((m: { id: string }) => m.id)).toEqual(["message-demo-1"]);
      expect(canReadRecord).toHaveBeenCalledWith(ctx, module.toLowerCase(), "record-example");
    },
  );
  it("keeps record checks ahead of disconnected mailbox responses", async () => {
    const { repository, canReadRecord, readContent } = await recordSource();
    const read = repository.read.bind(repository);
    repository.read = async (org) => ({ ...(await read(org)), mailboxes: [] });
    expect(await (await recordRequest()).json()).toEqual({ connected: false, data: [] });
    canReadRecord.mockReturnValue(false);
    expect((await recordRequest()).status).toBe(404);
    expect(readContent).not.toHaveBeenCalled();
  });
  it("matches both module and record id on links", async () => {
    const { repository } = await recordSource();
    for (const target of [
      { module: "contacts" as const, recordId: "record-example" },
      { module: "leads" as const, recordId: "other-record" },
    ])
      await repository.putLink({
        ...target,
        organizationId: ctx.orgId,
        messageId: "message-demo-1",
        source: "auto",
        ambiguous: false,
      });
    expect(await (await recordRequest()).json()).toEqual({ connected: true, data: [] });
  });
  it("returns empty for a readable record without linked mail", async () => {
    await recordSource();
    expect(await (await recordRequest()).json()).toEqual({ connected: true, data: [] });
  });
  it.each([
    "module=Leads",
    "recordId=record-example",
    "module=Unknown&recordId=x",
    "module=leads&recordId=x",
    "module=Leads&recordId=",
    "module=Leads&recordId=%20",
    "folder=inbox&module=Leads&recordId=x",
    "folder=&module=Leads&recordId=x",
    `module=Leads&recordId=${"x".repeat(257)}`,
  ])("rejects invalid record scope %s", async (query) => {
    const source = vi.spyOn(mailReadSource, "create");
    const response = await recordRequest(query);
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      code: "INVALID_DATA",
      details: {
        fields: {
          module: expect.any(Array),
          recordId: expect.any(Array),
        },
      },
    });
    expect(source).not.toHaveBeenCalled();
  });
  it("returns 404 before reading content when record is missing or unreadable", async () => {
    const { canReadRecord, readContent } = await recordSource();
    canReadRecord.mockReturnValue(false);
    const response = await recordRequest();
    expect(response.status).toBe(404);
    expect(readContent).not.toHaveBeenCalled();
  });
  it("checks real fixture record existence", async () => {
    expect((await recordRequest("module=Deals&recordId=missing-record")).status).toBe(404);
  });
  it("filters private mail and foreign links before reading content", async () => {
    const { repository, readContent } = await recordSource();
    await repository.createMailbox({
      organizationId: ctx.orgId,
      id: "other-mailbox",
      ownerUserId: "other-user",
      provider: "google",
      status: "connected",
      credentialRef: null,
      lastSyncAt: null,
      lastError: null,
    });
    const template = (await repository.read(ctx.orgId)).messages[0];
    if (!template) throw new Error("Missing seed");
    for (const id of ["private-linked", "shared-linked"]) {
      await repository.upsertMessage({
        ...template,
        id,
        providerMessageKey: id,
        mailboxId: "other-mailbox",
        threadId: null,
        sharedByOwner: false,
      });
      if (id === "shared-linked") await repository.setShared(ctx.orgId, id, true);
      await repository.putLink({
        organizationId: ctx.orgId,
        messageId: id,
        module: "leads",
        recordId: "record-example",
        source: "auto",
        ambiguous: false,
      });
    }
    const read = repository.read.bind(repository);
    repository.read = async (org) => {
      const snapshot = await read(org);
      return {
        ...snapshot,
        links: [
          ...snapshot.links,
          {
            organizationId: "foreign-org",
            messageId: "message-demo-1",
            module: "leads" as const,
            recordId: "record-example",
            source: "manual" as const,
            ambiguous: false,
          },
        ],
      };
    };
    const { data } = await (await recordRequest()).json();
    expect(data.map((r: { id: string }) => r.id)).toEqual(["shared-linked"]);
    expect(readContent.mock.calls.flat()).toEqual(["shared-linked"]);
  });
});
