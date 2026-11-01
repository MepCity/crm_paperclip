import { describe, expect, test } from "vitest";
import type {
  ChatConversationWire,
  ChatMemberWire,
  ChatMessageWire,
  ChatSyncResponse,
} from "@/lib/api/wire/chat";
import {
  createInitialState,
  mergeHistory,
  mergeSync,
  oldestSeq,
  selectConversations,
  selectCounts,
  selectMessages,
  setLocalRead,
  unreadOf,
} from "./chat-store";

const SELF = "u-self";
const PEER = "u-peer";
const NOW = "2026-11-01T10:00:00.000Z";

function conversation(over: Partial<ChatConversationWire> = {}): ChatConversationWire {
  return {
    id: "c1",
    kind: "direct",
    name: null,
    visibility: null,
    directKey: "k",
    createdBy: SELF,
    createdAt: NOW,
    lastSeq: 0,
    lastMessageAt: null,
    archivedAt: null,
    changedSeq: 1,
    membershipRole: "member",
    ...over,
  };
}

function member(userId: string, over: Partial<ChatMemberWire> = {}): ChatMemberWire {
  return {
    conversationId: "c1",
    userId,
    role: "member",
    joinedAt: NOW,
    leftAt: null,
    lastReadSeq: 0,
    pinnedAt: null,
    changedSeq: 1,
    userName: userId === SELF ? "Self" : "Peer Person",
    ...over,
  };
}

function message(seq: number, over: Partial<ChatMessageWire> = {}): ChatMessageWire {
  return {
    id: `m${seq}`,
    conversationId: "c1",
    seq,
    threadRootId: null,
    authorUserId: PEER,
    authorName: "Peer Person",
    body: `hello ${seq}`,
    mentions: [],
    replyCount: 0,
    lastReplyAt: null,
    editedAt: null,
    deletedAt: null,
    createdAt: `2026-11-01T10:0${seq}:00.000Z`,
    changedSeq: seq + 1,
    ...over,
  };
}

function sync(over: Partial<ChatSyncResponse> = {}): ChatSyncResponse {
  return {
    cursor: 5,
    hasMore: false,
    conversations: [],
    members: [],
    messages: [],
    threadReads: [],
    presence: [],
    badges: { unreadChats: 0, unreadThreads: 0, unreadPins: 0, unreadMentions: 0, unreadTotal: 0 },
    ...over,
  };
}

describe("chat store merge", () => {
  test("merges a sync page, advances the cursor and never moves it back", () => {
    let state = mergeSync(
      createInitialState(),
      sync({ cursor: 9, conversations: [conversation({ lastSeq: 2 })] }),
    );
    expect(state.cursor).toBe(9);
    expect(state.loaded).toBe(true);
    state = mergeSync(state, sync({ cursor: 4 }));
    expect(state.cursor).toBe(9);
  });

  test("keeps the newer row of an entity and ignores older replays", () => {
    let state = mergeSync(
      createInitialState(),
      sync({ messages: [message(1, { body: "new", changedSeq: 9 })] }),
    );
    state = mergeSync(state, sync({ messages: [message(1, { body: "old", changedSeq: 3 })] }));
    expect(state.messages.c1?.m1?.body).toBe("new");
  });

  test("propagates edits and deletes by changed sequence", () => {
    let state = mergeSync(
      createInitialState(),
      sync({
        conversations: [conversation({ lastSeq: 1 })],
        members: [member(SELF), member(PEER)],
        messages: [message(1)],
      }),
    );
    state = mergeSync(
      state,
      sync({ messages: [message(1, { body: "fixed", editedAt: NOW, changedSeq: 20 })] }),
    );
    let view = selectMessages(state, SELF, "c1", "Self");
    expect(view[0]?.body).toBe("fixed");
    expect(view[0]?.edited).toBe(true);
    state = mergeSync(
      state,
      sync({ messages: [message(1, { body: "", deletedAt: NOW, editedAt: NOW, changedSeq: 30 })] }),
    );
    view = selectMessages(state, SELF, "c1", "Self");
    expect(view[0]?.deleted).toBe(true);
    expect(view[0]?.edited).toBe(false);
    expect(view[0]?.body).toBe("");
  });

  test("skips thread replies in the conversation history", () => {
    const state = mergeSync(
      createInitialState(),
      sync({ messages: [message(1), message(2, { threadRootId: "m1", seq: null })] }),
    );
    expect(Object.keys(state.messages.c1 ?? {})).toEqual(["m1"]);
  });

  test("history merge tracks the paging state and the oldest seq", () => {
    let state = mergeHistory(createInitialState(), "c1", [message(3), message(4)], true);
    expect(state.historyDone.c1).toBe(false);
    expect(oldestSeq(state, "c1")).toBe(3);
    state = mergeHistory(state, "c1", [message(1), message(2)], false);
    expect(state.historyDone.c1).toBe(true);
    expect(oldestSeq(state, "c1")).toBe(1);
    expect(selectMessages(state, SELF, "c1", "Self").map((m) => m.seq)).toEqual([1, 2, 3, 4]);
  });
});

