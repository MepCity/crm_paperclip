import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  foreignKey,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { memberships } from "./tenancy";

const id = () => uuid("id").default(sql`uuidv7()`).notNull();
const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
export const feedPosts = pgTable(
  "feed_posts",
  {
    organizationId: uuid("organization_id").notNull(),
    id: id(),
    authorUserId: uuid("author_user_id").notNull(),
    body: text("body").notNull(),
    recordModule: text("record_module"),
    recordId: text("record_id"),
    createdAt: createdAt(),
    editedAt: timestamp("edited_at", { withTimezone: true }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    primaryKey({ columns: [table.organizationId, table.id] }),
    foreignKey({
      columns: [table.organizationId, table.authorUserId],
      foreignColumns: [memberships.organizationId, memberships.userId],
    }).onDelete("restrict"),
    check(
      "feed_posts_body_check",
      sql`(${table.deletedAt} is null and length(${table.body}) between 1 and 5000) or (${table.deletedAt} is not null and ${table.body} = '')`,
    ),
    check(
      "feed_posts_record_check",
      sql`(${table.recordModule} is null and ${table.recordId} is null) or (${table.recordModule} is not null and ${table.recordId} is not null)`,
    ),
  ],
);

export const feedComments = pgTable(
  "feed_comments",
  {
    organizationId: uuid("organization_id").notNull(),
    id: id(),
    postId: uuid("post_id"),
    historyEventId: text("history_event_id"),
    recordModule: text("record_module"),
    recordId: text("record_id"),
    authorUserId: uuid("author_user_id").notNull(),
    body: text("body").notNull(),
    createdAt: createdAt(),
    editedAt: timestamp("edited_at", { withTimezone: true }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    primaryKey({ columns: [table.organizationId, table.id] }),
    foreignKey({
      columns: [table.organizationId, table.postId],
      foreignColumns: [feedPosts.organizationId, feedPosts.id],
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.organizationId, table.authorUserId],
      foreignColumns: [memberships.organizationId, memberships.userId],
    }).onDelete("restrict"),
    check(
      "feed_comments_body_check",
      sql`(${table.deletedAt} is null and length(${table.body}) between 1 and 5000) or (${table.deletedAt} is not null and ${table.body} = '')`,
    ),
    check(
      "feed_comments_target_check",
      sql`(${table.postId} is not null and ${table.historyEventId} is null) or (${table.postId} is null and ${table.historyEventId} is not null and ${table.recordModule} is not null and ${table.recordId} is not null)`,
    ),
  ],
);

export const feedLikes = pgTable(
  "feed_likes",
  {
    organizationId: uuid("organization_id").notNull(),
    targetKind: text("target_kind").notNull(),
    targetId: text("target_id").notNull(),
    userId: uuid("user_id").notNull(),
    recordModule: text("record_module"),
    recordId: text("record_id"),
    createdAt: createdAt(),
  },
  (table) => [
    primaryKey({
      columns: [table.organizationId, table.targetKind, table.targetId, table.userId],
    }),
    foreignKey({
      columns: [table.organizationId, table.userId],
      foreignColumns: [memberships.organizationId, memberships.userId],
    }).onDelete("cascade"),
    check(
      "feed_likes_target_kind_check",
      sql`${table.targetKind} in ('post', 'comment', 'history_event')`,
    ),
  ],
);

export const feedMentions = pgTable(
  "feed_mentions",
  {
    organizationId: uuid("organization_id").notNull(),
    sourceKind: text("source_kind").notNull(),
    sourceId: uuid("source_id").notNull(),
    userId: uuid("user_id").notNull(),
  },
  (table) => [
    primaryKey({
      columns: [table.organizationId, table.sourceKind, table.sourceId, table.userId],
    }),
    foreignKey({
      columns: [table.organizationId, table.userId],
      foreignColumns: [memberships.organizationId, memberships.userId],
    }).onDelete("cascade"),
    check("feed_mentions_source_kind_check", sql`${table.sourceKind} in ('post', 'comment')`),
  ],
);

export const feedFollows = pgTable(
  "feed_follows",
  {
    organizationId: uuid("organization_id").notNull(),
    userId: uuid("user_id").notNull(),
    targetKind: text("target_kind").notNull(),
    targetModule: text("target_module").notNull().default(""),
    targetId: text("target_id").notNull(),
    muted: boolean("muted").notNull().default(false),
    createdAt: createdAt(),
  },
  (table) => [
    primaryKey({
      columns: [
        table.organizationId,
        table.userId,
        table.targetKind,
        table.targetModule,
        table.targetId,
      ],
    }),
    foreignKey({
      columns: [table.organizationId, table.userId],
      foreignColumns: [memberships.organizationId, memberships.userId],
    }).onDelete("cascade"),
    check("feed_follows_target_kind_check", sql`${table.targetKind} in ('record', 'user')`),
    check(
      "feed_follows_target_module_check",
      sql`(${table.targetKind} = 'record' and ${table.targetModule} <> '') or (${table.targetKind} = 'user' and ${table.targetModule} = '')`,
    ),
  ],
);
