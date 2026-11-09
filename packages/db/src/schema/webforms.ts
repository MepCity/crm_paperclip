import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
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
import { memberships, organizations } from "./tenancy";

const id = () => uuid("id").default(sql`uuidv7()`).notNull();
const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();

export const webforms = pgTable(
  "webforms",
  {
    organizationId: uuid("organization_id").notNull(),
    id: id(),
    name: text("name").notNull(),
    module: text("module").notNull(),
    status: text("status").notNull().default("draft"),
    draftVersionId: uuid("draft_version_id"),
    publishedVersionId: uuid("published_version_id"),
    createdAt: createdAt(),
    createdBy: uuid("created_by").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    updatedBy: uuid("updated_by").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.organizationId, table.id] }),
    foreignKey({
      columns: [table.organizationId, table.createdBy],
      foreignColumns: [memberships.organizationId, memberships.userId],
    }).onDelete("restrict"),
    foreignKey({
      columns: [table.organizationId, table.updatedBy],
      foreignColumns: [memberships.organizationId, memberships.userId],
    }).onDelete("restrict"),
    uniqueIndex("webforms_org_lower_name_idx").on(table.organizationId, sql`lower(${table.name})`),
    check("webforms_module_check", sql`${table.module} in ('Leads', 'Contacts', 'Cases')`),
    check("webforms_status_check", sql`${table.status} in ('draft', 'active', 'inactive')`),
  ],
);

export const webformVersions = pgTable(
  "webform_versions",
  {
    organizationId: uuid("organization_id").notNull(),
    id: id(),
    formId: uuid("form_id").notNull(),
    number: integer("number").notNull(),
    state: text("state").notNull().default("draft"),
    fields: jsonb("fields").notNull().default(sql`'[]'::jsonb`),
    settings: jsonb("settings").notNull().default(sql`'{}'::jsonb`),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    publishedBy: uuid("published_by"),
    createdAt: createdAt(),
  },
  (table) => [
    primaryKey({ columns: [table.organizationId, table.id] }),
    foreignKey({
      columns: [table.organizationId, table.formId],
      foreignColumns: [webforms.organizationId, webforms.id],
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.organizationId, table.publishedBy],
      foreignColumns: [memberships.organizationId, memberships.userId],
    }).onDelete("restrict"),
    uniqueIndex("webform_versions_org_form_number_idx").on(
      table.organizationId,
      table.formId,
      table.number,
    ),
    uniqueIndex("webform_versions_one_draft_idx")
      .on(table.organizationId, table.formId)
      .where(sql`${table.state} = 'draft'`),
    uniqueIndex("webform_versions_one_published_idx")
      .on(table.organizationId, table.formId)
      .where(sql`${table.state} = 'published'`),
    check(
      "webform_versions_state_check",
      sql`${table.state} in ('draft', 'published', 'superseded')`,
    ),
  ],
);

export const webformLocations = pgTable(
  "webform_locations",
  {
    organizationId: uuid("organization_id").notNull(),
    formId: uuid("form_id").notNull(),
    origin: text("origin").notNull(),
    label: text("label").notNull().default(""),
    createdAt: createdAt(),
  },
  (table) => [
    primaryKey({ columns: [table.organizationId, table.formId, table.origin] }),
    foreignKey({
      columns: [table.organizationId, table.formId],
      foreignColumns: [webforms.organizationId, webforms.id],
    }).onDelete("cascade"),
  ],
);