describe("unread math", () => {
  const base = mergeSync(
    createInitialState(),
    sync({
      conversations: [conversation({ lastSeq: 5 })],
      members: [member(SELF, { lastReadSeq: 2 }), member(PEER)],
      messages: [message(5)],
    }),
  );

  test("unread is last_seq minus last_read_seq of the own membership", () => {
    expect(unreadOf(base, SELF, "c1")).toBe(3);
  });

  test("a local read lowers unread before the next sync and never goes backwards", () => {
    const read = setLocalRead(base, "c1", 5);
    expect(unreadOf(read, SELF, "c1")).toBe(0);
    expect(setLocalRead(read, "c1", 1).localRead.c1).toBe(5);
  });

  test("a left or foreign conversation has no unread", () => {
    const left = mergeSync(
      base,
      sync({ members: [member(SELF, { lastReadSeq: 2, leftAt: NOW, changedSeq: 50 })] }),
    );
    expect(unreadOf(left, SELF, "c1")).toBe(0);
    const stranger = mergeSync(
      createInitialState(),
      sync({
        conversations: [
          conversation({ kind: "channel", visibility: "public", membershipRole: null, lastSeq: 4 }),
        ],
      }),
    );
    expect(unreadOf(stranger, SELF, "c1")).toBe(0);
  });

  test("badge counts follow the server and drop after a local read", () => {
    const withBadges = mergeSync(
      base,
      sync({
        badges: {
          unreadChats: 1,
          unreadThreads: 2,
          unreadPins: 0,
          unreadMentions: 0,
          unreadTotal: 3,
        },
      }),
    );
    expect(selectCounts(withBadges, SELF)).toMatchObject({ chats: 1, threads: 2 });
    expect(selectCounts(setLocalRead(withBadges, "c1", 5), SELF).chats).toBe(0);
  });
});

describe("conversation rows", () => {
  test("direct rows use the peer's name, presence and the newest message", () => {
    const state = mergeSync(
      createInitialState(),
      sync({
        conversations: [conversation({ lastSeq: 2 })],
        members: [member(SELF), member(PEER)],
        messages: [message(1), message(2)],
        presence: [{ userId: PEER, status: "available", lastSeenAt: NOW }],
      }),
    );
    const [row] = selectConversations(state, SELF);
    expect(row?.title).toBe("Peer Person");
    expect(row?.presence).toBe("available");
    expect(row?.lastMessage?.text).toBe("hello 2");
  });

  test("invisible peers show as offline and rows sort by latest activity", () => {
    const state = mergeSync(
      createInitialState(),
      sync({
        conversations: [
          conversation({ id: "c1", lastSeq: 1 }),
          conversation({ id: "c2", kind: "group", name: "Team", directKey: null, lastSeq: 1 }),
        ],
        members: [member(SELF), member(PEER)],
        messages: [
          message(1, { conversationId: "c1", id: "a", createdAt: "2026-11-01T09:00:00.000Z" }),
          message(1, { conversationId: "c2", id: "b", createdAt: "2026-11-01T11:00:00.000Z" }),
        ],
        presence: [{ userId: PEER, status: "invisible", lastSeenAt: NOW }],
      }),
    );
    const rows = selectConversations(state, SELF);
    expect(rows.map((r) => r.id)).toEqual(["c2", "c1"]);
    expect(rows[1]?.presence).toBe("offline");
    expect(rows[0]?.title).toBe("Team");
  });
});
