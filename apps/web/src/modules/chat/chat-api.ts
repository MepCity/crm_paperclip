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
  ChatMessageWire,
  ChatSyncResponse,
} from "@/lib/api/wire/chat";
import type { PresenceStatus } from "./data";

const BASE = "/crm/v2.2/chat";

export interface ChatApi {
  sync(cursor: number, signal?: AbortSignal): Promise<ChatSyncResponse>;
  contacts(category: "frequent" | "recent"): Promise<ChatContactWire[]>;
  createDirect(userId: string): Promise<ChatConversationWire>;
  createGroup(name: string, memberUserIds: string[]): Promise<ChatConversationWire>;
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
  };
}
