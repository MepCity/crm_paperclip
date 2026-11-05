import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  foreignKey,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { users } from "./auth";
import { memberships, organizations } from "./tenancy";

const id = () => uuid("id").default(sql`uuidv7()`).notNull();
const org = () =>
  uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" });
const ts = (name: string) => timestamp(name, { withTimezone: true });

export const approvalProcesses = pgTable(
  "approval_processes",
  {
    organizationId: org(),
    id: id(),
    kind: text("kind").notNull(),
    name: text("name").notNull(),
    module: text("module").notNull(),
    trigger: text("trigger").notNull(),
    criteria: jsonb("criteria").notNull().default(sql`'{"kind":"all_records"}'::jsonb`),
    steps: jsonb("steps").notNull(),
    reviewFields: jsonb("review_fields").notNull().default(sql`'[]'::jsonb`),
    onApprove: jsonb("on_approve").notNull().default(sql`'[]'::jsonb`),
    onReject: jsonb("on_reject").notNull().default(sql`'[]'::jsonb`),
    active: boolean("active").notNull().default(false),
    position: integer("position").notNull().default(0),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    createdAt: ts("created_at").notNull().defaultNow(),
    updatedBy: uuid("updated_by").references(() => users.id, { onDelete: "restrict" }),
    updatedAt: ts("updated_at").notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.organizationId, table.id] }),
    uniqueIndex("approval_processes_name_unique").on(
      table.organizationId,
      table.kind,
      table.module,
      sql`lower(${table.name})`,
    ),
    check("approval_processes_kind_check", sql`${table.kind} in ('approval', 'review')`),
    check(
      "approval_processes_trigger_check",
      sql`${table.trigger} in ('create', 'edit', 'create_or_edit')`,
    ),
  ],
);

export const approvalRequests = pgTable(
  "approval_requests",
  {
    organizationId: org(),
    id: id(),
    processId: uuid("process_id").notNull(),
    kind: text("kind").notNull(),
    recordModule: text("record_module").notNull(),
    recordId: text("record_id").notNull(),
    recordLabel: text("record_label").notNull().default(""),
    submitterUserId: uuid("submitter_user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    submittedAt: ts("submitted_at").notNull().defaultNow(),
    currentStep: integer("current_step").notNull().default(1),
    status: text("status").notNull(),
    decidedAt: ts("decided_at"),
  },
  (table) => [
    primaryKey({ columns: [table.organizationId, table.id] }),
    foreignKey({
      columns: [table.organizationId, table.processId],
      foreignColumns: [approvalProcesses.organizationId, approvalProcesses.id],
    }).onDelete("restrict"),
    uniqueIndex("approval_requests_one_open_per_record")
      .on(table.organizationId, table.recordModule, table.recordId)
      .where(
        sql`${table.status} in ('pending', 'waiting_review', 'in_review', 'waiting_rereview')`,
      ),
    index("approval_requests_submitted_idx").on(
      table.organizationId,
      sql`${table.submittedAt} desc`,
      sql`${table.id} desc`,
    ),
  ],
);

export const approvalRequestApprovers = pgTable(
  "approval_request_approvers",
  {
    organizationId: org(),
    requestId: uuid("request_id").notNull(),
    step: integer("step").notNull(),
    userId: uuid("user_id").notNull(),
    state: text("state").notNull().default("pending"),
    delegatedFromUserId: uuid("delegated_from_user_id"),
  },
  (table) => [
    primaryKey({ columns: [table.organizationId, table.requestId, table.step, table.userId] }),
    foreignKey({
      columns: [table.organizationId, table.requestId],
      foreignColumns: [approvalRequests.organizationId, approvalRequests.id],
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.organizationId, table.userId],
      foreignColumns: [memberships.organizationId, memberships.userId],
    }).onDelete("cascade"),
    index("approval_request_approvers_queue_idx").on(
      table.organizationId,
      table.userId,
      table.state,
    ),
  ],
);

export const approvalActions = pgTable(
  "approval_actions",
  {
    organizationId: org(),
    id: id(),
    requestId: uuid("request_id").notNull(),
    step: integer("step").notNull().default(1),
    actorUserId: uuid("actor_user_id").references(() => users.id, { onDelete: "restrict" }),
    action: text("action").notNull(),
    comment: text("comment"),
    targetUserId: uuid("target_user_id").references(() => users.id, { onDelete: "restrict" }),
    actedAt: ts("acted_at").notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.organizationId, table.id] }),
    foreignKey({
      columns: [table.organizationId, table.requestId],
      foreignColumns: [approvalRequests.organizationId, approvalRequests.id],
    }).onDelete("cascade"),
    index("approval_actions_request_idx").on(
      table.organizationId,
      table.requestId,
      table.actedAt,
      table.id,
    ),
  ],
);

export const notifications = pgTable(
  "notifications",
  {
    organizationId: org(),
    id: id(),
    recipientUserId: uuid("recipient_user_id").notNull(),
    kind: text("kind").notNull(),
    actorUserId: uuid("actor_user_id").references(() => users.id, { onDelete: "set null" }),
    subject: jsonb("subject").notNull().default(sql`'{}'::jsonb`),
    createdAt: ts("created_at").notNull().defaultNow(),
    seenAt: ts("seen_at"),
    readAt: ts("read_at"),
  },
  (table) => [
    primaryKey({ columns: [table.organizationId, table.id] }),
    foreignKey({
      columns: [table.organizationId, table.recipientUserId],
      foreignColumns: [memberships.organizationId, memberships.userId],
    }).onDelete("cascade"),
    index("notifications_recipient_idx").on(
      table.organizationId,
      table.recipientUserId,
      sql`${table.createdAt} desc`,
      sql`${table.id} desc`,
    ),
  ],
);
