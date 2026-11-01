"use client";

/**
 * Live chat data source (ADR 0015 §2): cursor polling of `GET /chat/sync`,
 * one client store, optimistic sends with retry. The panel renders from the
 * `ChatDataSource` snapshot this hook returns.
 *
 * Refs: MEP-1420
 */
import { UnauthenticatedError } from "@crm/core/errors";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { type ChatApi, createChatApi } from "./chat-api";
import {
  addPending,
  type ChatState,
  createInitialState,
  mergeHistory,
  mergeSync,
  newestSeq,
  oldestSeq,
  removePending,
  revertLocalRead,
  selectContacts,
  selectConversations,
  selectCounts,
  selectMembers,
  selectMessages,
  serverReadSeq,
  setContacts,
  setLocalRead,
  setPendingStatus,
  upsertMessage,
} from "./chat-store";
import type { ChatDataSource, PresenceStatus } from "./data";

/** Poll rates (ADR §2). */
export const POLL_OPEN_MS = 3_000;
export const POLL_IDLE_MS = 20_000;

export interface UseChatSourceOptions {
  orgSlug: string;
  selfId: string;
  selfName: string;
  canInvite: boolean;
  /** Test seam: replaces the HTTP client. */
  api?: ChatApi;
}

function clientUuid(): string {
  return crypto.randomUUID();
}

