import { randomUUID } from "node:crypto";
import type { OrgContext } from "@crm/core";
import { NotFoundError } from "@crm/core/errors";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET as getContacts } from "./contacts/route";
import { POST as postMessage } from "./conversations/[id]/messages/route";
import {
  PUT as pinConversation,
  DELETE as unpinConversation,
} from "./conversations/[id]/pin/route";
import { POST as markRead } from "./conversations/[id]/read/route";
import { POST as createConversation, GET as listConversations } from "./conversations/route";
import { PUT as starMessage, DELETE as unstarMessage } from "./messages/[id]/star/route";
import { PUT as setPresence } from "./presence/route";
import { GET as search } from "./search/route";
import { GET as sync } from "./sync/route";

const auth = vi.hoisted(() => ({ contexts: new Map<string, OrgContext>() }));

vi.mock("@crm/core", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@crm/core")>();
  return {
    ...actual,
    getSession: vi.fn(async (headers: Headers) =>
      headers.get("cookie") ? { user: { id: "user-123" } } : null,
    ),
    requireOrgContext: vi.fn(async (_headers: Headers, slug: string) => {
      const ctx = auth.contexts.get(slug);
      if (!ctx) throw new NotFoundError();
      return ctx;
    }),
    parseEnv: vi.fn(() => ({ APP_URL: "http://app.test" })),
  };
});

const mockChat = vi.hoisted(() => ({
  sync: vi.fn(async () => ({
    cursor: 10,
    hasMore: false,
    conversations: [],
    members: [],
    messages: [],
    threadReads: [],
    presence: [],
    badges: { unreadChats: 0, unreadThreads: 0, unreadPins: 0, unreadMentions: 0, unreadTotal: 0 },
  })),
  listConversations: vi.fn(async () => []),
  createConversation: vi.fn(async (_ctx: OrgContext, input: unknown) => ({
    id: "conv-1",
    kind: "channel",
    name: "General",
    input,
  })),
  getConversation: vi.fn(async () => ({ id: "conv-1", kind: "channel" })),
  updateConversation: vi.fn(async () => ({ id: "conv-1", name: "Updated" })),
  addMember: vi.fn(async () => ({ userId: "u2", role: "member" })),
  removeMember: vi.fn(async () => undefined),
  markConversationRead: vi.fn(async () => undefined),
  pinConversation: vi.fn(async () => undefined),
  getMessages: vi.fn(async () => ({ messages: [], hasMore: false })),
  postMessage: vi.fn(async (_ctx: OrgContext, _id: string, input: unknown) => ({
    id: "msg-1",
    body: "test",
    input,
  })),
  editMessage: vi.fn(async () => ({ id: "msg-1", body: "edited" })),
  deleteMessage: vi.fn(async () => undefined),
  getReplies: vi.fn(async () => []),
  postReply: vi.fn(async () => ({ id: "reply-1", body: "reply" })),
  markThreadRead: vi.fn(async () => undefined),
  starMessage: vi.fn(async () => undefined),
  listStarredMessages: vi.fn(async () => []),
  listMentions: vi.fn(async () => []),
  listThreads: vi.fn(async () => []),
  listContacts: vi.fn(async () => []),
  setPresence: vi.fn(async () => undefined),
  search: vi.fn(async () => ({ messages: [], hasMore: false })),
}));

vi.mock("@crm/core/chat", () => ({
  getChatService: () => mockChat,
}));

let ctx: OrgContext;

async function call<Params extends Record<string, string> = Record<string, string>>(
  handler: (request: Request, context: { params?: Promise<Params> }) => Promise<Response>,
  method: string,
  options: {
    body?: unknown;
    raw?: string;
    query?: string;
    params?: Params;
    org?: string | null;
    session?: boolean;
    origin?: string | null;
  } = {},
) {
  const headers = new Headers();
  if (options.session !== false) headers.set("cookie", "test-session");
  if (options.org !== null) headers.set("X-CRM-ORG", options.org ?? ctx.orgSlug);
  if (options.origin !== null) headers.set("Origin", options.origin ?? "http://app.test");

  return handler(
    new Request(`http://app.test/crm/v2.2/chat/route?${options.query ?? ""}`, {
      method,
      headers,
      body: options.raw ?? (options.body === undefined ? undefined : JSON.stringify(options.body)),
    }),
    {
      params: options.params ? Promise.resolve(options.params) : undefined,
    },
  );
}

async function expectError(response: Response, status: number) {
  expect(response.status).toBe(status);
  expect(response.headers.get("Cache-Control")).toBe("no-store");
  const json = await response.json();
  expect(json.status).toBe("error");
  expect(json.code).toBeDefined();
  return json;
}

beforeEach(() => {
  ctx = {
    orgId: randomUUID(),
    orgSlug: `slug-${randomUUID().slice(0, 8)}`,
    orgName: "Test Org",
    userId: "user-123",
    role: "admin",
  };
  auth.contexts.set(ctx.orgSlug, ctx);
  vi.clearAllMocks();
});

