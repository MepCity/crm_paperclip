/**
 * ChatDataSource — the data interface that separates the chat panel UI from
 * the real API. The empty implementation is used now; the backend issue
 * (MEP-1420) switches it to the real wire types.
 *
 * Refs: MEP-1419, ADR 0015
 */

/** Presence status options (ADR §4). */
export type PresenceStatus = "available" | "busy" | "away" | "invisible";

/** Minimal user shape needed by the UI. */
export interface ChatUser {
  id: string;
  name: string;
  /** Initials derived from name; the UI may compute this itself. */
  initials: string;
}

/** Current-user presence state. */
export interface ChatPresence {
  userId: string;
  status: PresenceStatus;
}

/** Aggregated unread / badge counts. */
export interface ChatCounts {
  /** Total unread direct + group conversations. */
  chats: number;
  /** Total unread channel messages. */
  channels: number;
  /** Total unread thread replies. */
  threads: number;
  /** Total unread @mentions. */
  mentions: number;
  /** Pins with new messages. */
  pins: number;
}

/** Minimal contact entry (used for Contacts tab). */
export interface ChatContact {
  id: string;
  name: string;
  presence: PresenceStatus | "offline";
}

/** Action stubs for the Quick Actions menu items that are not Invite People. */
export interface ChatActions {
  /** Open the new direct-message picker. */
  startDirectMessage(): void;
  /** Open the new group conversation picker. */
  startGroupConversation(): void;
  /** Open the create channel dialog. */
  createChannel(): void;
}

/** The full data contract between the panel and its data provider. */
export interface ChatDataSource {
  /** Current user's presence (null while loading). */
  currentPresence: ChatPresence | null;
  /** Aggregated badge counts (null while loading). */
  counts: ChatCounts | null;
  /** Frequent contacts list. */
  frequentContacts: ChatContact[];
  /** Recent contacts list. */
  recentContacts: ChatContact[];
  /** Quick action stubs. */
  actions: ChatActions;
  /**
   * Whether the current user has permission to invite people to the
   * organization. When false the Invite People menu item is hidden.
   */
  canInvite: boolean;
  /** Update the current user's presence status. */
  setPresence(status: PresenceStatus): void;
}

/**
 * Empty data source used while the real API layer (MEP-1420) is not yet wired.
 * All collections are empty; badge counts are zero; actions are no-ops.
 */
export class EmptyChatDataSource implements ChatDataSource {
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
  canInvite = false;

  actions: ChatActions = {
    startDirectMessage: () => {
      /* stub — MEP-1420 will implement */
    },
    startGroupConversation: () => {
      /* stub — MEP-1420 will implement */
    },
    createChannel: () => {
      /* stub — MEP-1420 will implement */
    },
  };

  setPresence(status: PresenceStatus): void {
    if (this.currentPresence) {
      this.currentPresence.status = status;
    } else {
      this.currentPresence = { userId: "current-user", status };
    }
  }
}