export function useChatSource({
  orgSlug,
  selfId,
  selfName,
  canInvite,
  api: apiOverride,
}: UseChatSourceOptions): ChatDataSource {
  const api = useMemo(() => apiOverride ?? createChatApi(orgSlug), [apiOverride, orgSlug]);
  const stateRef = useRef<ChatState>(createInitialState());
  const [state, setState] = useState<ChatState>(stateRef.current);
  const [selfPresence, setSelfPresence] = useState<PresenceStatus | null>(null);
  const panelOpenRef = useRef(false);
  const stoppedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlightRef = useRef(false);
  const againRef = useRef(false);
  const syncNowRef = useRef<() => void>(() => {});
  const markReadInFlightRef = useRef<Record<string, number>>({});

  const update = useCallback((fn: (current: ChatState) => ChatState) => {
    stateRef.current = fn(stateRef.current);
    setState(stateRef.current);
  }, []);

  const refreshContacts = useCallback(async () => {
    try {
      const [frequent, recent] = await Promise.all([
        api.contacts("frequent"),
        api.contacts("recent"),
      ]);
      update((current) => setContacts(current, frequent, recent));
    } catch {
      /* contacts are best effort; the next refresh retries */
    }
  }, [api, update]);

  // Sync loop: 3 s while the panel is open and the tab visible, 20 s otherwise.
  useEffect(() => {
    stoppedRef.current = false;

    const schedule = () => {
      if (stoppedRef.current) return;
      if (timerRef.current) clearTimeout(timerRef.current);
      const fast = panelOpenRef.current && document.visibilityState !== "hidden";
      timerRef.current = setTimeout(run, fast ? POLL_OPEN_MS : POLL_IDLE_MS);
    };

    const run = async () => {
      if (stoppedRef.current) return;
      if (inFlightRef.current) {
        againRef.current = true;
        return;
      }
      inFlightRef.current = true;
      try {
        let more = true;
        while (more && !stoppedRef.current) {
          const before = stateRef.current.cursor;
          const response = await api.sync(before);
          update((current) => mergeSync(current, response));
          more = response.hasMore && response.cursor > before;
        }
      } catch (error) {
        if (error instanceof UnauthenticatedError) {
          stoppedRef.current = true;
        }
      } finally {
        inFlightRef.current = false;
      }
      if (againRef.current) {
        againRef.current = false;
        void run();
        return;
      }
      schedule();
    };

    syncNowRef.current = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      void run();
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") syncNowRef.current();
    };
    document.addEventListener("visibilitychange", onVisibility);
    void run();
    void refreshContacts();
    return () => {
      stoppedRef.current = true;
      document.removeEventListener("visibilitychange", onVisibility);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [api, update, refreshContacts]);

  const setPanelOpen = useCallback(
    (open: boolean) => {
      const changed = panelOpenRef.current !== open;
      panelOpenRef.current = open;
      if (changed && open) {
        syncNowRef.current();
        void refreshContacts();
      }
    },
    [refreshContacts],
  );

  const setPresence = useCallback(
    (status: PresenceStatus) => {
      setSelfPresence(status);
      void api
        .setPresence(status)
        .then(() => syncNowRef.current())
        .catch(() => {});
    },
    [api],
  );

  const markRead = useCallback(
    (conversationId: string) => {
      const current = stateRef.current;
      const seq = newestSeq(current, conversationId);
      const known = current.conversations[conversationId];
      const target = Math.max(seq, 0);
      if (!known || target === 0) return;
      if (serverReadSeq(current, selfId, conversationId) >= target) return;
      if ((markReadInFlightRef.current[conversationId] ?? 0) >= target) return;

      const prevLocal = current.localRead[conversationId];
      update((s) => setLocalRead(s, conversationId, target));
      markReadInFlightRef.current[conversationId] = target;

      void api
        .markRead(conversationId, target)
        .then(() => {
          syncNowRef.current();
        })
        .catch(() => {
          update((s) => revertLocalRead(s, conversationId, target, prevLocal));
        })
        .finally(() => {
          if (markReadInFlightRef.current[conversationId] === target) {
            delete markReadInFlightRef.current[conversationId];
          }
        });
    },
    [api, selfId, update],
  );

  const loadHistory = useCallback(
    async (conversationId: string, before?: number) => {
      const page = await api.messages(conversationId, before);
      update((s) => mergeHistory(s, conversationId, page.messages, page.hasMore));
    },
    [api, update],
  );

  const openConversation = useCallback(
    async (conversationId: string) => {
      if (stateRef.current.historyLoaded[conversationId]) return;
      await loadHistory(conversationId);
    },
    [loadHistory],
  );

  const loadOlder = useCallback(
    async (conversationId: string) => {
      const current = stateRef.current;
      if (current.historyDone[conversationId]) return;
      const before = oldestSeq(current, conversationId);
      if (before === undefined) return;
      await loadHistory(conversationId, before);
    },
    [loadHistory],
  );

  const afterConversation = useCallback(
    (row: Awaited<ReturnType<ChatApi["createDirect"]>>) => {
      update((s) =>
        mergeSync(s, {
          cursor: s.cursor,
          hasMore: false,
          conversations: [row],
          members: [],
          messages: [],
          threadReads: [],
          presence: [],
          badges: s.badges,
        }),
      );
      syncNowRef.current();
      return row.id;
    },
    [update],
  );

  const openDirect = useCallback(
    async (userId: string) => afterConversation(await api.createDirect(userId)),
    [api, afterConversation],
  );

  const createGroup = useCallback(
    async (name: string, memberUserIds: string[]) =>
      afterConversation(await api.createGroup(name, memberUserIds)),
    [api, afterConversation],
  );

  const deliver = useCallback(
    async (conversationId: string, clientId: string, body: string, mentions: string[]) => {
      try {
        const message = await api.postMessage(conversationId, { body, mentions, clientId });
        update((s) => upsertMessage(removePending(s, clientId), message));
        const seq = message.seq ?? 0;
        update((s) => setLocalRead(s, conversationId, seq));
        syncNowRef.current();
      } catch {
        update((s) => setPendingStatus(s, clientId, "failed"));
      }
    },
    [api, update],
  );

  const sendMessage = useCallback(
    async (conversationId: string, body: string, mentions: string[]) => {
      const clientId = clientUuid();
      update((s) =>
        addPending(s, {
          clientId,
          conversationId,
          body,
          mentions,
          createdAt: new Date().toISOString(),
          status: "sending",
        }),
      );
      await deliver(conversationId, clientId, body, mentions);
    },
    [deliver, update],
  );

  const retryMessage = useCallback(
    async (conversationId: string, clientId: string) => {
      const pending = stateRef.current.pending.find((p) => p.clientId === clientId);
      if (!pending) return;
      update((s) => setPendingStatus(s, clientId, "sending"));
      await deliver(conversationId, clientId, pending.body, pending.mentions);
    },
    [deliver, update],
  );

  const discardMessage = useCallback(
    (_conversationId: string, clientId: string) => update((s) => removePending(s, clientId)),
    [update],
  );

  const editMessage = useCallback(
    async (_conversationId: string, messageId: string, body: string, mentions: string[]) => {
      const message = await api.editMessage(messageId, { body, mentions });
      update((s) => upsertMessage(s, message));
      syncNowRef.current();
    },
    [api, update],
  );

  const deleteMessage = useCallback(
    async (_conversationId: string, messageId: string) => {
      await api.deleteMessage(messageId);
      syncNowRef.current();
    },
    [api],
  );

  const starMessage = useCallback(
    async (conversationId: string, messageId: string, star: boolean) => {
      const existing = stateRef.current.messages[conversationId]?.[messageId];
      if (existing) {
        update((s) =>
          upsertMessage(s, { ...existing, starred: star, changedSeq: existing.changedSeq }),
        );
      }
      try {
        await api.star(messageId, star);
      } catch (error) {
        if (existing) update((s) => upsertMessage(s, existing));
        throw error;
      }
    },
    [api, update],
  );

  return useMemo<ChatDataSource>(() => {
    const counts = selectCounts(state, selfId);
    const directory = selectContacts(state, state.frequent);
    const stored = state.presence[selfId];
    return {
      selfId,
      conversations: selectConversations(state, selfId),
      currentPresence: {
        userId: selfId,
        status: selfPresence ?? (stored && stored !== "offline" ? stored : "available"),
      },
      counts,
      frequentContacts: directory,
      recentContacts: selectContacts(state, state.recent),
      directory,
      loaded: state.loaded,
      canInvite,
      setPresence,
      messagesOf: (conversationId) => selectMessages(state, selfId, conversationId, selfName),
      membersOf: (conversationId) => selectMembers(state, selfId, conversationId),
      hasOlder: (conversationId) => !state.historyDone[conversationId],
      loadOlder,
      openConversation,
      markRead,
      openDirect,
      createGroup,
      sendMessage,
      retryMessage,
      discardMessage,
      editMessage,
      deleteMessage,
      starMessage,
      setPanelOpen,
    };
  }, [
    state,
    selfId,
    selfName,
    selfPresence,
    canInvite,
    setPresence,
    loadOlder,
    openConversation,
    markRead,
    openDirect,
    createGroup,
    sendMessage,
    retryMessage,
    discardMessage,
    editMessage,
    deleteMessage,
    starMessage,
    setPanelOpen,
  ]);
}
