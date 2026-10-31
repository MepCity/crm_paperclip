import { sql } from "drizzle-orm";
import {
  bigint,
  check,
  customType,
  foreignKey,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { users } from "./auth";
import { memberships, organizations } from "./tenancy";

const id = () => uuid("id").primaryKey().default(sql`uuidv7()`);
const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();

const tsvector = customType<{ data: string }>({
  dataType() {
    return "tsvector";
  },
});

export const chatConversations = pgTable(
  "chat_conversations",
  {
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    id: id(),
    kind: text("kind").notNull(),
    name: text("name"),
    visibility: text("visibility"),
    directKey: text("direct_key"),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    createdAt: createdAt(),
    lastSeq: integer("last_seq").notNull().default(0),
    lastMessageAt: timestamp("last_message_at", { withTimezone: true }),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    changedSeq: bigint("changed_seq", { mode: "number" })
      .notNull()
      .default(sql`nextval('chat_change_seq')`),
  },
  (table) => [
    primaryKey({ columns: [table.organizationId, table.id] }),
    uniqueIndex("chat_conversations_direct_key_unique").on(table.organizationId, table.directKey),
    check("chat_conversations_kind_check", sql`${table.kind} in ('direct', 'group', 'channel')`),
    check(
      "chat_conversations_name_check",
      sql`(${table.kind} = 'direct' and ${table.name} is null) or (${table.kind} in ('group', 'channel') and ${table.name} is not null and length(btrim(${table.name})) between 1 and 80)`,
    ),
    check(
      "chat_conversations_visibility_check",
      sql`(${table.kind} = 'channel' and ${table.visibility} in ('public', 'private')) or (${table.kind} <> 'channel' and ${table.visibility} is null)`,
    ),
    check(
      "chat_conversations_direct_key_check",
      sql`(${table.kind} = 'direct' and ${table.directKey} is not null) or (${table.kind} <> 'direct' and ${table.directKey} is null)`,
    ),
    check("chat_conversations_last_seq_check", sql`${table.lastSeq} >= 0`),
  ],
);

export const chatMembers = pgTable(
  "chat_members",
  {
    organizationId: uuid("organization_id").notNull(),
    conversationId: uuid("conversation_id").notNull(),
    userId: uuid("user_id").notNull(),
    role: text("role").notNull(),
    joinedAt: createdAt(),
    leftAt: timestamp("left_at", { withTimezone: true }),
    lastReadSeq: integer("last_read_seq").notNull().default(0),
    pinnedAt: timestamp("pinned_at", { withTimezone: true }),
    changedSeq: bigint("changed_seq", { mode: "number" })
      .notNull()
      .default(sql`nextval('chat_change_seq')`),
  },
  (table) => [
    primaryKey({ columns: [table.organizationId, table.conversationId, table.userId] }),
    foreignKey({
      columns: [table.organizationId, table.conversationId],
      foreignColumns: [chatConversations.organizationId, chatConversations.id],
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.organizationId, table.userId],
      foreignColumns: [memberships.organizationId, memberships.userId],
    }).onDelete("cascade"),
    check("chat_members_role_check", sql`${table.role} in ('owner', 'member')`),
    check("chat_members_last_read_seq_check", sql`${table.lastReadSeq} >= 0`),
  ],
);

export const chatMessages = pgTable(
  "chat_messages",
  {
    organizationId: uuid("organization_id").notNull(),
    id: id(),
    conversationId: uuid("conversation_id").notNull(),
    seq: integer("seq"),
    threadRootId: uuid("thread_root_id"),
    authorUserId: uuid("author_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    body: text("body").notNull(),
    mentions: uuid("mentions").array().notNull().default(sql`'{}'`),
    replyCount: integer("reply_count").notNull().default(0),
    lastReplyAt: timestamp("last_reply_at", { withTimezone: true }),
    editedAt: timestamp("edited_at", { withTimezone: true }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: createdAt(),
    changedSeq: bigint("changed_seq", { mode: "number" })
      .notNull()
      .default(sql`nextval('chat_change_seq')`),
    search: tsvector("search"),
  },
  (table) => [
    primaryKey({ columns: [table.organizationId, table.id] }),
    uniqueIndex("chat_messages_seq_unique").on(
      table.organizationId,
      table.conversationId,
      table.seq,
    ),
    foreignKey({
      columns: [table.organizationId, table.conversationId],
      foreignColumns: [chatConversations.organizationId, chatConversations.id],
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.organizationId, table.threadRootId],
      foreignColumns: [table.organizationId, table.id],
    }).onDelete("cascade"),
    check(
      "chat_messages_body_check",
      sql`(${table.deletedAt} is null and length(${table.body}) between 1 and 10000) or (${table.deletedAt} is not null and ${table.body} = '')`,
    ),
    check(
      "chat_messages_seq_thread_check",
      sql`(${table.threadRootId} is null and ${table.seq} is not null and ${table.seq} > 0) or (${table.threadRootId} is not null and ${table.seq} is null)`,
    ),
    check("chat_messages_reply_count_check", sql`${table.replyCount} >= 0`),
  ],
);

export const chatThreadReads = pgTable(
  "chat_thread_reads",
  {
    organizationId: uuid("organization_id").notNull(),
    threadRootId: uuid("thread_root_id").notNull(),
    userId: uuid("user_id").notNull(),
    lastReadAt: createdAt(),
    changedSeq: bigint("changed_seq", { mode: "number" })
      .notNull()
      .default(sql`nextval('chat_change_seq')`),
  },
  (table) => [
    primaryKey({ columns: [table.organizationId, table.threadRootId, table.userId] }),
    foreignKey({
      columns: [table.organizationId, table.threadRootId],
      foreignColumns: [chatMessages.organizationId, chatMessages.id],
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.organizationId, table.userId],
      foreignColumns: [memberships.organizationId, memberships.userId],
    }).onDelete("cascade"),
  ],
);

export const chatStars = pgTable(
  "chat_stars",
  {
    organizationId: uuid("organization_id").notNull(),
    userId: uuid("user_id").notNull(),
    messageId: uuid("message_id").notNull(),
    createdAt: createdAt(),
  },
  (table) => [
    primaryKey({ columns: [table.organizationId, table.userId, table.messageId] }),
    foreignKey({
      columns: [table.organizationId, table.messageId],
      foreignColumns: [chatMessages.organizationId, chatMessages.id],
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.organizationId, table.userId],
      foreignColumns: [memberships.organizationId, memberships.userId],
    }).onDelete("cascade"),
  ],
);

export const chatPresence = pgTable(
  "chat_presence",
  {
    organizationId: uuid("organization_id").notNull(),
    userId: uuid("user_id").notNull(),
    status: text("status").notNull(),
    lastSeenAt: createdAt(),
  },
  (table) => [
    primaryKey({ columns: [table.organizationId, table.userId] }),
    foreignKey({
      columns: [table.organizationId, table.userId],
      foreignColumns: [memberships.organizationId, memberships.userId],
    }).onDelete("cascade"),
    check(
      "chat_presence_status_check",
      sql`${table.status} in ('available', 'busy', 'away', 'invisible')`,
    ),
  ],
);
