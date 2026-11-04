/**
 * Client store for the chat panel: pure merge functions and selectors over the
 * `GET /chat/sync` responses (ADR 0015 §2–§4). No React, no fetch — the hook in
 * `use-chat-source.ts` owns the state and the polling.
 *
 * Refs: MEP-1420
 */
import type {
  ChatBadgesWire,
  ChatContactWire,
  ChatConversationWire,
  ChatMemberWire,
  ChatMessageWire,
  ChatSyncResponse,
  ChatThreadReadWire,
} from "@/lib/api/wire/chat";
import type {
  ChatContact,
  ChatConversation,
  ChatCounts,
  ChatMemberView,
  ChatMessageView,
  ShownPresence,
} from "./data";

export interface PendingMessage {
  clientId: string;
  conversationId: string;
  body: string;
  mentions: string[];
  createdAt: string;
  status: "sending" | "failed";
}

export interface ChatState {
  cursor: number;
  loaded: boolean;
  conversations: Record<string, ChatConversationWire>;
  /** conversationId → userId → member row. */
  members: Record<string, Record<string, ChatMemberWire>>;
  /** conversationId → messageId → top-level message. */
  messages: Record<string, Record<string, ChatMessageWire>>;
  /** threadRootId → messageId → reply message. */
  replies: Record<string, Record<string, ChatMessageWire>>;
  /** threadRootId → thread read record. */
  threadReads: Record<string, ChatThreadReadWire>;
  presence: Record<string, ChatContactWire["status"] | "invisible">;
  badges: ChatBadgesWire;
  /** Highest `seq` the user read locally, ahead of the next sync. */
  localRead: Record<string, number>;
  /** Conversations whose older history is exhausted or not yet known. */
  historyDone: Record<string, boolean>;
  /** Conversations whose first history page was requested. */
  historyLoaded: Record<string, boolean>;
  pending: PendingMessage[];
  frequent: ChatContactWire[];
  recent: ChatContactWire[];
  threadsList: ChatMessageWire[];
  mentionsList: ChatMessageWire[];
  starredList: ChatMessageWire[];
}

export const EMPTY_BADGES: ChatBadgesWire = {
  unreadChats: 0,
  unreadChannels: 0,
  unreadThreads: 0,
  unreadPins: 0,
  unreadMentions: 0,
  unreadTotal: 0,
} as unknown as ChatBadgesWire;

export function createInitialState(): ChatState {
  return {
    cursor: 0,
    loaded: false,
    conversations: {},
    members: {},
    messages: {},
    replies: {},
    threadReads: {},
    presence: {},
    badges: EMPTY_BADGES,
    localRead: {},
    historyDone: {},
    historyLoaded: {},
    pending: [],
    frequent: [],
    recent: [],
    threadsList: [],
    mentionsList: [],
    starredList: [],
  };
}

/** Keeps the newer of two rows of the same entity. */
function newer<T extends { changedSeq: number }>(existing: T | undefined, incoming: T): T {
  if (!existing) return incoming;
  return incoming.changedSeq >= existing.changedSeq ? incoming : existing;
}

function putMessages(
  target: Record<string, Record<string, ChatMessageWire>>,
  incoming: readonly ChatMessageWire[],
): Record<string, Record<string, ChatMessageWire>> {
  let next = target;
  for (const message of incoming) {
    // Thread replies belong to the threads feature; the root row carries the counters.
    if (message.threadRootId || message.seq === null) continue;
    const bucket = next[message.conversationId] ?? {};
    const merged = newer(bucket[message.id], message);
    if (merged === bucket[message.id]) continue;
    next = { ...next, [message.conversationId]: { ...bucket, [message.id]: merged } };
  }
  return next;
}

function putReplies(
  target: Record<string, Record<string, ChatMessageWire>>,
  incoming: readonly ChatMessageWire[],
): Record<string, Record<string, ChatMessageWire>> {
  let next = target;
  for (const message of incoming) {
    if (!message.threadRootId) continue;
    const bucket = next[message.threadRootId] ?? {};
    const merged = newer(bucket[message.id], message);
    if (merged === bucket[message.id]) continue;
    next = { ...next, [message.threadRootId]: { ...bucket, [message.id]: merged } };
  }
  return next;
}