export const webformSubmissions = pgTable(
  "webform_submissions",
  {
    organizationId: uuid("organization_id").notNull(),
    id: id(),
    formId: uuid("form_id").notNull(),
    versionId: uuid("version_id").notNull(),
    location: text("location").notNull(),
    outcome: text("outcome").notNull(),
    recordModule: text("record_module"),
    recordId: text("record_id"),
    payload: jsonb("payload"),
    clientHash: text("client_hash").notNull(),
    notificationState: text("notification_state").notNull().default("none"),
    createdAt: createdAt(),
  },
  (table) => [
    primaryKey({ columns: [table.organizationId, table.id] }),
    foreignKey({
      columns: [table.organizationId, table.formId],
      foreignColumns: [webforms.organizationId, webforms.id],
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.organizationId, table.versionId],
      foreignColumns: [webformVersions.organizationId, webformVersions.id],
    }).onDelete("restrict"),
    index("webform_submissions_org_form_created_idx").on(
      table.organizationId,
      table.formId,
      sql`${table.createdAt} desc`,
    ),
    check(
      "webform_submissions_outcome_check",
      sql`${table.outcome} in ('accepted', 'invalid', 'spam', 'duplicate_pending_approval', 'pending_approval', 'pending_double_opt_in', 'rejected_location', 'rate_limited')`,
    ),
    check(
      "webform_submissions_notification_state_check",
      sql`${table.notificationState} in ('none', 'queued', 'sent', 'failed')`,
    ),
  ],
);

export const webformDailyStats = pgTable(
  "webform_daily_stats",
  {
    organizationId: uuid("organization_id").notNull(),
    formId: uuid("form_id").notNull(),
    day: date("day", { mode: "string" }).notNull(),
    location: text("location").notNull(),
    visits: integer("visits").notNull().default(0),
    accepted: integer("accepted").notNull().default(0),
    invalid: integer("invalid").notNull().default(0),
    spam: integer("spam").notNull().default(0),
    duplicatePendingApproval: integer("duplicate_pending_approval").notNull().default(0),
    pendingApproval: integer("pending_approval").notNull().default(0),
    pendingDoubleOptIn: integer("pending_double_opt_in").notNull().default(0),
    rejectedLocation: integer("rejected_location").notNull().default(0),
    rateLimited: integer("rate_limited").notNull().default(0),
  },
  (table) => [
    primaryKey({ columns: [table.organizationId, table.formId, table.day, table.location] }),
    foreignKey({
      columns: [table.organizationId, table.formId],
      foreignColumns: [webforms.organizationId, webforms.id],
    }).onDelete("cascade"),
  ],
);

export const webformAutoResponseRules = pgTable(
  "webform_auto_response_rules",
  {
    organizationId: uuid("organization_id").notNull(),
    id: id(),
    module: text("module").notNull(),
    name: text("name").notNull(),
    criteria: jsonb("criteria").notNull().default(sql`'{}'::jsonb`),
    templateId: text("template_id"),
    position: integer("position").notNull().default(0),
    active: boolean("active").notNull().default(true),
    createdAt: createdAt(),
    createdBy: uuid("created_by").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    updatedBy: uuid("updated_by").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.organizationId, table.id] }),
    foreignKey({
      columns: [table.organizationId, table.createdBy],
      foreignColumns: [memberships.organizationId, memberships.userId],
    }).onDelete("restrict"),
    foreignKey({
      columns: [table.organizationId, table.updatedBy],
      foreignColumns: [memberships.organizationId, memberships.userId],
    }).onDelete("restrict"),
    index("webform_auto_response_rules_org_pos_idx").on(
      table.organizationId,
      table.module,
      table.position,
    ),
    check(
      "webform_auto_response_rules_module_check",
      sql`${table.module} in ('Leads', 'Contacts', 'Cases')`,
    ),
  ],
);

export const publicRateLimits = pgTable(
  "public_rate_limits",
  {
    organizationId: uuid("organization_id").notNull(),
    bucket: text("bucket").notNull(),
    windowStart: timestamp("window_start", { withTimezone: true }).notNull(),
    count: integer("count").notNull().default(0),
  },
  (table) => [primaryKey({ columns: [table.organizationId, table.bucket, table.windowStart] })],
);

export const publicEndpointKeys = pgTable(
  "public_endpoint_keys",
  {
    keyHash: text("key_hash").notNull().primaryKey(),
    organizationId: uuid("organization_id").notNull(),
    kind: text("kind").notNull(),
    targetId: uuid("target_id").notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (table) => [
    foreignKey({
      columns: [table.organizationId],
      foreignColumns: [organizations.id],
    }).onDelete("cascade"),
    index("public_endpoint_keys_org_target_idx").on(
      table.organizationId,
      table.kind,
      table.targetId,
    ),
    check("public_endpoint_keys_kind_check", sql`${table.kind} in ('webform')`),
  ],
);