describe("chat API route handlers", () => {
  it("enforces session authentication", async () => {
    const res = await call(listConversations, "GET", { session: false });
    const err = await expectError(res, 401);
    expect(err.code).toBe("AUTHENTICATION_FAILURE");
  });

  it("enforces X-CRM-ORG header presence", async () => {
    const res = await call(listConversations, "GET", { org: null });
    const err = await expectError(res, 400);
    expect(err.code).toBe("INVALID_DATA");
    expect(err.details?.fields?.organization).toBeDefined();
  });

  it("enforces same-origin policy on write operations", async () => {
    const res = await call(createConversation, "POST", {
      origin: "http://evil.attacker.com",
      body: { kind: "channel", name: "Hacked", visibility: "public" },
    });
    const err = await expectError(res, 403);
    expect(err.code).toBe("NO_PERMISSION");
  });

  it("rejects invalid JSON body", async () => {
    const res = await call(createConversation, "POST", { raw: "invalid-json{" });
    const err = await expectError(res, 400);
    expect(err.code).toBe("INVALID_DATA");
    expect(err.details?.fields?.body).toBeDefined();
  });

  it("validates createConversation parameters", async () => {
    // Missing required fields for channel
    const badChannel = await call(createConversation, "POST", {
      body: { kind: "channel" },
    });
    const err1 = await expectError(badChannel, 400);
    expect(err1.code).toBe("INVALID_DATA");
    expect(err1.details?.fields?.name).toBeDefined();
    expect(err1.details?.fields?.visibility).toBeDefined();

    // Direct chat missing userId
    const badDirect = await call(createConversation, "POST", {
      body: { kind: "direct" },
    });
    const err2 = await expectError(badDirect, 400);
    expect(err2.code).toBe("INVALID_DATA");
    expect(err2.details?.fields?.userId).toBeDefined();

    // Group chat with insufficient members
    const badGroup = await call(createConversation, "POST", {
      body: { kind: "group", name: "Small", memberUserIds: [randomUUID()] },
    });
    const err3 = await expectError(badGroup, 400);
    expect(err3.code).toBe("INVALID_DATA");
    expect(err3.details?.fields?.memberUserIds).toBeDefined();

    // Valid channel creation
    const valid = await call(createConversation, "POST", {
      body: { kind: "channel", name: "Engineering", visibility: "public" },
    });
    expect(valid.status).toBe(200);
    expect(valid.headers.get("Cache-Control")).toBe("no-store");
  });

  it("validates postMessage parameters", async () => {
    // Empty body
    const badMsg = await call(postMessage, "POST", {
      params: { id: "conv-1" },
      body: { body: "" },
    });
    const err = await expectError(badMsg, 400);
    expect(err.code).toBe("INVALID_DATA");
    expect(err.details?.fields?.body).toBeDefined();

    // Valid body
    const validMsg = await call(postMessage, "POST", {
      params: { id: "conv-1" },
      body: { body: "Hello world!" },
    });
    expect(validMsg.status).toBe(200);
    expect(mockChat.postMessage).toHaveBeenCalledWith(
      expect.objectContaining({ orgId: ctx.orgId }),
      "conv-1",
      expect.objectContaining({ body: "Hello world!" }),
    );
  });

  it("validates markRead sequence", async () => {
    const badRead = await call(markRead, "POST", {
      params: { id: "conv-1" },
      body: { seq: -1 },
    });
    const err = await expectError(badRead, 400);
    expect(err.code).toBe("INVALID_DATA");
    expect(err.details?.fields?.seq).toBeDefined();

    const validRead = await call(markRead, "POST", {
      params: { id: "conv-1" },
      body: { seq: 5 },
    });
    expect(validRead.status).toBe(204);
  });

  it("validates presence status", async () => {
    const badPres = await call(setPresence, "PUT", {
      body: { status: "sleeping" },
    });
    const err = await expectError(badPres, 400);
    expect(err.code).toBe("INVALID_DATA");
    expect(err.details?.fields?.status).toBeDefined();

    const validPres = await call(setPresence, "PUT", {
      body: { status: "available" },
    });
    expect(validPres.status).toBe(204);
  });

  it("handles GET routes with parameters and query options", async () => {
    const syncRes = await call(sync, "GET", { query: "cursor=42" });
    expect(syncRes.status).toBe(200);
    expect(mockChat.sync).toHaveBeenCalledWith(expect.anything(), 42);

    const contactsRes = await call(getContacts, "GET", { query: "category=recent" });
    expect(contactsRes.status).toBe(200);
    expect(mockChat.listContacts).toHaveBeenCalledWith(expect.anything(), "recent");

    const searchRes = await call(search, "GET", { query: "q=project&hasLink=true" });
    expect(searchRes.status).toBe(200);
    expect(mockChat.search).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ q: "project", hasLink: true }),
    );
  });

  it("handles pin/unpin and star/unstar routes with 204 response", async () => {
    const pinRes = await call(pinConversation, "PUT", { params: { id: "conv-1" } });
    expect(pinRes.status).toBe(204);

    const unpinRes = await call(unpinConversation, "DELETE", { params: { id: "conv-1" } });
    expect(unpinRes.status).toBe(204);

    const starRes = await call(starMessage, "PUT", { params: { id: "msg-1" } });
    expect(starRes.status).toBe(204);

    const unstarRes = await call(unstarMessage, "DELETE", { params: { id: "msg-1" } });
    expect(unstarRes.status).toBe(204);
  });
});
