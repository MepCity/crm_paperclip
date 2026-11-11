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

export const journeys = pgTable(
  "journeys",
  {
    organizationId: uuid("organization_id").notNull(),
    id: id(),
    name: text("name").notNull(),
    module: text("module").notNull(),
    description: text("description").notNull().default(""),
    status: text("status").notNull().default("draft"),
    draftVersionId: uuid("draft_version_id"),
    activeVersionId: uuid("active_version_id"),
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
    uniqueIndex("journeys_org_lower_name_idx").on(table.organizationId, sql`lower(${table.name})`),
    check(
      "journeys_module_check",
      sql`${table.module} in ('Leads', 'Contacts', 'Accounts', 'Deals')`,
    ),
    check("journeys_status_check", sql`${table.status} in ('draft', 'active', 'inactive')`),
  ],
);

export const journeyVersions = pgTable(
  "journey_versions",
  {
    organizationId: uuid("organization_id").notNull(),
    id: id(),
    journeyId: uuid("journey_id").notNull(),
    number: integer("number").notNull(),
    state: text("state").notNull().default("draft"),
    states: jsonb("states").notNull().default(sql`'[]'::jsonb`),
    transitions: jsonb("transitions").notNull().default(sql`'[]'::jsonb`),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    publishedBy: uuid("published_by"),
    createdAt: createdAt(),
  },
  (table) => [
    primaryKey({ columns: [table.organizationId, table.id] }),
    foreignKey({
      columns: [table.organizationId, table.journeyId],
      foreignColumns: [journeys.organizationId, journeys.id],
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.organizationId, table.publishedBy],
      foreignColumns: [memberships.organizationId, memberships.userId],
    }).onDelete("restrict"),
    uniqueIndex("journey_versions_org_journey_number_idx").on(
      table.organizationId,
      table.journeyId,
      table.number,
    ),
    uniqueIndex("journey_versions_one_draft_idx")
      .on(table.organizationId, table.journeyId)
      .where(sql`${table.state} = 'draft'`),
    uniqueIndex("journey_versions_one_active_idx")
      .on(table.organizationId, table.journeyId)
      .where(sql`${table.state} = 'active'`),
    check("journey_versions_state_check", sql`${table.state} in ('draft', 'active', 'superseded')`),
  ],
);

export const journeyInstances = pgTable(
  "journey_instances",
  {
    organizationId: uuid("organization_id").notNull(),
    id: id(),
    journeyId: uuid("journey_id").notNull(),
    versionId: uuid("version_id").notNull(),
    recordModule: text("record_module").notNull(),
    recordId: text("record_id").notNull(),
    currentStateId: text("current_state_id").notNull(),
    stateEnteredAt: timestamp("state_entered_at", { withTimezone: true }).notNull().defaultNow(),
    deadlineAt: timestamp("deadline_at", { withTimezone: true }),
    status: text("status").notNull().default("active"),
    generation: integer("generation").notNull().default(1),
    createdAt: createdAt(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.organizationId, table.id] }),
    foreignKey({
      columns: [table.organizationId, table.journeyId],
      foreignColumns: [journeys.organizationId, journeys.id],
    }).onDelete("cascade"),
    foreignKey({
      columns: [table.organizationId, table.versionId],
      foreignColumns: [journeyVersions.organizationId, journeyVersions.id],
    }).onDelete("restrict"),
    uniqueIndex("journey_instances_one_active_idx")
      .on(table.organizationId, table.journeyId, table.recordModule, table.recordId)
      .where(sql`${table.status} = 'active'`),
    index("journey_instances_org_journey_idx").on(
      table.organizationId,
      table.journeyId,
      table.status,
    ),
    index("journey_instances_org_record_idx").on(
      table.organizationId,
      table.recordModule,
      table.recordId,
    ),
    check(
      "journey_instances_module_check",
      sql`${table.recordModule} in ('Leads', 'Contacts', 'Accounts', 'Deals')`,
    ),
    check(
      "journey_instances_status_check",
      sql`${table.status} in ('active', 'completed', 'exited', 'stopped')`,
    ),
  ],
);

export const journeyTransitionRuns = pgTable(
  "journey_transition_runs",
  {
    organizationId: uuid("organization_id").notNull(),
    id: id(),
    instanceId: uuid("instance_id").notNull(),
    transitionId: text("transition_id").notNull(),
    eventId: text("event_id").notNull(),
    result: text("result").notNull().default("success"),
    resultReason: text("result_reason"),
    executedAt: timestamp("executed_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.organizationId, table.id] }),
    foreignKey({
      columns: [table.organizationId, table.instanceId],
      foreignColumns: [journeyInstances.organizationId, journeyInstances.id],
    }).onDelete("cascade"),
    uniqueIndex("journey_transition_runs_run_idx").on(
      table.organizationId,
      table.instanceId,
      table.transitionId,
      table.eventId,
    ),
  ],
);

export const journeyDueActions = pgTable(
  "journey_due_actions",
  {
    organizationId: uuid("organization_id").notNull(),
    id: id(),
    instanceId: uuid("instance_id").notNull(),
    stateId: text("state_id").notNull(),
    actionId: text("action_id").notNull(),
    dueAt: timestamp("due_at", { withTimezone: true }).notNull(),
    generation: integer("generation").notNull().default(1),
    outcome: text("outcome"),
    outcomeReason: text("outcome_reason"),
    executedAt: timestamp("executed_at", { withTimezone: true }),
    createdAt: createdAt(),
  },
  (table) => [
    primaryKey({ columns: [table.organizationId, table.id] }),
    foreignKey({
      columns: [table.organizationId, table.instanceId],
      foreignColumns: [journeyInstances.organizationId, journeyInstances.id],
    }).onDelete("cascade"),
    uniqueIndex("journey_due_actions_run_idx").on(
      table.organizationId,
      table.instanceId,
      table.stateId,
      table.actionId,
      table.generation,
    ),
    index("journey_due_actions_due_idx")
      .on(table.organizationId, table.dueAt)
      .where(sql`${table.outcome} is null`),
  ],
);
