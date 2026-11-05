import type { HistoryChange, HistoryEventKind } from "../records/history";

export const FEED_BODY_MAX = 5000;
export const FEED_PAGE_SIZE = 20;
/** Events older than this are not read for the wall (ADR 0018 §3). */
export const FEED_EVENT_WINDOW_DAYS = 30;
/** Upper bound of history candidates read for one page request (ADR 0018 §3). */
export const FEED_CANDIDATE_CAP = 500;
/** Modules whose record feed and wall events are enabled (Deals by default, ADR 0018 §8). */
export const FEED_MODULES: readonly string[] = ["Leads", "Contacts", "Accounts", "Deals"];

export type FeedFilter = "all" | "followed" | "mine";
export type FeedLikeTarget = "post" | "comment" | "history_event";
export type FeedFollowTarget = "record" | "user";

export interface FeedUser {
  id: string;
  name: string;
}

export interface FeedRecordRef {
  module: string;
  id: string;
  name: string | null;
}

export interface FeedComment {
  id: string;
  author: FeedUser;
  body: string;
  createdAt: string;
  editedAt: string | null;
  likeCount: number;
  likedByMe: boolean;
}

interface FeedItemBase {
  /** Post id or history event id. */
  id: string;
  /** Sort time (ISO) used by the keyset cursor. */
  at: string;
  record: FeedRecordRef | null;
  likeCount: number;
  likedByMe: boolean;
  commentCount: number;
  comments: readonly FeedComment[];
}

export interface FeedPostItem extends FeedItemBase {
  type: "post";
  author: FeedUser;
  body: string;
  editedAt: string | null;
  mentions: readonly FeedUser[];
}

export interface FeedEventItem extends FeedItemBase {
  type: "event";
  actor: FeedUser;
  eventKind: HistoryEventKind;
  record: FeedRecordRef;
  changes: readonly HistoryChange[];
}

export type FeedItem = FeedPostItem | FeedEventItem;

export interface FeedPage {
  items: readonly FeedItem[];
  nextCursor: string | null;
}

export interface FeedListQuery {
  filter?: FeedFilter;
  module?: string | null;
  cursor?: string | null;
  limit?: number;
}

export interface CreatePostInput {
  body: string;
  recordModule?: string | null;
  recordId?: string | null;
  mentionUserIds?: readonly string[];
}

export interface CreateCommentInput {
  body: string;
  mentionUserIds?: readonly string[];
}

export interface CommentOnEventInput extends CreateCommentInput {
  recordModule: string;
  recordId: string;
}

export interface FollowState {
  following: boolean;
  /** True when the follow is implicit (record owner or author of a post on it). */
  implicit: boolean;
}

/** Notification hook; the notification store lands with ADR 0018 §6. */
export type FeedNotificationKind = "mention" | "post_comment" | "post_like" | "followed_update";
export interface FeedNotification {
  kind: FeedNotificationKind;
  recipientUserId: string;
  actorUserId: string;
  subject: {
    postId?: string;
    commentId?: string;
    recordModule?: string;
    recordId?: string;
  };
}
