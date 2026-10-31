export type ChatConversationKind = "direct" | "group" | "channel";
export type ChatChannelVisibility = "public" | "private";
export type ChatMemberRole = "owner" | "member";
export type ChatPresenceStatus = "available" | "busy" | "away" | "invisible";
export type ChatPresenceDisplayStatus = "available" | "busy" | "away" | "invisible" | "offline";

export type ChatConversation = {
  id: string;
  organizationId: string;
  kind: ChatConversationKind;
  name: string | null;
  visibility: ChatChannelVisibility | null;
  directKey: string | null;
  createdBy: string;
  createdAt: Date;
  lastSeq: number;
  lastMessageAt: Date | null;
  archivedAt: Date | null;
  changedSeq: number;
  unreadCount?: number;
  pinnedAt?: Date | null;
  lastReadSeq?: number;
  membershipRole?: ChatMemberRole | null;
};

export type ChatMember = {
  organizationId: string;
  conversationId: string;
  userId: string;
  role: ChatMemberRole;
  joinedAt: Date;
  leftAt: Date | null;
  lastReadSeq: number;
  pinnedAt: Date | null;
  changedSeq: number;
  userName?: string;
  userEmail?: string;
};

export type ChatMessage = {
  id: string;
  organizationId: string;
  conversationId: string;
  seq: number | null;
  threadRootId: string | null;
  authorUserId: string;
  authorName?: string;
  body: string;
  mentions: string[];
  replyCount: number;
  lastReplyAt: Date | null;
  editedAt: Date | null;
  deletedAt: Date | null;
  createdAt: Date;
  changedSeq: number;
  starred?: boolean;
};

export type ChatThreadRead = {
  organizationId: string;
  threadRootId: string;
  userId: string;
  lastReadAt: Date;
  changedSeq: number;
};

export type ChatPresence = {
  organizationId: string;
  userId: string;
  status: ChatPresenceDisplayStatus;
  lastSeenAt: Date;
};

export type ChatContact = {
  userId: string;
  name: string;
  email: string;
  status: "available" | "busy" | "away" | "offline";
  lastSeenAt: Date | null;
};

export type ChatBadges = {
  unreadChats: number;
  unreadThreads: number;
  unreadPins: number;
  unreadMentions: number;
  unreadTotal: number;
};

export type ChatSyncResult = {
  cursor: number;
  hasMore: boolean;
  conversations: ChatConversation[];
  members: ChatMember[];
  messages: ChatMessage[];
  threadReads: ChatThreadRead[];
  presence: ChatPresence[];
  badges: ChatBadges;
};

export type CreateConversationParams = {
  kind: ChatConversationKind;
  name?: string;
  visibility?: ChatChannelVisibility;
  userId?: string;
  memberUserIds?: string[];
  clientId?: string;
};

export type UpdateConversationParams = {
  name?: string;
  archived?: boolean;
};

export type PostMessageParams = {
  body: string;
  mentions?: string[];
  clientId?: string;
};

export type UpdateMessageParams = {
  body: string;
  mentions?: string[];
};

export type PostReplyParams = {
  body: string;
  mentions?: string[];
  clientId?: string;
};

export type ChatSearchParams = {
  q?: string;
  from?: string;
  in?: string;
  type?: string;
  after?: string;
  before?: string;
  hasLink?: boolean;
  hasMention?: boolean;
  limit?: number;
  offset?: number;
};
