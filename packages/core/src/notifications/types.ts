export const NOTIFICATION_KINDS = [
  "mention",
  "post_comment",
  "post_like",
  "followed_update",
  "approval_assigned",
  "approval_decided",
  "review_assigned",
  "review_decided",
] as const;
export type NotificationKind = (typeof NOTIFICATION_KINDS)[number];

/** Ids only: the viewer's access to the target is re-checked when the item is opened. */
export type NotificationSubject = Readonly<Record<string, string | number | boolean | null>>;

export type NotificationItem = {
  id: string;
  kind: NotificationKind;
  actor: { id: string; name: string } | null;
  subject: NotificationSubject;
  createdAt: string;
  seenAt: string | null;
  readAt: string | null;
};

export type NotificationPage = { items: NotificationItem[]; nextCursor: string | null };