/** Merges one sync page into the store and advances the cursor. */
export function mergeSync(state: ChatState, response: ChatSyncResponse): ChatState {
  let conversations = state.conversations;
  for (const row of response.conversations) {
    conversations = { ...conversations, [row.id]: newer(conversations[row.id], row) };
  }
  let members = state.members;
  for (const row of response.members) {
    const bucket = members[row.conversationId] ?? {};
    members = {
      ...members,
      [row.conversationId]: { ...bucket, [row.userId]: newer(bucket[row.userId], row) },
    };
  }
  const messages = putMessages(state.messages, response.messages);
  const replies = putReplies(state.replies, response.messages);
  const threadReads = { ...state.threadReads };
  for (const row of response.threadReads ?? []) {
    threadReads[row.threadRootId] = row;
  }
  const presence = { ...state.presence };
  for (const row of response.presence) presence[row.userId] = row.status;

  let localRead = state.localRead;
  for (const [convId, localSeq] of Object.entries(localRead)) {
    const conv = conversations[convId];
    if (conv?.lastReadSeq !== undefined && conv.lastReadSeq >= localSeq) {
      if (localRead === state.localRead) localRead = { ...localRead };
      delete localRead[convId];
    }
  }

  return {
    ...state,
    cursor: Math.max(state.cursor, response.cursor),
    loaded: true,
    conversations,
    members,
    messages,
    replies,
    threadReads,
    presence,
    badges: response.badges,
    localRead,
  };
}

/** Merges replies for a thread root message. */
export function mergeReplies(
  state: ChatState,
  _threadRootId: string,
  rows: readonly ChatMessageWire[],
): ChatState {
  return {
    ...state,
    replies: putReplies(state.replies, rows),
  };
}

export function setThreads(state: ChatState, rows: ChatMessageWire[]): ChatState {
  return { ...state, threadsList: rows };
}

export function setMentions(state: ChatState, rows: ChatMessageWire[]): ChatState {
  return { ...state, mentionsList: rows };
}

export function setStarred(state: ChatState, rows: ChatMessageWire[]): ChatState {
  return { ...state, starredList: rows };
}

/** Merges a page of history (`GET …/messages`) and records whether more exists. */
export function mergeHistory(
  state: ChatState,
  conversationId: string,
  rows: readonly ChatMessageWire[],
  hasMore: boolean,
): ChatState {
  return {
    ...state,
    messages: putMessages(state.messages, rows),
    historyDone: { ...state.historyDone, [conversationId]: !hasMore },
    historyLoaded: { ...state.historyLoaded, [conversationId]: true },
  };
}

/** Inserts or replaces a single server message (own write answers). */
export function upsertMessage(state: ChatState, message: ChatMessageWire): ChatState {
  return { ...state, messages: putMessages(state.messages, [message]) };
}

export function setLocalRead(state: ChatState, conversationId: string, seq: number): ChatState {
  if ((state.localRead[conversationId] ?? 0) >= seq) return state;
  return { ...state, localRead: { ...state.localRead, [conversationId]: seq } };
}

/** Reverts an optimistic read if the network request fails and localRead has not advanced. */
export function revertLocalRead(
  state: ChatState,
  conversationId: string,
  failedSeq: number,
  previousSeq?: number,
): ChatState {
  if ((state.localRead[conversationId] ?? 0) !== failedSeq) return state;
  if (previousSeq === undefined) {
    if (!(conversationId in state.localRead)) return state;
    const { [conversationId]: _, ...rest } = state.localRead;
    return { ...state, localRead: rest };
  }
  return { ...state, localRead: { ...state.localRead, [conversationId]: previousSeq } };
}

/** Confirms a server-acknowledged read sequence and cleans up optimistic local state. */
export function confirmRead(
  state: ChatState,
  conversationId: string,
  selfId: string,
  seq: number,
): ChatState {
  const member = state.members[conversationId]?.[selfId];
  const conv = state.conversations[conversationId];
  if (!member && !conv) return state;

  let nextMembers = state.members;
  if (member && (member.lastReadSeq ?? 0) < seq) {
    nextMembers = {
      ...state.members,
      [conversationId]: {
        ...state.members[conversationId],
        [selfId]: { ...member, lastReadSeq: seq },
      },
    };
  }

  let nextConversations = state.conversations;
  if (conv && (conv.lastReadSeq ?? 0) < seq) {
    nextConversations = {
      ...state.conversations,
      [conversationId]: { ...conv, lastReadSeq: seq },
    };
  }

  let nextLocalRead = state.localRead;
  if (conversationId in state.localRead && (state.localRead[conversationId] ?? 0) <= seq) {
    const { [conversationId]: _, ...rest } = state.localRead;
    nextLocalRead = rest;
  }

  return {
    ...state,
    members: nextMembers,
    conversations: nextConversations,
    localRead: nextLocalRead,
  };
}

/** Highest sequence number confirmed by the server for self membership (ADR §3). */
export function serverReadSeq(state: ChatState, selfId: string, conversationId: string): number {
  const conversation = state.conversations[conversationId];
  if (!conversation) return 0;
  const member = state.members[conversationId]?.[selfId];
  if (!member && !conversation.membershipRole) return 0;
  if (member?.leftAt) return conversation.lastSeq;
  return Math.max(member?.lastReadSeq ?? 0, conversation.lastReadSeq ?? 0);
}

