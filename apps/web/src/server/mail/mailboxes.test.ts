import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ctx = {
  orgId: "org-example",
  orgSlug: "example",
  orgName: "Example",
  userId: "user-example",
  role: "admin" as const,
};

let mockSessionUser: { id: string; email?: string | null; name?: string | null } | null = {
  id: ctx.userId,
  email: "user@example.test",
  name: "User Example",
};

let mockMembers: Array<{ userId: string; email: string; name?: string; role: string }> = [];

vi.mock("@crm/core", async (original) => ({
  ...(await original<typeof import("@crm/core")>()),
  getSession: vi.fn(async () => (mockSessionUser ? { user: mockSessionUser } : null)),
  listMembers: vi.fn(async () => mockMembers),
  requireOrgContext: vi.fn(async (_h: Headers, slug: string) => {
    if (slug !== ctx.orgSlug) {
      const { NotFoundError } = await import("@crm/core/errors");
      throw new NotFoundError();
    }
    return ctx;
  }),
}));

import { getSession } from "@crm/core";
import { GET } from "@/app/crm/v2.2/mail/mailboxes/route";
import { POST } from "@/app/crm/v2.2/mail/messages/route";
import { getMailState } from "./state";
import { mailWriteSource } from "./write";

const getMailboxes = (headers: Record<string, string> = { "X-CRM-ORG": "example" }, query = "") =>
  GET(new Request(`http://crm.test/crm/v2.2/mail/mailboxes${query}`, { headers }), {});

const postMessage = (
  mailboxId: string,
  headers: Record<string, string> = {
    Origin: "http://localhost:3000",
    "X-CRM-ORG": "example",
  },
) =>
  POST(
    new Request("http://crm.test/crm/v2.2/mail/messages", {
      method: "POST",
      headers,
      body: JSON.stringify({
        idempotencyKey: crypto.randomUUID(),
        mailboxId,
        from: { address: "user@example.test" },
        to: [{ address: "recipient@example.test" }],
        subject: "Test Subject",
        body: "Test Body",
      }),
    }),
    { params: Promise.resolve({ id: "message-1" }) },
  );

const makeBox = (
  overrides: Partial<{
    organizationId: string;
    id: string;
    ownerUserId: string;
    provider: "google";
    status: "connected" | "disconnected" | "error";
    credentialRef: string | null;
    lastSyncAt: string | null;
    lastError: string | null;
    syncWindowDays: number;
    folders: ("draft" | "inbox" | "sent")[];
  }> = {},
) => ({
  organizationId: ctx.orgId,
  id: "mailbox-default",
  ownerUserId: ctx.userId,
  provider: "google" as const,
  status: "connected" as const,
  credentialRef: null,
  lastSyncAt: null,
  lastError: null,
  syncWindowDays: 30,
  folders: ["inbox", "sent"] as ("draft" | "inbox" | "sent")[],
  ...overrides,
});

beforeEach(() => {
  vi.stubEnv("APP_URL", "http://localhost:3000");
  vi.stubEnv("DATABASE_URL", "postgres://localhost/example");
  vi.stubEnv("APP_SECRET", "x".repeat(40));
  vi.stubEnv("MAIL_TEST_RECIPIENT", "recipient@example.test");
  mockSessionUser = {
    id: ctx.userId,
    email: "user@example.test",
    name: "User Example",
  };
  mockMembers = [];
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});

