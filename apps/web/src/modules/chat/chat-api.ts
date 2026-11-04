/**
 * HTTP client for the internal chat API (ADR 0015 §8, base `/crm/v2.2/chat`).
 * Types come from the wire file owned by the backend issue.
 *
 * Refs: MEP-1420
 */
import { type ApiFetchFn, apiFetch } from "@/lib/api/client/fetch";
import type {
  ChatContactWire,
  ChatConversationWire,
  ChatMemberWire,
  ChatMessageWire,
  ChatSearchFilters,
  ChatSyncResponse,
} from "@/lib/api/wire/chat";
import type { PresenceStatus } from "./data";

const BASE = "/crm/v2.2/chat";

export interface ChatApi {
  sync(cursor: number, signal?: AbortSignal): Promise<ChatSyncResponse>;
  contacts(category: "frequent" | "recent"): Promise<ChatContactWire[]>;
  createDirect(userId: string): Promise<ChatConversationWire>;
  createGroup(name: string, memberUserIds: string[]): Promise<ChatConversationWire>;
  createChannel(
    name: string,
    visibility: "public" | "private",
    memberUserIds?: string[],
  ): Promise<ChatConversationWire>;
  updateConversation(
    conversationId: string,
    input: { name?: string; archived?: boolean },
  ): Promise<ChatConversationWire>;
  addMember(
    conversationId: string,
    userId: string,
    role?: "owner" | "member",
  ): Promise<ChatMemberWire>;
  removeMember(conversationId: string, userId: string): Promise<void>;
  pin(conversationId: string, pin: boolean): Promise<void>;
  listConversations(): Promise<ChatConversationWire[]>;
  messages(
    conversationId: string,
    before?: number,
  ): Promise<{ messages: ChatMessageWire[]; hasMore: boolean }>;
  postMessage(
    conversationId: string,
    input: { body: string; mentions: string[]; clientId: string },
  ): Promise<ChatMessageWire>;
  editMessage(
    messageId: string,
    input: { body: string; mentions: string[] },
  ): Promise<ChatMessageWire>;
  deleteMessage(messageId: string): Promise<void>;
  star(messageId: string, star: boolean): Promise<void>;
  markRead(conversationId: string, seq: number): Promise<void>;
  setPresence(status: PresenceStatus): Promise<void>;
  replies(messageId: string): Promise<ChatMessageWire[]>;
  postReply(
    messageId: string,
    input: { body: string; mentions?: string[]; clientId?: string },
  ): Promise<ChatMessageWire>;
  markThreadRead(messageId: string): Promise<void>;
  threads(): Promise<ChatMessageWire[]>;
  mentions(): Promise<ChatMessageWire[]>;
  starred(): Promise<ChatMessageWire[]>;
  search(filters: ChatSearchFilters): Promise<{ messages: ChatMessageWire[]; hasMore: boolean }>;
}

/** Builds the API over the shared same-origin fetch helper (session cookie, org header). */
export function createChatApi(orgSlug: string, fetchFn?: ApiFetchFn): ChatApi {
  const call: ApiFetchFn = fetchFn ?? ((path, options) => apiFetch(orgSlug, path, options));
  return {
    sync: (cursor, signal) =>
      call(`${BASE}/sync?cursor=${cursor}`, { signal }) as Promise<ChatSyncResponse>,
    contacts: (category) =>
      call(`${BASE}/contacts?category=${category}`) as Promise<ChatContactWire[]>,
    createDirect: (userId) =>
      call(`${BASE}/conversations`, {
        method: "POST",
        body: { kind: "direct", userId },
      }) as Promise<ChatConversationWire>,
    createGroup: (name, memberUserIds) =>
      call(`${BASE}/conversations`, {
        method: "POST",
        body: { kind: "group", name, memberUserIds },
      }) as Promise<ChatConversationWire>,
    createChannel: (name, visibility, memberUserIds) =>
      call(`${BASE}/conversations`, {
        method: "POST",
        body: { kind: "channel", name, visibility, memberUserIds },
      }) as Promise<ChatConversationWire>,
    updateConversation: (conversationId, input) =>
      call(`${BASE}/conversations/${conversationId}`, {
        method: "PATCH",
        body: input,
      }) as Promise<ChatConversationWire>,
    addMember: (conversationId, userId, role = "member") =>
      call(`${BASE}/conversations/${conversationId}/members`, {
        method: "POST",
        body: { userId, role },
      }) as Promise<ChatMemberWire>,
    removeMember: async (conversationId, userId) => {
      await call(`${BASE}/conversations/${conversationId}/members/${userId}`, { method: "DELETE" });
    },
    pin: async (conversationId, pin) => {
      await call(`${BASE}/conversations/${conversationId}/pin`, {
        method: pin ? "PUT" : "DELETE",
      });
    },
    listConversations: () => call(`${BASE}/conversations`) as Promise<ChatConversationWire[]>,
    messages: (conversationId, before) =>
      call(
        `${BASE}/conversations/${conversationId}/messages?limit=50${
          before === undefined ? "" : `&before=${before}`
        }`,
      ) as Promise<{ messages: ChatMessageWire[]; hasMore: boolean }>,
    postMessage: (conversationId, input) =>
      call(`${BASE}/conversations/${conversationId}/messages`, {
        method: "POST",
        body: input,
      }) as Promise<ChatMessageWire>,
    editMessage: (messageId, input) =>
      call(`${BASE}/messages/${messageId}`, {
        method: "PATCH",
        body: input,
      }) as Promise<ChatMessageWire>,
    deleteMessage: async (messageId) => {
      await call(`${BASE}/messages/${messageId}`, { method: "DELETE" });
    },
    star: async (messageId, star) => {
      await call(`${BASE}/messages/${messageId}/star`, { method: star ? "PUT" : "DELETE" });
    },
    markRead: async (conversationId, seq) => {
      await call(`${BASE}/conversations/${conversationId}/read`, {
        method: "POST",
        body: { seq },
      });
    },
    setPresence: async (status) => {
      await call(`${BASE}/presence`, { method: "PUT", body: { status } });
    },
    replies: (messageId) =>
      call(`${BASE}/messages/${messageId}/replies`) as Promise<ChatMessageWire[]>,
    postReply: (messageId, input) =>
      call(`${BASE}/messages/${messageId}/replies`, {
        method: "POST",
        body: input,
      }) as Promise<ChatMessageWire>,
    markThreadRead: async (messageId) => {
      await call(`${BASE}/messages/${messageId}/thread-read`, { method: "POST" });
    },
    threads: () => call(`${BASE}/threads`) as Promise<ChatMessageWire[]>,
    mentions: () => call(`${BASE}/mentions`) as Promise<ChatMessageWire[]>,
    starred: () => call(`${BASE}/starred`) as Promise<ChatMessageWire[]>,
    search: (filters) => {
      const sp = new URLSearchParams();
      if (filters.q) sp.set("q", filters.q);
      if (filters.from) sp.set("from", filters.from);
      if (filters.in) sp.set("in", filters.in);
      if (filters.type) sp.set("type", filters.type);
      if (filters.after) sp.set("after", filters.after);
      if (filters.before) sp.set("before", filters.before);
      if (filters.hasLink) sp.set("hasLink", "true");
      if (filters.hasMention) sp.set("hasMention", "true");
      if (filters.limit) sp.set("limit", String(filters.limit));
      if (filters.offset) sp.set("offset", String(filters.offset));
      return call(`${BASE}/search?${sp.toString()}`) as Promise<{
        messages: ChatMessageWire[];
        hasMore: boolean;
      }>;
    },
  };
}