export function addPending(state: ChatState, pending: PendingMessage): ChatState {
  return { ...state, pending: [...state.pending, pending] };
}

export function setPendingStatus(
  state: ChatState,
  clientId: string,
  status: PendingMessage["status"],
): ChatState {
  return {
    ...state,
    pending: state.pending.map((p) => (p.clientId === clientId ? { ...p, status } : p)),
  };
}

export function removePending(state: ChatState, clientId: string): ChatState {
  return { ...state, pending: state.pending.filter((p) => p.clientId !== clientId) };
}

export function setContacts(
  state: ChatState,
  frequent: ChatContactWire[],
  recent: ChatContactWire[],
): ChatState {
  return { ...state, frequent, recent };
}

/** Unread = last_seq − last_read_seq of the caller's membership (ADR §3). */
export function unreadOf(state: ChatState, selfId: string, conversationId: string): number {
  const conversation = state.conversations[conversationId];
  if (!conversation) return 0;
  const member = state.members[conversationId]?.[selfId];
  if (!member && !conversation.membershipRole) return 0;
  if (member?.leftAt) return 0;
  const read = Math.max(
    member?.lastReadSeq ?? 0,
    conversation.lastReadSeq ?? 0,
    state.localRead[conversationId] ?? 0,
  );
  return Math.max(conversation.lastSeq - read, 0);
}

function shownPresence(
  state: ChatState,
  userId: string,
  fallback?: ChatContactWire["status"],
): ShownPresence {
  const status = state.presence[userId] ?? fallback ?? "offline";
  return status === "invisible" ? "offline" : status;
}

function newestMessage(state: ChatState, conversationId: string): ChatMessageWire | undefined {
  let best: ChatMessageWire | undefined;
  for (const message of Object.values(state.messages[conversationId] ?? {})) {
    if (!best || (message.seq ?? 0) > (best.seq ?? 0)) best = message;
  }
  return best;
}

function memberName(state: ChatState, conversationId: string, userId: string): string {
  return state.members[conversationId]?.[userId]?.userName ?? "";
}

export function conversationTitle(
  state: ChatState,
  selfId: string,
  conversation: ChatConversationWire,
): { title: string; peerId?: string } {
  if (conversation.kind !== "direct") return { title: conversation.name ?? "" };
  const peer = Object.values(state.members[conversation.id] ?? {}).find((m) => m.userId !== selfId);
  return { title: peer?.userName ?? peer?.userEmail ?? "", peerId: peer?.userId };
}

/** Conversation rows, newest activity first. */
export function selectConversations(state: ChatState, selfId: string): ChatConversation[] {
  const rows: ChatConversation[] = [];
  for (const conversation of Object.values(state.conversations)) {
    if (conversation.archivedAt) continue;
    const member = state.members[conversation.id]?.[selfId];
    const isMember = Boolean(member && !member.leftAt);
    if (conversation.kind === "channel" && !isMember && conversation.visibility !== "public")
      continue;
    if (member?.leftAt && conversation.kind !== "channel") continue;
    const { title, peerId } = conversationTitle(state, selfId, conversation);
    const last = newestMessage(state, conversation.id);
    const memberCount = Object.values(state.members[conversation.id] ?? {}).filter(
      (m) => !m.leftAt,
    ).length;
    rows.push({
      id: conversation.id,
      kind: conversation.kind,
      title,
      peerId,
      presence: peerId ? shownPresence(state, peerId) : undefined,
      unreadCount: unreadOf(state, selfId, conversation.id),
      pinned: Boolean(member?.pinnedAt ?? conversation.pinnedAt),
      visibility: conversation.visibility,
      membershipRole: member?.role ?? conversation.membershipRole ?? null,
      isMember,
      memberCount: memberCount || undefined,
      lastMessage: last
        ? {
            text: last.deletedAt ? "" : last.body,
            timestamp: last.createdAt,
            authorId: last.authorUserId,
            authorName: last.authorName ?? memberName(state, conversation.id, last.authorUserId),
            deleted: Boolean(last.deletedAt),
          }
        : undefined,
      lastActivityAt: last?.createdAt ?? conversation.lastMessageAt ?? conversation.createdAt,
    });
  }
  rows.sort((a, b) => b.lastActivityAt.localeCompare(a.lastActivityAt));
  return rows;
}

/**
 * Footer and tab badge counts: the server's sync counts, lowered by what the
 * client already knows it read (a local mark-read shows before the next sync).
 */