describe("GET /crm/v2.2/mail/mailboxes", () => {
  it("returns 200 with Cache-Control: no-store and exact key set", async () => {
    const res = await getMailboxes();
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("no-store");
    const json = await res.json();
    expect(Array.isArray(json.data)).toBe(true);
    expect(json.data.length).toBeGreaterThanOrEqual(1);

    for (const item of json.data) {
      const keys = Object.keys(item);
      expect(keys).toContain("id");
      expect(keys).toContain("address");
      for (const k of keys) {
        expect(["id", "address", "name"]).toContain(k);
      }
    }

    const raw = JSON.stringify(json.data);
    expect(raw).not.toMatch(
      /ownerUserId|organizationId|provider|credentialRef|lastSyncAt|lastError|syncSettings/,
    );
  });

  it("lists only connected mailboxes owned by the actor in current org, sorted by id", async () => {
    const state = await getMailState(ctx);
    const originalRead = state.repository.read.bind(state.repository);

    vi.spyOn(state.repository, "read").mockImplementation(async (orgId) => {
      const snapshot = await originalRead(orgId);
      return {
        ...snapshot,
        mailboxes: [
          makeBox({ id: "mailbox-zzz" }),
          makeBox({ id: "mailbox-aaa" }),
          makeBox({ id: "mailbox-disconnected", status: "disconnected" }),
          makeBox({ id: "mailbox-error", status: "error" }),
          makeBox({ id: "mailbox-other-user", ownerUserId: "other-user-id" }),
          makeBox({ organizationId: "other-org-id", id: "mailbox-other-tenant" }),
        ],
      };
    });

    const res = await getMailboxes();
    expect(res.status).toBe(200);
    const json = await res.json();
    const ids = json.data.map((m: { id: string }) => m.id);

    expect(ids).toEqual(["mailbox-aaa", "mailbox-zzz"]);
  });

  it("derives address and name from session user", async () => {
    mockSessionUser = {
      id: ctx.userId,
      email: "actor@example.com",
      name: "Actor Display Name",
    };
    const res = await getMailboxes();
    const json = await res.json();
    const item = json.data.find((m: { id: string }) => m.id === "mailbox-demo");
    expect(item).toMatchObject({
      id: "mailbox-demo",
      address: "actor@example.com",
      name: "Actor Display Name",
    });
  });

  it("omits name key when actor has no name", async () => {
    mockSessionUser = {
      id: ctx.userId,
      email: "noname@example.com",
      name: null,
    };
    const res = await getMailboxes();
    const json = await res.json();
    const item = json.data.find((m: { id: string }) => m.id === "mailbox-demo");
    expect(item).toEqual({
      id: "mailbox-demo",
      address: "noname@example.com",
    });
    expect(item).not.toHaveProperty("name");
  });

  it("falls back to listMembers when session user lacks email", async () => {
    mockSessionUser = {
      id: ctx.userId,
      email: null,
      name: null,
    };
    mockMembers = [
      {
        userId: ctx.userId,
        email: "member@example.com",
        name: "Member Name",
        role: "admin",
      },
    ];
    const res = await getMailboxes();
    const json = await res.json();
    const item = json.data.find((m: { id: string }) => m.id === "mailbox-demo");
    expect(item).toMatchObject({
      id: "mailbox-demo",
      address: "member@example.com",
      name: "Member Name",
    });
  });

  it("returns 200 with empty data when actor has no usable email", async () => {
    mockSessionUser = {
      id: ctx.userId,
      email: "invalid-email-no-at",
      name: "No Email User",
    };
    const res = await getMailboxes();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ data: [] });
  });

  it("ignores unknown query parameters and does not echo them", async () => {
    const res = await getMailboxes({ "X-CRM-ORG": "example" }, "?foo=bar&unknown=true");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).not.toHaveProperty("foo");
    expect(json).not.toHaveProperty("unknown");
    expect(Array.isArray(json.data)).toBe(true);
  });

  it("requires session and tenant before reading", async () => {
    vi.mocked(getSession).mockResolvedValueOnce(null as never);
    expect((await getMailboxes()).status).toBe(401);
    expect((await getMailboxes({} as never)).status).toBe(400);
    expect((await getMailboxes({ "X-CRM-ORG": "other" })).status).toBe(404);
  });

  it("is read-only: does not modify mailboxes or outbox on GET", async () => {
    const state = await getMailState(ctx);
    const before = await state.repository.read(ctx.orgId);
    await getMailboxes();
    const after = await state.repository.read(ctx.orgId);
    expect(after.mailboxes.length).toBe(before.mailboxes.length);
    expect(after.outbox.length).toBe(before.outbox.length);
  });
});

describe("POST /crm/v2.2/mail/messages forged mailboxId validation", () => {
  it("rejects forged foreign user mailbox with 403 Forbidden", async () => {
    const state = await getMailState(ctx);
    const originalRead = state.repository.read.bind(state.repository);
    vi.spyOn(state.repository, "read").mockImplementation(async (orgId) => {
      const snap = await originalRead(orgId);
      return {
        ...snap,
        mailboxes: [
          ...snap.mailboxes,
          makeBox({
            id: "forged-other-user",
            ownerUserId: "foreign-user-id",
          }),
        ],
      };
    });
    vi.spyOn(mailWriteSource, "create").mockResolvedValue({
      ...state,
      recordAddressLookup: { findByAddress: async () => [] },
      canReadRecord: vi.fn(async () => true),
      readContent: async () => ({ body: "", unread: false }),
    });

    const res = await postMessage("forged-other-user");
    expect(res.status).toBe(403);
  });

  it("rejects non-existent or other-tenant mailbox with 404 Not Found", async () => {
    const state = await getMailState(ctx);
    const originalRead = state.repository.read.bind(state.repository);
    vi.spyOn(state.repository, "read").mockImplementation(async (orgId) => {
      const snap = await originalRead(orgId);
      return {
        ...snap,
        mailboxes: [
          ...snap.mailboxes,
          makeBox({
            organizationId: "other-tenant",
            id: "forged-other-org",
          }),
        ],
      };
    });
    vi.spyOn(mailWriteSource, "create").mockResolvedValue({
      ...state,
      recordAddressLookup: { findByAddress: async () => [] },
      canReadRecord: vi.fn(async () => true),
      readContent: async () => ({ body: "", unread: false }),
    });

    expect((await postMessage("non-existent-box")).status).toBe(404);
    expect((await postMessage("forged-other-org")).status).toBe(404);
  });

  it("rejects disconnected mailbox with 400 Validation Error", async () => {
    const state = await getMailState(ctx);
    const originalRead = state.repository.read.bind(state.repository);
    vi.spyOn(state.repository, "read").mockImplementation(async (orgId) => {
      const snap = await originalRead(orgId);
      return {
        ...snap,
        mailboxes: [
          makeBox({
            id: "disconnected-box",
            status: "disconnected",
          }),
        ],
      };
    });
    vi.spyOn(mailWriteSource, "create").mockResolvedValue({
      ...state,
      recordAddressLookup: { findByAddress: async () => [] },
      canReadRecord: vi.fn(async () => true),
      readContent: async () => ({ body: "", unread: false }),
    });

    const res = await postMessage("disconnected-box");
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.details?.fields?.mailboxId?.[0]).toContain("not connected");
  });
});
