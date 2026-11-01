import { UnauthenticatedError } from "@crm/core/errors";
import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { ChatMessageWire, ChatSyncResponse } from "@/lib/api/wire/chat";
import type { ChatApi } from "./chat-api";
import { POLL_IDLE_MS, POLL_OPEN_MS, useChatSource } from "./use-chat-source";

const SELF = "u-self";
const NOW = "2026-11-01T10:00:00.000Z";

function emptySync(over: Partial<ChatSyncResponse> = {}): ChatSyncResponse {
  return {
    cursor: 0,
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

function wireMessage(seq: number, body = "hi"): ChatMessageWire {
  return {
    id: `m${seq}`,
    conversationId: "c1",
    seq,
    threadRootId: null,
    authorUserId: SELF,
    body,
    mentions: [],
    replyCount: 0,
    lastReplyAt: null,
    editedAt: null,
    deletedAt: null,
    createdAt: NOW,
    changedSeq: seq + 10,
  };
}

function fakeApi(over: Partial<ChatApi> = {}): ChatApi {
  return {
    sync: vi.fn(async () => emptySync()),
    contacts: vi.fn(async () => []),
    createDirect: vi.fn(),
    createGroup: vi.fn(),
    messages: vi.fn(async () => ({ messages: [], hasMore: false })),
    postMessage: vi.fn(async () => wireMessage(1)),
    editMessage: vi.fn(),
    deleteMessage: vi.fn(async () => {}),
    star: vi.fn(async () => {}),
    markRead: vi.fn(async () => {}),
    setPresence: vi.fn(async () => {}),
    ...over,
  } as ChatApi;
}

async function flush() {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(0);
  });
}

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

function setup(api: ChatApi) {
  return renderHook(() =>
    useChatSource({ orgSlug: "acme", selfId: SELF, selfName: "Self", canInvite: false, api }),
  );
}

describe("useChatSource sync loop", () => {
  test("syncs at start, then every 20 s while closed and every 3 s while open", async () => {
    const api = fakeApi();
    const { result } = setup(api);
    await flush();
    expect(api.sync).toHaveBeenCalledTimes(1);
    expect(result.current.loaded).toBe(true);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(POLL_IDLE_MS - 1);
    });
    expect(api.sync).toHaveBeenCalledTimes(1);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });
    expect(api.sync).toHaveBeenCalledTimes(2);

    // Opening the panel syncs at once and speeds polling up to 3 s.
    await act(async () => {
      result.current.setPanelOpen(true);
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(api.sync).toHaveBeenCalledTimes(3);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(POLL_OPEN_MS);
    });
    expect(api.sync).toHaveBeenCalledTimes(4);
  });

  test("passes the cursor on and merges changes into the snapshot", async () => {
    const sync = vi
      .fn<ChatApi["sync"]>()
      .mockResolvedValueOnce(
        emptySync({
          cursor: 7,
          conversations: [
            {
              id: "c1",
              kind: "group",
              name: "Team",
              visibility: null,
              directKey: null,
              createdBy: SELF,
              createdAt: NOW,
              lastSeq: 1,
              lastMessageAt: NOW,
              archivedAt: null,
              changedSeq: 7,
              membershipRole: "member",
              lastReadSeq: 0,
            },
          ],
          messages: [{ ...wireMessage(1), authorUserId: "u-peer", authorName: "Peer" }],
        }),
      )
      .mockResolvedValue(emptySync({ cursor: 7 }));
    const { result } = setup(fakeApi({ sync }));
    await flush();
    expect(sync).toHaveBeenLastCalledWith(0);
    expect(result.current.conversations[0]?.title).toBe("Team");
    expect(result.current.conversations[0]?.unreadCount).toBe(1);
    expect(result.current.counts?.chats).toBe(0);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(POLL_IDLE_MS);
    });
    expect(sync).toHaveBeenLastCalledWith(7);
  });

  test("keeps fetching while the server reports more pages", async () => {
    const sync = vi
      .fn<ChatApi["sync"]>()
      .mockResolvedValueOnce(emptySync({ cursor: 3, hasMore: true }))
      .mockResolvedValueOnce(emptySync({ cursor: 6, hasMore: false }));
    setup(fakeApi({ sync }));
    await flush();
    expect(sync).toHaveBeenCalledTimes(2);
    expect(sync).toHaveBeenNthCalledWith(2, 3);
  });

  test("stops polling when the session is gone", async () => {
    const sync = vi.fn<ChatApi["sync"]>().mockRejectedValue(new UnauthenticatedError());
    setup(fakeApi({ sync }));
    await flush();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(POLL_IDLE_MS * 3);
    });
    expect(sync).toHaveBeenCalledTimes(1);
  });

  test("stops polling on unmount", async () => {
    const api = fakeApi();
    const { unmount } = setup(api);
    await flush();
    unmount();
    await vi.advanceTimersByTimeAsync(POLL_IDLE_MS * 3);
    expect(api.sync).toHaveBeenCalledTimes(1);
  });
});

