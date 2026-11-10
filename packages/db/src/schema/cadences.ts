import { sql } from "drizzle-orm";
import {
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
import { memberships } from "./tenancy";

const id = () => uuid("id").default(sql`uuidv7()`).notNull();
const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();

export const cadences = pgTable(
  "cadences",
  {
    organizationId: uuid("organization_id").notNull(),
    id: id(),
    name: text("name").notNull(),
    module: text("module").notNull(),
    description: text("description").notNull().default(""),
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
    uniqueIndex("cadences_org_lower_name_idx").on(table.organizationId, sql`lower(${table.name})`),
    check(
      "cadences_module_check",
      sql`${table.module} in ('Leads', 'Contacts', 'Accounts', 'Deals')`,
    ),
    check("cadences_status_check", sql`${table.status} in ('draft', 'active', 'inactive')`),
  ],
);

export const cadenceVersions = pgTable(
  "cadence_versions",
  {
    organizationId: uuid("organization_id").notNull(),
    id: id(),
    cadenceId: uuid("cadence_id").notNull(),
    number: integer("number").notNull(),
    state: text("state").notNull().default("draft"),
    audience: jsonb("audience").notNull().default(sql`'{"kind":"manual"}'::jsonb`),
    steps: jsonb("steps").notNull().default(sql`'[]'::jsonb`),
    exitRules: jsonb("exit_rules").notNull().default(sql`'[]'::jsonb`),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    publishedBy: uuid("published_by"),
    createdAt: createdAt(),
  },
  (table) => [
    primaryKey({ columns: [table.organizationId, table.id] }),
    foreignKey({
      columns: [table.organizationId, table.cadenceId],
      foreignColumns: [cadences.organizationId, cadences.id],
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.organizationId, table.publishedBy],
      foreignColumns: [memberships.organizationId, memberships.userId],
    }).onDelete("restrict"),
    uniqueIndex("cadence_versions_org_cadence_number_idx").on(
      table.organizationId,
      table.cadenceId,
      table.number,
    ),
    uniqueIndex("cadence_versions_one_draft_idx")
      .on(table.organizationId, table.cadenceId)
      .where(sql`${table.state} = 'draft'`),
    uniqueIndex("cadence_versions_one_published_idx")
      .on(table.organizationId, table.cadenceId)
      .where(sql`${table.state} = 'published'`),
    check(
      "cadence_versions_state_check",
      sql`${table.state} in ('draft', 'published', 'superseded')`,
    ),
  ],
);

export const cadenceEnrollments = pgTable(
  "cadence_enrollments",
  {
    organizationId: uuid("organization_id").notNull(),
    id: id(),
    cadenceId: uuid("cadence_id").notNull(),
    versionId: uuid("version_id").notNull(),
    recordModule: text("record_module").notNull(),
    recordId: text("record_id").notNull(),
    enrolledBy: uuid("enrolled_by").notNull(),
    state: text("state").notNull().default("active"),
    reason: text("reason"),
    generation: integer("generation").notNull().default(1),
    nextStepId: text("next_step_id"),
    nextDueAt: timestamp("next_due_at", { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.organizationId, table.id] }),
    foreignKey({
      columns: [table.organizationId, table.cadenceId],
      foreignColumns: [cadences.organizationId, cadences.id],
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.organizationId, table.versionId],
      foreignColumns: [cadenceVersions.organizationId, cadenceVersions.id],
    }).onDelete("restrict"),
    foreignKey({
      columns: [table.organizationId, table.enrolledBy],
      foreignColumns: [memberships.organizationId, memberships.userId],
    }).onDelete("restrict"),
    uniqueIndex("cadence_enrollments_one_active_idx")
      .on(table.organizationId, table.cadenceId, table.recordModule, table.recordId)
      .where(sql`${table.state} in ('active', 'paused')`),
    index("cadence_enrollments_org_cadence_idx").on(
      table.organizationId,
      table.cadenceId,
      table.state,
    ),
    index("cadence_enrollments_org_record_idx").on(
      table.organizationId,
      table.recordModule,
      table.recordId,
    ),
    check(
      "cadence_enrollments_module_check",
      sql`${table.recordModule} in ('Leads', 'Contacts', 'Accounts', 'Deals')`,
    ),
    check(
      "cadence_enrollments_state_check",
      sql`${table.state} in ('active', 'paused', 'completed', 'exited', 'stopped')`,
    ),
  ],
);

export const cadenceStepRuns = pgTable(
  "cadence_step_runs",
  {
    organizationId: uuid("organization_id").notNull(),
    id: id(),
    enrollmentId: uuid("enrollment_id").notNull(),
    stepId: text("step_id").notNull(),
    generation: integer("generation").notNull().default(1),
    outcome: text("outcome").notNull(),
    outcomeReason: text("outcome_reason"),
    executedAt: timestamp("executed_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.organizationId, table.id] }),
    foreignKey({
      columns: [table.organizationId, table.enrollmentId],
      foreignColumns: [cadenceEnrollments.organizationId, cadenceEnrollments.id],
    }).onDelete("cascade"),
    uniqueIndex("cadence_step_runs_run_idx").on(
      table.organizationId,
      table.enrollmentId,
      table.stepId,
      table.generation,
    ),
  ],
);