export function selectCounts(state: ChatState, selfId: string): ChatCounts {
  let channels = 0;
  let chatsLocal = 0;
  let pinsLocal = 0;
  for (const conversation of Object.values(state.conversations)) {
    if (conversation.archivedAt) continue;
    if (unreadOf(state, selfId, conversation.id) === 0) continue;
    if (conversation.kind === "channel") channels += 1;
    else chatsLocal += 1;
    if (state.members[conversation.id]?.[selfId]?.pinnedAt ?? conversation.pinnedAt) pinsLocal += 1;
  }
  if (!state.loaded) {
    return { chats: 0, channels: 0, threads: 0, mentions: 0, pins: 0 };
  }
  const serverChats = Math.max(state.badges.unreadChats - channels, 0);
  return {
    chats: Math.min(serverChats, chatsLocal),
    channels,
    threads: state.badges.unreadThreads,
    mentions: state.badges.unreadMentions,
    pins: Math.min(state.badges.unreadPins, pinsLocal),
  };
}

export function toView(message: ChatMessageWire, state: ChatState): ChatMessageView {
  const conv = state.conversations[message.conversationId];
  const readRow = state.threadReads[message.id];
  const lastReply = message.lastReplyAt;
  const isUnread =
    (message.replyCount ?? 0) > 0 &&
    Boolean(lastReply) &&
    (!readRow?.lastReadAt || readRow.lastReadAt < (lastReply ?? ""));
  return {
    id: message.id,
    conversationId: message.conversationId,
    conversationTitle: conv?.name ?? (conv ? conversationTitle(state, "", conv).title : ""),
    seq: message.seq,
    authorId: message.authorUserId,
    authorName:
      message.authorName ?? memberName(state, message.conversationId, message.authorUserId),
    body: message.deletedAt ? "" : message.body,
    mentions: message.mentions ?? [],
    createdAt: message.createdAt,
    edited: Boolean(message.editedAt) && !message.deletedAt,
    deleted: Boolean(message.deletedAt),
    starred: Boolean(message.starred),
    threadRootId: message.threadRootId,
    replyCount: message.replyCount ?? 0,
    lastReplyAt: message.lastReplyAt,
    unread: isUnread,
    status: "sent",
  };
}

export function markThreadReadLocal(
  state: ChatState,
  threadRootId: string,
  userId = "",
): ChatState {
  const readRow: ChatThreadReadWire = {
    threadRootId,
    userId,
    lastReadAt: new Date().toISOString(),
    changedSeq: 0,
  };
  return {
    ...state,
    threadReads: {
      ...state.threadReads,
      [threadRootId]: readRow,
    },
  };
}

export function selectReplies(state: ChatState, threadRootId: string): ChatMessageView[] {
  return Object.values(state.replies[threadRootId] ?? {})
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map((m) => toView(m, state));
}

/** Messages oldest first, optimistic ones after the confirmed ones. */
export function selectMessages(
  state: ChatState,
  selfId: string,
  conversationId: string,
  selfName: string,
): ChatMessageView[] {
  const sent = Object.values(state.messages[conversationId] ?? {})
    .sort((a, b) => (a.seq ?? 0) - (b.seq ?? 0))
    .map((m) => toView(m, state));
  const pending = state.pending
    .filter((p) => p.conversationId === conversationId)
    .map<ChatMessageView>((p) => ({
      id: p.clientId,
      seq: null,
      authorId: selfId,
      authorName: selfName,
      body: p.body,
      mentions: p.mentions,
      createdAt: p.createdAt,
      edited: false,
      deleted: false,
      starred: false,
      status: p.status,
    }));
  return [...sent, ...pending];
}

export function selectMembers(
  state: ChatState,
  selfId: string,
  conversationId: string,
): ChatMemberView[] {
  return Object.values(state.members[conversationId] ?? {})
    .filter((m) => !m.leftAt && m.userId !== selfId)
    .map((m) => ({
      id: m.userId,
      name: m.userName ?? m.userEmail ?? "",
      role: m.role,
    }));
}

export function selectContacts(state: ChatState, rows: ChatContactWire[]): ChatContact[] {
  return rows.map((row) => ({
    id: row.userId,
    name: row.name,
    email: row.email,
    presence: shownPresence(state, row.userId, row.status),
  }));
}

/** Highest confirmed seq of a conversation's messages in the store. */
export function newestSeq(state: ChatState, conversationId: string): number {
  return newestMessage(state, conversationId)?.seq ?? 0;
}

/** Lowest seq in the store — the `before` cursor for the next history page. */
export function oldestSeq(state: ChatState, conversationId: string): number | undefined {
  let lowest: number | undefined;
  for (const message of Object.values(state.messages[conversationId] ?? {})) {
    if (message.seq === null) continue;
    if (lowest === undefined || message.seq < lowest) lowest = message.seq;
  }
  return lowest;
}
