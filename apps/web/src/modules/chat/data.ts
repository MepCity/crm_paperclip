/**
 * ChatDataSource — the data interface between the chat panel UI and the live
 * chat store (ADR 0015). The HTTP implementation lives in `use-chat-source.ts`;
 * `EmptyChatDataSource` is a static, in-memory stand-in for component tests.
 *
 * Refs: MEP-1419, MEP-1420, ADR 0015
 */

/** Presence status options (ADR §4). */
export type PresenceStatus = "available" | "busy" | "away" | "invisible";

/** Presence as shown to other people (never "invisible"). */
export type ShownPresence = "available" | "busy" | "away" | "offline";

/** Current-user presence state. */
export interface ChatPresence {
  userId: string;
  status: PresenceStatus;
}

/** Aggregated unread / badge counts (footer entries and tabs). */
export interface ChatCounts {
  chats: number;
  channels: number;
  threads: number;
  mentions: number;
  pins: number;
}

/** Organization member shown in Contacts and the pickers. */
export interface ChatContact {
  id: string;
  name: string;
  email?: string;
  presence: ShownPresence;
}

/** One row of the Chats list. */
export interface ChatConversation {
  id: string;
  kind: "direct" | "group" | "channel";
  /** Display title: the other person for direct chats, the stored name otherwise. */
  title: string;
  /** Other participant of a direct conversation. */
  peerId?: string;
  /** Presence of the other participant (direct only). */
  presence?: ShownPresence;
  unreadCount: number;
  pinned: boolean;
  lastMessage?: {
    text: string;
    timestamp: string;
    authorId: string;
    authorName: string;
    deleted: boolean;
  };
  lastActivityAt: string;
}

/** A message ready to render (server row or optimistic local row). */
export interface ChatMessageView {
  /** Server id, or the clientId while the message is still pending. */
  id: string;
  seq: number | null;
  authorId: string;
  authorName: string;
  body: string;
  mentions: string[];
  createdAt: string;
  edited: boolean;
  deleted: boolean;
  starred: boolean;
  /** Local-only delivery state. */
  status: "sent" | "sending" | "failed";
}

/** Member of the open conversation (used by the `@` picker). */
export interface ChatMemberView {
  id: string;
  name: string;
}

/** The full data contract between the panel and its data provider. */
export interface ChatDataSource {
  /** Signed-in user id. */
  selfId: string;
  /** Conversations sorted by latest activity. */
  conversations: ChatConversation[];
  /** Current user's presence (null while loading). */
  currentPresence: ChatPresence | null;
  /** Aggregated badge counts (null while loading). */
  counts: ChatCounts | null;
  /** Frequent contacts list. */
  frequentContacts: ChatContact[];
  /** Recent contacts list. */
  recentContacts: ChatContact[];
  /** All organization members except the current user (pickers). */
  directory: ChatContact[];
  /** First sync finished. */
  loaded: boolean;
  /**
   * Whether the current user has permission to invite people to the
   * organization. When false the Invite People menu item is hidden.
   */
  canInvite: boolean;
  /** Update the current user's presence status. */
  setPresence(status: PresenceStatus): void;

  /** Messages of a conversation, oldest first, pending ones last. */
  messagesOf(conversationId: string): ChatMessageView[];
  /** Members of a conversation other than the current user. */
  membersOf(conversationId: string): ChatMemberView[];
  /** Whether older history can still be fetched. */
  hasOlder(conversationId: string): boolean;
  /** Fetches the next page of history (50, ADR §7.6). */
  loadOlder(conversationId: string): Promise<void>;
  /** Loads the first history page when the conversation has none yet. */
  openConversation(conversationId: string): Promise<void>;
  /** Marks the conversation read up to its newest message. */
  markRead(conversationId: string): void;
  /** Opens or creates the direct conversation with a member; returns its id. */
  openDirect(userId: string): Promise<string>;
  /** Creates a group conversation (2–50 other members); returns its id. */
  createGroup(name: string, memberUserIds: string[]): Promise<string>;
  /** Sends a message optimistically; resolves when the server answered. */
  sendMessage(conversationId: string, body: string, mentions: string[]): Promise<void>;
  /** Retries a failed pending message. */
  retryMessage(conversationId: string, clientId: string): Promise<void>;
  /** Drops a failed pending message. */
  discardMessage(conversationId: string, clientId: string): void;
  editMessage(
    conversationId: string,
    messageId: string,
    body: string,
    mentions: string[],
  ): Promise<void>;
  deleteMessage(conversationId: string, messageId: string): Promise<void>;
  starMessage(conversationId: string, messageId: string, star: boolean): Promise<void>;
  /** Tells the sync loop whether the panel is open (fast poll rate). */
  setPanelOpen(open: boolean): void;
}

/**
 * Static data source for component tests and previews: all collections are
 * empty and writes are no-ops. Fields are public so tests can override them.
 */
export class EmptyChatDataSource implements ChatDataSource {
  selfId = "current-user";
  conversations: ChatConversation[] = [];
  currentPresence: ChatPresence | null = {
    userId: "current-user",
    status: "available",
  };
  counts: ChatCounts | null = {
    chats: 0,
    channels: 0,
    threads: 0,
    mentions: 0,
    pins: 0,
  };
  frequentContacts: ChatContact[] = [];
  recentContacts: ChatContact[] = [];
  directory: ChatContact[] = [];
  loaded = true;
  canInvite = false;

  setPresence(status: PresenceStatus): void {
    if (this.currentPresence) {
      this.currentPresence.status = status;
    } else {
      this.currentPresence = { userId: this.selfId, status };
    }
  }
  messagesOf(_conversationId: string): ChatMessageView[] {
    return [];
  }
  membersOf(_conversationId: string): ChatMemberView[] {
    return [];
  }
  hasOlder(_conversationId: string): boolean {
    return false;
  }
  async loadOlder(_conversationId: string): Promise<void> {}
  async openConversation(_conversationId: string): Promise<void> {}
  markRead(_conversationId: string): void {}
  async openDirect(userId: string): Promise<string> {
    return `direct-${userId}`;
  }
  async createGroup(_name: string, _memberUserIds: string[]): Promise<string> {
    return "group-1";
  }
  async sendMessage(_c: string, _b: string, _m: string[]): Promise<void> {}
  async retryMessage(_c: string, _id: string): Promise<void> {}
  discardMessage(_c: string, _id: string): void {}
  async editMessage(_c: string, _id: string, _b: string, _m: string[]): Promise<void> {}
  async deleteMessage(_c: string, _id: string): Promise<void> {}
  async starMessage(_c: string, _id: string, _s: boolean): Promise<void> {}
  setPanelOpen(_open: boolean): void {}
}