describe("useChatSource writes", () => {
  test("sends optimistically, then replaces the pending row and syncs right away", async () => {
    let finish: (m: ChatMessageWire) => void = () => {};
    const postMessage = vi.fn<ChatApi["postMessage"]>(
      () => new Promise<ChatMessageWire>((resolve) => (finish = resolve)),
    );
    const api = fakeApi({ postMessage });
    const { result } = setup(api);
    await flush();

    let sending: Promise<void> = Promise.resolve();
    await act(async () => {
      sending = result.current.sendMessage("c1", "hello", []);
    });
    const pending = result.current.messagesOf("c1");
    expect(pending).toHaveLength(1);
    expect(pending[0]).toMatchObject({ body: "hello", status: "sending", authorId: SELF });
    const clientId = postMessage.mock.calls[0]?.[1].clientId;
    expect(clientId).toMatch(/^[0-9a-f-]{36}$/);

    await act(async () => {
      finish(wireMessage(1, "hello"));
      await sending;
    });
    const after = result.current.messagesOf("c1");
    expect(after).toHaveLength(1);
    expect(after[0]).toMatchObject({ id: "m1", status: "sent" });
    expect(api.sync).toHaveBeenCalledTimes(2);
  });

  test("a failed send stays visible and retries with the same clientId", async () => {
    const postMessage = vi
      .fn<ChatApi["postMessage"]>()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce(wireMessage(1, "again"));
    const { result } = setup(fakeApi({ postMessage }));
    await flush();

    await act(async () => {
      await result.current.sendMessage("c1", "again", []);
    });
    let rows = result.current.messagesOf("c1");
    expect(rows[0]?.status).toBe("failed");

    await act(async () => {
      await result.current.retryMessage("c1", rows[0]?.id ?? "");
    });
    expect(postMessage).toHaveBeenCalledTimes(2);
    expect(postMessage.mock.calls[1]?.[1].clientId).toBe(postMessage.mock.calls[0]?.[1].clientId);
    rows = result.current.messagesOf("c1");
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ id: "m1", status: "sent" });
  });

  test("a failed message can be discarded", async () => {
    const postMessage = vi.fn<ChatApi["postMessage"]>().mockRejectedValue(new Error("offline"));
    const { result } = setup(fakeApi({ postMessage }));
    await flush();
    await act(async () => {
      await result.current.sendMessage("c1", "x", []);
    });
    const id = result.current.messagesOf("c1")[0]?.id ?? "";
    act(() => result.current.discardMessage("c1", id));
    expect(result.current.messagesOf("c1")).toHaveLength(0);
  });

  test("edit and delete call the API and trigger a sync", async () => {
    const editMessage = vi.fn<ChatApi["editMessage"]>(async () => ({
      ...wireMessage(1, "edited"),
      editedAt: NOW,
    }));
    const api = fakeApi({ editMessage });
    const { result } = setup(api);
    await flush();
    await act(async () => {
      await result.current.editMessage("c1", "m1", "edited", []);
    });
    expect(editMessage).toHaveBeenCalledWith("m1", { body: "edited", mentions: [] });
    await act(async () => {
      await result.current.deleteMessage("c1", "m1");
    });
    expect(api.deleteMessage).toHaveBeenCalledWith("m1");
    expect(api.sync).toHaveBeenCalledTimes(3);
  });

  test("direct and group creation return the conversation id", async () => {
    const row = {
      id: "c9",
      kind: "direct" as const,
      name: null,
      visibility: null,
      directKey: "k",
      createdBy: SELF,
      createdAt: NOW,
      lastSeq: 0,
      lastMessageAt: null,
      archivedAt: null,
      changedSeq: 5,
      membershipRole: "owner" as const,
    };
    const api = fakeApi({
      createDirect: vi.fn(async () => row),
      createGroup: vi.fn(async () => ({ ...row, id: "g1", kind: "group" as const, name: "Team" })),
    });
    const { result } = setup(api);
    await flush();
    let id = "";
    await act(async () => {
      id = await result.current.openDirect("u-peer");
    });
    expect(id).toBe("c9");
    await act(async () => {
      id = await result.current.createGroup("Team", ["a", "b"]);
    });
    expect(id).toBe("g1");
    expect(api.createGroup).toHaveBeenCalledWith("Team", ["a", "b"]);
  });

  test("presence change calls the API and shows at once", async () => {
    const api = fakeApi();
    const { result } = setup(api);
    await flush();
    await act(async () => {
      result.current.setPresence("busy");
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(api.setPresence).toHaveBeenCalledWith("busy");
    expect(result.current.currentPresence?.status).toBe("busy");
  });

  test("opening a conversation loads its first page once and reading marks it read", async () => {
    const messages = vi.fn<ChatApi["messages"]>(async () => ({
      messages: [
        { ...wireMessage(2), authorUserId: "u-peer" },
        { ...wireMessage(1), authorUserId: "u-peer" },
      ],
      hasMore: true,
    }));
    const sync = vi.fn<ChatApi["sync"]>(async () =>
      emptySync({
        cursor: 4,
        conversations: [
          {
            id: "c1",
            kind: "direct",
            name: null,
            visibility: null,
            directKey: "k",
            createdBy: SELF,
            createdAt: NOW,
            lastSeq: 2,
            lastMessageAt: NOW,
            archivedAt: null,
            changedSeq: 4,
            membershipRole: "member",
            lastReadSeq: 0,
          },
        ],
      }),
    );
    const api = fakeApi({ messages, sync });
    const { result } = setup(api);
    await flush();
    expect(result.current.conversations[0]?.unreadCount).toBe(2);

    await act(async () => {
      await result.current.openConversation("c1");
      await result.current.openConversation("c1");
    });
    expect(messages).toHaveBeenCalledTimes(1);
    expect(result.current.messagesOf("c1").map((m) => m.seq)).toEqual([1, 2]);
    expect(result.current.hasOlder("c1")).toBe(true);

    await act(async () => {
      result.current.markRead("c1");
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(api.markRead).toHaveBeenCalledWith("c1", 2);
    expect(result.current.conversations[0]?.unreadCount).toBe(0);
  });
});
