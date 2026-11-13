import { randomUUID } from "node:crypto";
import { schema } from "@crm/db";
import { and, count, desc, eq, gte, ilike, inArray, lte, sql } from "drizzle-orm";
import { getAccessSnapshot } from "../access";
import { ConflictError, NotFoundError, ValidationError } from "../errors";
import type { RecordData } from "../records";
import type { RecordWriteEvent, RecordWriteObserver } from "../records/write-observer";
import { withOrg } from "../tenancy";
import type { OrgContext } from "../tenancy/types";
import { computeDueAt } from "./delays";
import {
  type CreateJourneyInput,
  JOURNEY_MODULES,
  type JourneyDetail,
  type JourneyInstanceFilterOptions,
  type JourneyInstanceStatus,
  type JourneyInstanceSummary,
  type JourneyModule,
  type JourneyReportData,
  type JourneyReportSummary,
  type JourneyState,
  type JourneyStateReportMetric,
  type JourneyStatus,
  type JourneySummary,
  type JourneyTransition,
  type JourneyTransitionReportMetric,
  type JourneyTransitionRunSummary,
  type JourneyTrigger,
  type JourneyVersionState,
  type JourneyVersionSummary,
  type RecordJourneyInstanceItem,
  type UpdateJourneyDraftInput,
} from "./types";
import {
  validateCreateJourney,
  validateJourneyForPublish,
  validateUpdateJourneyDraft,
} from "./validation";
import { executeActionEffect, executeJourneyTransition, type JourneysWorkerDeps } from "./worker";

function normalizeTriggerKind(trigger: JourneyTrigger): string {
  if (typeof trigger === "string") return trigger;
  if ("kind" in trigger) return trigger.kind;
  if ("type" in trigger) return (trigger as { type: string }).type;
  return "unknown";
}

export function formatDuration(ms: number): string {
  if (ms <= 0 || Number.isNaN(ms)) return "0m";
  if (ms < 60000) return "< 1m";
  const minutes = Math.floor(ms / 60000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (hours < 24) {
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  }
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
}

type Tx = Parameters<Parameters<typeof withOrg>[1]>[0];

function mapVersion(row: typeof schema.journeyVersions.$inferSelect): JourneyVersionSummary {
  return {
    id: row.id,
    journeyId: row.journeyId,
    number: row.number,
    state: row.state as JourneyVersionState,
    states: (row.states ?? []) as JourneyState[],
    transitions: (row.transitions ?? []) as JourneyTransition[],
    publishedAt: row.publishedAt?.toISOString() ?? null,
    publishedBy: row.publishedBy ?? null,
    createdAt: row.createdAt.toISOString(),
  };
}

function mapJourney(row: typeof schema.journeys.$inferSelect) {
  return {
    id: row.id,
    name: row.name,
    module: row.module as JourneyModule,
    description: row.description,
    status: row.status as JourneyStatus,
    draftVersionId: row.draftVersionId,
    activeVersionId: row.activeVersionId,
    createdAt: row.createdAt.toISOString(),
    createdBy: row.createdBy,
    updatedAt: row.updatedAt.toISOString(),
    updatedBy: row.updatedBy,
  };
}

async function getJourneyInternal(
  tx: Tx,
  orgId: string,
  journeyId: string,
): Promise<JourneyDetail> {
  const [journeyRow] = await tx
    .select()
    .from(schema.journeys)
    .where(and(eq(schema.journeys.organizationId, orgId), eq(schema.journeys.id, journeyId)));
  if (!journeyRow) throw new NotFoundError("Journey not found");

  const versionRows = await tx
    .select()
    .from(schema.journeyVersions)
    .where(
      and(
        eq(schema.journeyVersions.organizationId, orgId),
        eq(schema.journeyVersions.journeyId, journeyId),
      ),
    )
    .orderBy(desc(schema.journeyVersions.number));

  const versions = versionRows.map(mapVersion);

  const draftVersion = journeyRow.draftVersionId
    ? (versions.find((v) => v.id === journeyRow.draftVersionId) ?? null)
    : null;
  const activeVersion = journeyRow.activeVersionId
    ? (versions.find((v) => v.id === journeyRow.activeVersionId) ?? null)
    : null;

  const currentVersion = draftVersion ?? activeVersion ?? versions[0] ?? null;
  if (!currentVersion) {
    throw new NotFoundError("No versions found for journey");
  }

  const [instanceCount] = await tx
    .select({ count: count(schema.journeyInstances.id) })
    .from(schema.journeyInstances)
    .where(
      and(
        eq(schema.journeyInstances.organizationId, orgId),
        eq(schema.journeyInstances.journeyId, journeyId),
        eq(schema.journeyInstances.status, "active"),
      ),
    );

  return {
    ...mapJourney(journeyRow),
    draftVersion,
    activeVersion,
    currentVersion,
    currentRecordCount: Number(instanceCount?.count ?? 0),
  };
}

/**
 * Process-wide, so callers that build a service per request (web-form intake) still hit it and
 * an invalidation from any instance reaches every reader (MEP-1519).
 */
const activeJourneysCache = new Map<
  string,
  { fetchedAt: number; journeys: (typeof schema.journeys.$inferSelect)[] }
>();

export function createJourneysService(defaultDeps?: Partial<JourneysWorkerDeps>) {
  const resolvedDeps: JourneysWorkerDeps = {
    accessSnapshotProvider:
      defaultDeps?.accessSnapshotProvider ??
      ((ctx: OrgContext, userId: string) =>
        getAccessSnapshot({ ...ctx, userId, accessVersion: undefined })),
    ...defaultDeps,
  };

  function invalidateCache(orgId?: string) {
    if (orgId) {
      activeJourneysCache.delete(orgId);
    } else {
      activeJourneysCache.clear();
    }
  }

  async function getActiveJourneysForModule(
    ctx: OrgContext,
    module: string,
  ): Promise<(typeof schema.journeys.$inferSelect)[]> {
    const cached = activeJourneysCache.get(ctx.orgId);
    const now = Date.now();
    if (cached && now - cached.fetchedAt < 5000) {
      return cached.journeys.filter((j) => j.module === module);
    }
    const activeJourneys = await withOrg(ctx, async (tx) => {
      return tx
        .select()
        .from(schema.journeys)
        .where(
          and(
            eq(schema.journeys.organizationId, ctx.orgId),
            eq(schema.journeys.status, "active"),
            sql`${schema.journeys.activeVersionId} IS NOT NULL`,
          ),
        );
    });
    activeJourneysCache.set(ctx.orgId, { fetchedAt: now, journeys: activeJourneys });
    return activeJourneys.filter((j) => j.module === module);
  }
  return {
    async listJourneys(
      ctx: OrgContext,
      options?: {
        search?: string;
        module?: string;
        status?: string;
      },
    ): Promise<JourneySummary[]> {
      return withOrg(ctx, async (tx) => {
        const conditions = [eq(schema.journeys.organizationId, ctx.orgId)];

        if (options?.search) {
          conditions.push(ilike(schema.journeys.name, `%${options.search}%`));
        }
        if (options?.module && options.module !== "all") {
          conditions.push(eq(schema.journeys.module, options.module));
        }
        if (options?.status && options.status !== "all") {
          conditions.push(eq(schema.journeys.status, options.status));
        }

        const journeysList = await tx
          .select()
          .from(schema.journeys)
          .where(and(...conditions))
          .orderBy(desc(schema.journeys.updatedAt));

        if (journeysList.length === 0) return [];

        const journeyIds = journeysList.map((j) => j.id);

        const instanceCounts = await tx
          .select({
            journeyId: schema.journeyInstances.journeyId,
            count: count(schema.journeyInstances.id),
          })
          .from(schema.journeyInstances)
          .where(
            and(
              eq(schema.journeyInstances.organizationId, ctx.orgId),
              sql`${schema.journeyInstances.journeyId} in ${journeyIds}`,
              eq(schema.journeyInstances.status, "active"),
            ),
          )
          .groupBy(schema.journeyInstances.journeyId);

        const countMap = new Map(instanceCounts.map((ic) => [ic.journeyId, Number(ic.count)]));

        return journeysList.map((j) => ({
          id: j.id,
          name: j.name,
          module: j.module as JourneyModule,
          description: j.description,
          status: j.status as JourneyStatus,
          draftVersionId: j.draftVersionId,
          activeVersionId: j.activeVersionId,
          currentRecordCount: countMap.get(j.id) ?? 0,
          lastModifiedAt: j.updatedAt.toISOString(),
          lastModifiedBy: {
            id: j.updatedBy,
            name: "User",
            avatarUrl: null,
          },
        }));
      });
    },

    async getJourney(ctx: OrgContext, journeyId: string): Promise<JourneyDetail> {
      return withOrg(ctx, async (tx) => {
        return getJourneyInternal(tx, ctx.orgId, journeyId);
      });
    },

    async createJourney(ctx: OrgContext, rawInput: CreateJourneyInput): Promise<JourneyDetail> {
      const input = validateCreateJourney(rawInput);

      return withOrg(ctx, async (tx) => {
        const [existing] = await tx
          .select({ id: schema.journeys.id })
          .from(schema.journeys)
          .where(
            and(
              eq(schema.journeys.organizationId, ctx.orgId),
              sql`lower(${schema.journeys.name}) = lower(${input.name})`,
            ),
          );
        if (existing) {
          throw new ConflictError("Journey name must be unique");
        }

        const [createdJourney] = await tx
          .insert(schema.journeys)
          .values({
            organizationId: ctx.orgId,
            name: input.name,
            module: input.module,
            description: input.description ?? "",
            status: "draft",
            createdBy: ctx.userId,
            updatedBy: ctx.userId,
          })
          .returning();

        if (!createdJourney) throw new Error("Failed to create journey");

        const initialStates: JourneyState[] = [
          {
            id: "state_start",
            name: "Start",
            isStart: true,
            actions: [],
            deadline: null,
          },
        ];

        const [createdVersion] = await tx
          .insert(schema.journeyVersions)
          .values({
            organizationId: ctx.orgId,
            journeyId: createdJourney.id,
            number: 1,
            state: "draft",
            states: initialStates,
            transitions: [],
          })
          .returning();

        if (!createdVersion) throw new Error("Failed to create journey version");

        await tx
          .update(schema.journeys)
          .set({
            draftVersionId: createdVersion.id,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(schema.journeys.organizationId, ctx.orgId),
              eq(schema.journeys.id, createdJourney.id),
            ),
          );

        return getJourneyInternal(tx, ctx.orgId, createdJourney.id);
      });
    },

    async updateJourneyDraft(
      ctx: OrgContext,
      journeyId: string,
      rawInput: UpdateJourneyDraftInput,
    ): Promise<JourneyDetail> {
      const input = validateUpdateJourneyDraft(rawInput);

      return withOrg(ctx, async (tx) => {
        const [journey] = await tx
          .select()
          .from(schema.journeys)
          .where(
            and(eq(schema.journeys.organizationId, ctx.orgId), eq(schema.journeys.id, journeyId)),
          );
        if (!journey) throw new NotFoundError("Journey not found");

        if (input.name && input.name.toLowerCase() !== journey.name.toLowerCase()) {
          const [conflict] = await tx
            .select({ id: schema.journeys.id })
            .from(schema.journeys)
            .where(
              and(
                eq(schema.journeys.organizationId, ctx.orgId),
                sql`lower(${schema.journeys.name}) = lower(${input.name})`,
                sql`${schema.journeys.id} <> ${journeyId}`,
              ),
            );
          if (conflict) {
            throw new ConflictError("Journey name must be unique");
          }
        }

        let draftVersionId = journey.draftVersionId;

        if (draftVersionId) {
          // Update existing draft version
          const versionUpdates: Partial<typeof schema.journeyVersions.$inferInsert> = {};
          if (input.states !== undefined) versionUpdates.states = input.states;
          if (input.transitions !== undefined) versionUpdates.transitions = input.transitions;

          if (Object.keys(versionUpdates).length > 0) {
            await tx
              .update(schema.journeyVersions)
              .set(versionUpdates)
              .where(
                and(
                  eq(schema.journeyVersions.organizationId, ctx.orgId),
                  eq(schema.journeyVersions.id, draftVersionId),
                  eq(schema.journeyVersions.state, "draft"),
                ),
              );
          }
        } else {
          // No draft version exists - fork new draft version from active version or start fresh
          let states: JourneyState[] = input.states ?? [];
          let transitions: JourneyTransition[] = input.transitions ?? [];

          if (journey.activeVersionId) {
            const [activeVersion] = await tx
              .select()
              .from(schema.journeyVersions)
              .where(
                and(
                  eq(schema.journeyVersions.organizationId, ctx.orgId),
                  eq(schema.journeyVersions.id, journey.activeVersionId),
                ),
              );
            if (activeVersion) {
              if (input.states === undefined) states = activeVersion.states as JourneyState[];
              if (input.transitions === undefined)
                transitions = activeVersion.transitions as JourneyTransition[];
            }
          }

          const [maxNum] = await tx
            .select({ max: sql<number>`coalesce(max(${schema.journeyVersions.number}), 0)` })
            .from(schema.journeyVersions)
            .where(
              and(
                eq(schema.journeyVersions.organizationId, ctx.orgId),
                eq(schema.journeyVersions.journeyId, journeyId),
              ),
            );

          const newNumber = Number(maxNum?.max ?? 0) + 1;

          const [newDraft] = await tx
            .insert(schema.journeyVersions)
            .values({
              organizationId: ctx.orgId,
              journeyId,
              number: newNumber,
              state: "draft",
              states,
              transitions,
            })
            .returning();

          if (!newDraft) throw new Error("Failed to create draft version");
          draftVersionId = newDraft.id;
        }

        const journeyUpdates: Partial<typeof schema.journeys.$inferInsert> = {
          updatedAt: new Date(),
          updatedBy: ctx.userId,
        };
        if (input.name) journeyUpdates.name = input.name;
        if (input.description !== undefined) journeyUpdates.description = input.description;
        if (draftVersionId !== journey.draftVersionId) {
          journeyUpdates.draftVersionId = draftVersionId;
        }

        await tx
          .update(schema.journeys)
          .set(journeyUpdates)
          .where(
            and(eq(schema.journeys.organizationId, ctx.orgId), eq(schema.journeys.id, journeyId)),
          );

        return getJourneyInternal(tx, ctx.orgId, journeyId);
      });
    },

    async publishJourney(ctx: OrgContext, journeyId: string): Promise<JourneyDetail> {
      return withOrg(ctx, async (tx) => {
        const [journey] = await tx
          .select()
          .from(schema.journeys)
          .where(
            and(eq(schema.journeys.organizationId, ctx.orgId), eq(schema.journeys.id, journeyId)),
          );
        if (!journey) throw new NotFoundError("Journey not found");

        if (!journey.draftVersionId) {
          if (journey.activeVersionId) {
            return getJourneyInternal(tx, ctx.orgId, journeyId);
          }
          throw new ValidationError({ journey: ["No draft version to publish"] });
        }

        const [draft] = await tx
          .select()
          .from(schema.journeyVersions)
          .where(
            and(
              eq(schema.journeyVersions.organizationId, ctx.orgId),
              eq(schema.journeyVersions.id, journey.draftVersionId),
              eq(schema.journeyVersions.state, "draft"),
            ),
          );
        if (!draft) throw new NotFoundError("Draft version not found");

        const states = (draft.states ?? []) as JourneyState[];
        const transitions = (draft.transitions ?? []) as JourneyTransition[];

        validateJourneyForPublish(states, transitions);

        // Atomically supersede old active version if present
        if (journey.activeVersionId) {
          await tx
            .update(schema.journeyVersions)
            .set({
              state: "superseded",
            })
            .where(
              and(
                eq(schema.journeyVersions.organizationId, ctx.orgId),
                eq(schema.journeyVersions.id, journey.activeVersionId),
                eq(schema.journeyVersions.state, "active"),
              ),
            );

          // Republish bumps generation in active instances (Scope 4)
          await tx
            .update(schema.journeyInstances)
            .set({
              generation: sql`${schema.journeyInstances.generation} + 1`,
              updatedAt: new Date(),
            })
            .where(
              and(
                eq(schema.journeyInstances.organizationId, ctx.orgId),
                eq(schema.journeyInstances.journeyId, journeyId),
                eq(schema.journeyInstances.status, "active"),
              ),
            );
        }

        // Activate the draft version
        await tx
          .update(schema.journeyVersions)
          .set({
            state: "active",
            publishedAt: new Date(),
            publishedBy: ctx.userId,
          })
          .where(
            and(
              eq(schema.journeyVersions.organizationId, ctx.orgId),
              eq(schema.journeyVersions.id, draft.id),
              eq(schema.journeyVersions.state, "draft"),
            ),
          );

        // Update the journey
        await tx
          .update(schema.journeys)
          .set({
            status: "active",
            activeVersionId: draft.id,
            draftVersionId: null,
            updatedAt: new Date(),
            updatedBy: ctx.userId,
          })
          .where(
            and(eq(schema.journeys.organizationId, ctx.orgId), eq(schema.journeys.id, journeyId)),
          );

        invalidateCache(ctx.orgId);
        return getJourneyInternal(tx, ctx.orgId, journeyId);
      });
    },

    async activateJourney(ctx: OrgContext, journeyId: string): Promise<JourneyDetail> {
      return withOrg(ctx, async (tx) => {
        const [journey] = await tx
          .select()
          .from(schema.journeys)
          .where(
            and(eq(schema.journeys.organizationId, ctx.orgId), eq(schema.journeys.id, journeyId)),
          );
        if (!journey) throw new NotFoundError("Journey not found");

        if (!journey.activeVersionId) {
          throw new ValidationError({
            status: ["Cannot activate a journey that has never been published"],
          });
        }

        await tx
          .update(schema.journeys)
          .set({
            status: "active",
            updatedAt: new Date(),
            updatedBy: ctx.userId,
          })
          .where(
            and(eq(schema.journeys.organizationId, ctx.orgId), eq(schema.journeys.id, journeyId)),
          );

        invalidateCache(ctx.orgId);
        return getJourneyInternal(tx, ctx.orgId, journeyId);
      });
    },

    async deactivateJourney(ctx: OrgContext, journeyId: string): Promise<JourneyDetail> {
      return withOrg(ctx, async (tx) => {
        const [journey] = await tx
          .select()
          .from(schema.journeys)
          .where(
            and(eq(schema.journeys.organizationId, ctx.orgId), eq(schema.journeys.id, journeyId)),
          );
        if (!journey) throw new NotFoundError("Journey not found");

        await tx
          .update(schema.journeys)
          .set({
            status: "inactive",
            updatedAt: new Date(),
            updatedBy: ctx.userId,
          })
          .where(
            and(eq(schema.journeys.organizationId, ctx.orgId), eq(schema.journeys.id, journeyId)),
          );

        // Deactivate bumps generation in active instances (Scope 4)
        await tx
          .update(schema.journeyInstances)
          .set({
            generation: sql`${schema.journeyInstances.generation} + 1`,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(schema.journeyInstances.organizationId, ctx.orgId),
              eq(schema.journeyInstances.journeyId, journeyId),
              eq(schema.journeyInstances.status, "active"),
            ),
          );

        invalidateCache(ctx.orgId);
        return getJourneyInternal(tx, ctx.orgId, journeyId);
      });
    },

    async deleteJourney(ctx: OrgContext, journeyId: string): Promise<void> {
      return withOrg(ctx, async (tx) => {
        const [journey] = await tx
          .select({ id: schema.journeys.id })
          .from(schema.journeys)
          .where(
            and(eq(schema.journeys.organizationId, ctx.orgId), eq(schema.journeys.id, journeyId)),
          );
        if (!journey) throw new NotFoundError("Journey not found");

        await tx
          .delete(schema.journeys)
          .where(
            and(eq(schema.journeys.organizationId, ctx.orgId), eq(schema.journeys.id, journeyId)),
          );

        invalidateCache(ctx.orgId);
      });
    },

    async listJourneyInstances(
      ctx: OrgContext,
      journeyId: string,
      options?: JourneyInstanceFilterOptions,
    ): Promise<{ instances: JourneyInstanceSummary[]; total: number }> {
      return withOrg(ctx, async (tx) => {
        const conditions = [
          eq(schema.journeyInstances.organizationId, ctx.orgId),
          eq(schema.journeyInstances.journeyId, journeyId),
        ];

        if (options?.stateId) {
          conditions.push(eq(schema.journeyInstances.currentStateId, options.stateId));
        }
        if (options?.status) {
          conditions.push(eq(schema.journeyInstances.status, options.status));
        }
        if (options?.enteredBefore) {
          conditions.push(
            lte(schema.journeyInstances.stateEnteredAt, new Date(options.enteredBefore)),
          );
        }
        if (options?.enteredAfter) {
          conditions.push(
            sql`${schema.journeyInstances.stateEnteredAt} >= ${new Date(options.enteredAfter)}`,
          );
        }
        if (options?.deadlineBefore) {
          conditions.push(
            lte(schema.journeyInstances.deadlineAt, new Date(options.deadlineBefore)),
          );
        }
        if (options?.deadlineAfter) {
          conditions.push(
            sql`${schema.journeyInstances.deadlineAt} >= ${new Date(options.deadlineAfter)}`,
          );
        }
        if (options?.hasDeadline !== undefined) {
          if (options.hasDeadline) {
            conditions.push(sql`${schema.journeyInstances.deadlineAt} IS NOT NULL`);
          } else {
            conditions.push(sql`${schema.journeyInstances.deadlineAt} IS NULL`);
          }
        }

        const [totalRow] = await tx
          .select({ count: count(schema.journeyInstances.id) })
          .from(schema.journeyInstances)
          .where(and(...conditions));

        const page = Math.max(1, options?.page ?? 1);
        const limit = Math.min(100, Math.max(1, options?.limit ?? 50));
        const offset = (page - 1) * limit;

        const rows = await tx
          .select()
          .from(schema.journeyInstances)
          .where(and(...conditions))
          .orderBy(desc(schema.journeyInstances.createdAt))
          .limit(limit)
          .offset(offset);

        const instances: JourneyInstanceSummary[] = rows.map((r) => ({
          id: r.id,
          journeyId: r.journeyId,
          versionId: r.versionId,
          recordModule: r.recordModule as JourneyModule,
          recordId: r.recordId,
          currentStateId: r.currentStateId,
          stateEnteredAt: r.stateEnteredAt.toISOString(),
          deadlineAt: r.deadlineAt?.toISOString() ?? null,
          status: r.status as JourneyInstanceStatus,
          generation: r.generation,
          createdAt: r.createdAt.toISOString(),
          updatedAt: r.updatedAt.toISOString(),
        }));

        return { instances, total: Number(totalRow?.count ?? 0) };
      });
    },

    async getJourneyInstance(ctx: OrgContext, instanceId: string): Promise<JourneyInstanceSummary> {
      return withOrg(ctx, async (tx) => {
        const [row] = await tx
          .select()
          .from(schema.journeyInstances)
          .where(
            and(
              eq(schema.journeyInstances.organizationId, ctx.orgId),
              eq(schema.journeyInstances.id, instanceId),
            ),
          );
        if (!row) throw new NotFoundError("Journey instance not found");

        return {
          id: row.id,
          journeyId: row.journeyId,
          versionId: row.versionId,
          recordModule: row.recordModule as JourneyModule,
          recordId: row.recordId,
          currentStateId: row.currentStateId,
          stateEnteredAt: row.stateEnteredAt.toISOString(),
          deadlineAt: row.deadlineAt?.toISOString() ?? null,
          status: row.status as JourneyInstanceStatus,
          generation: row.generation,
          createdAt: row.createdAt.toISOString(),
          updatedAt: row.updatedAt.toISOString(),
        };
      });
    },

    async getJourneyTransitionLog(
      ctx: OrgContext,
      instanceId: string,
    ): Promise<JourneyTransitionRunSummary[]> {
      return withOrg(ctx, async (tx) => {
        const rows = await tx
          .select()
          .from(schema.journeyTransitionRuns)
          .where(
            and(
              eq(schema.journeyTransitionRuns.organizationId, ctx.orgId),
              eq(schema.journeyTransitionRuns.instanceId, instanceId),
            ),
          )
          .orderBy(schema.journeyTransitionRuns.executedAt);

        return rows.map((r) => ({
          id: r.id,
          instanceId: r.instanceId,
          transitionId: r.transitionId,
          eventId: r.eventId,
          result: r.result,
          resultReason: r.resultReason ?? null,
          executedAt: r.executedAt.toISOString(),
        }));
      });
    },

    async stopJourneyInstance(
      ctx: OrgContext,
      instanceId: string,
    ): Promise<JourneyInstanceSummary> {
      return withOrg(ctx, async (tx) => {
        const [instance] = await tx
          .select()
          .from(schema.journeyInstances)
          .where(
            and(
              eq(schema.journeyInstances.organizationId, ctx.orgId),
              eq(schema.journeyInstances.id, instanceId),
            ),
          );
        if (!instance) throw new NotFoundError("Journey instance not found");

        const [updated] = await tx
          .update(schema.journeyInstances)
          .set({
            status: "stopped",
            generation: sql`${schema.journeyInstances.generation} + 1`,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(schema.journeyInstances.organizationId, ctx.orgId),
              eq(schema.journeyInstances.id, instanceId),
            ),
          )
          .returning();

        if (!updated) throw new Error("Failed to stop journey instance");

        return {
          id: updated.id,
          journeyId: updated.journeyId,
          versionId: updated.versionId,
          recordModule: updated.recordModule as JourneyModule,
          recordId: updated.recordId,
          currentStateId: updated.currentStateId,
          stateEnteredAt: updated.stateEnteredAt.toISOString(),
          deadlineAt: updated.deadlineAt?.toISOString() ?? null,
          status: updated.status as JourneyInstanceStatus,
          generation: updated.generation,
          createdAt: updated.createdAt.toISOString(),
          updatedAt: updated.updatedAt.toISOString(),
        };
      });
    },

    async getJourneyReport(
      ctx: OrgContext,
      journeyId: string,
      options?: { startDate?: string; endDate?: string },
    ): Promise<JourneyReportData> {
      return withOrg(ctx, async (tx) => {
        const [journeyRow] = await tx
          .select()
          .from(schema.journeys)
          .where(
            and(eq(schema.journeys.organizationId, ctx.orgId), eq(schema.journeys.id, journeyId)),
          );
        if (!journeyRow) throw new NotFoundError("Journey not found");

        const targetVersionId = journeyRow.activeVersionId ?? journeyRow.draftVersionId;
        let states: JourneyState[] = [];
        let transitions: JourneyTransition[] = [];
        if (targetVersionId) {
          const [versionRow] = await tx
            .select()
            .from(schema.journeyVersions)
            .where(
              and(
                eq(schema.journeyVersions.organizationId, ctx.orgId),
                eq(schema.journeyVersions.id, targetVersionId),
              ),
            );
          if (versionRow) {
            states = (versionRow.states as JourneyState[]) ?? [];
            transitions = (versionRow.transitions as JourneyTransition[]) ?? [];
          }
        }

        const instanceConditions = [
          eq(schema.journeyInstances.organizationId, ctx.orgId),
          eq(schema.journeyInstances.journeyId, journeyId),
        ];

        let startDate: Date | null = null;
        let endDate: Date | null = null;

        if (options?.startDate) {
          const d = new Date(options.startDate);
          if (!Number.isNaN(d.getTime())) {
            startDate = d;
            instanceConditions.push(gte(schema.journeyInstances.createdAt, startDate));
          }
        }
        if (options?.endDate) {
          const d = new Date(options.endDate);
          if (!Number.isNaN(d.getTime())) {
            if (options.endDate.length === 10) {
              endDate = new Date(`${options.endDate}T23:59:59.999Z`);
            } else {
              endDate = d;
            }
            instanceConditions.push(lte(schema.journeyInstances.createdAt, endDate));
          }
        }

        const instances = await tx
          .select()
          .from(schema.journeyInstances)
          .where(and(...instanceConditions));

        const instanceIds = instances.map((i) => i.id);

        let transitionRuns: (typeof schema.journeyTransitionRuns.$inferSelect)[] = [];
        if (instanceIds.length > 0) {
          const runConditions = [
            eq(schema.journeyTransitionRuns.organizationId, ctx.orgId),
            sql`${schema.journeyTransitionRuns.instanceId} in (${sql.join(
              instanceIds.map((id) => sql`${id}`),
              sql`, `,
            )})`,
          ];
          if (startDate) {
            runConditions.push(gte(schema.journeyTransitionRuns.executedAt, startDate));
          }
          if (endDate) {
            runConditions.push(lte(schema.journeyTransitionRuns.executedAt, endDate));
          }

          transitionRuns = await tx
            .select()
            .from(schema.journeyTransitionRuns)
            .where(and(...runConditions))
            .orderBy(schema.journeyTransitionRuns.executedAt);
        }

        const summary: JourneyReportSummary = {
          totalInstances: instances.length,
          active: instances.filter((i) => i.status === "active").length,
          completed: instances.filter((i) => i.status === "completed").length,
          exited: instances.filter((i) => i.status === "exited").length,
          stopped: instances.filter((i) => i.status === "stopped").length,
        };

        const transitionMetrics: JourneyTransitionReportMetric[] = transitions.map((tr) => {
          const matchingRuns = transitionRuns.filter((r) => r.transitionId === tr.id);
          const fromState = states.find((s) => s.id === tr.from);
          const toState = states.find((s) => s.id === tr.to);
          const successCount = matchingRuns.filter((r) => r.result === "success").length;
          const failedCount = matchingRuns.filter((r) => r.result !== "success").length;

          return {
            id: tr.id,
            from: tr.from,
            fromName: fromState?.name ?? tr.from,
            to: tr.to,
            toName: toState?.name ?? tr.to,
            triggerKind: normalizeTriggerKind(tr.trigger),
            count: matchingRuns.length,
            successCount,
            failedCount,
          };
        });

        const stateMetrics: JourneyStateReportMetric[] = states.map((st) => {
          const currentInState = instances.filter(
            (i) => i.currentStateId === st.id && i.status === "active",
          );

          const enteredInstanceIds = new Set<string>();
          for (const inst of instances) {
            if (inst.currentStateId === st.id) {
              enteredInstanceIds.add(inst.id);
            }
          }
          for (const run of transitionRuns) {
            const trDef = transitions.find((t) => t.id === run.transitionId);
            if (trDef?.to === st.id) {
              enteredInstanceIds.add(run.instanceId);
            }
          }
          if (st.isStart) {
            for (const inst of instances) {
              enteredInstanceIds.add(inst.id);
            }
          }

          const durationsMs: number[] = [];

          for (const run of transitionRuns) {
            const trDef = transitions.find((t) => t.id === run.transitionId);
            if (trDef?.from === st.id) {
              const inst = instances.find((i) => i.id === run.instanceId);
              if (inst) {
                const prevRuns = transitionRuns
                  .filter(
                    (r) =>
                      r.instanceId === inst.id && r.executedAt.getTime() < run.executedAt.getTime(),
                  )
                  .sort((a, b) => b.executedAt.getTime() - a.executedAt.getTime());

                const entryRun = prevRuns.find((r) => {
                  const def = transitions.find((t) => t.id === r.transitionId);
                  return def?.to === st.id;
                });

                const enteredAtTime = entryRun
                  ? entryRun.executedAt.getTime()
                  : inst.createdAt.getTime();
                const duration = Math.max(0, run.executedAt.getTime() - enteredAtTime);
                durationsMs.push(duration);
              }
            }
          }

          for (const inst of currentInState) {
            const duration = Math.max(0, Date.now() - inst.stateEnteredAt.getTime());
            durationsMs.push(duration);
          }

          const avgMs =
            durationsMs.length > 0
              ? Math.round(durationsMs.reduce((a, b) => a + b, 0) / durationsMs.length)
              : 0;

          return {
            id: st.id,
            name: st.name,
            isStart: Boolean(st.isStart),
            currentCount: currentInState.length,
            totalEntered: enteredInstanceIds.size,
            averageTimeInStateMs: avgMs,
            averageTimeInStateFormatted: formatDuration(avgMs),
          };
        });

        return {
          journey: {
            id: journeyRow.id,
            name: journeyRow.name,
            module: journeyRow.module as JourneyModule,
            status: journeyRow.status as JourneyStatus,
            description: journeyRow.description,
          },
          summary,
          states: stateMetrics,
          transitions: transitionMetrics,
        };
      });
    },

    async listRecordInstances(
      ctx: OrgContext,
      recordModule: JourneyModule,
      recordId: string,
    ): Promise<RecordJourneyInstanceItem[]> {
      if (!JOURNEY_MODULES.includes(recordModule)) {
        throw new NotFoundError("Module does not support journeys");
      }

      return withOrg(ctx, async (tx) => {
        const rows = await tx
          .select({
            id: schema.journeyInstances.id,
            journeyId: schema.journeyInstances.journeyId,
            journeyName: schema.journeys.name,
            versionId: schema.journeyInstances.versionId,
            recordModule: schema.journeyInstances.recordModule,
            recordId: schema.journeyInstances.recordId,
            currentStateId: schema.journeyInstances.currentStateId,
            stateEnteredAt: schema.journeyInstances.stateEnteredAt,
            deadlineAt: schema.journeyInstances.deadlineAt,
            status: schema.journeyInstances.status,
            generation: schema.journeyInstances.generation,
            createdAt: schema.journeyInstances.createdAt,
          })
          .from(schema.journeyInstances)
          .innerJoin(
            schema.journeys,
            and(
              eq(schema.journeys.organizationId, schema.journeyInstances.organizationId),
              eq(schema.journeys.id, schema.journeyInstances.journeyId),
            ),
          )
          .where(
            and(
              eq(schema.journeyInstances.organizationId, ctx.orgId),
              eq(schema.journeyInstances.recordModule, recordModule),
              eq(schema.journeyInstances.recordId, recordId),
            ),
          )
          .orderBy(desc(schema.journeyInstances.stateEnteredAt));

        if (rows.length === 0) return [];

        const versionIds = Array.from(new Set(rows.map((r) => r.versionId)));
        const versionRows = await tx
          .select({
            id: schema.journeyVersions.id,
            states: schema.journeyVersions.states,
          })
          .from(schema.journeyVersions)
          .where(
            and(
              eq(schema.journeyVersions.organizationId, ctx.orgId),
              sql`${schema.journeyVersions.id} in (${sql.join(
                versionIds.map((id) => sql`${id}`),
                sql`, `,
              )})`,
            ),
          );

        const versionStateMap = new Map<string, JourneyState[]>();
        for (const v of versionRows) {
          versionStateMap.set(v.id, (v.states as JourneyState[]) ?? []);
        }

        return rows.map((r) => {
          const vStates = versionStateMap.get(r.versionId) ?? [];
          const matchedState = vStates.find((s) => s.id === r.currentStateId);
          return {
            id: r.id,
            journeyId: r.journeyId,
            journeyName: r.journeyName,
            recordModule: r.recordModule as JourneyModule,
            recordId: r.recordId,
            currentStateId: r.currentStateId,
            currentStateName: matchedState?.name ?? r.currentStateId,
            stateEnteredAt: r.stateEnteredAt.toISOString(),
            deadlineAt: r.deadlineAt?.toISOString() ?? null,
            status: r.status as JourneyInstanceStatus,
            generation: r.generation,
            createdAt: r.createdAt.toISOString(),
          };
        });
      });
    },

    async enterActiveJourneys(
      ctx: OrgContext,
      input: { module: string; recordId: string; record: RecordData },
    ): Promise<string[]> {
      const activeJourneys = await getActiveJourneysForModule(ctx, input.module);
      if (activeJourneys.length === 0) return [];

      const recordCreatedTransitions: { instanceId: string; transitionId: string }[] = [];

      const instanceIds = await withOrg(ctx, async (tx) => {
        const instanceIds: string[] = [];

        for (const journey of activeJourneys) {
          if (!journey.activeVersionId) continue;

          // Check partial unique index: only 1 active instance per (journey, module, recordId)
          const [existingActive] = await tx
            .select({ id: schema.journeyInstances.id })
            .from(schema.journeyInstances)
            .where(
              and(
                eq(schema.journeyInstances.organizationId, ctx.orgId),
                eq(schema.journeyInstances.journeyId, journey.id),
                eq(schema.journeyInstances.recordModule, input.module),
                eq(schema.journeyInstances.recordId, input.recordId),
                eq(schema.journeyInstances.status, "active"),
              ),
            );

          if (existingActive) continue;

          // Load active version
          const [version] = await tx
            .select()
            .from(schema.journeyVersions)
            .where(
              and(
                eq(schema.journeyVersions.organizationId, ctx.orgId),
                eq(schema.journeyVersions.id, journey.activeVersionId),
              ),
            );

          if (!version) continue;

          const states = (version.states as JourneyState[]) ?? [];
          const transitions = (version.transitions as JourneyTransition[]) ?? [];
          const startState = states.find((s) => s.isStart) ?? states[0];
          if (!startState) continue;

          const now = new Date();
          const deadlineAt = startState.deadline
            ? computeDueAt(now, startState.deadline, resolvedDeps?.timeZone ?? "UTC")
            : null;

          const [newInstance] = await tx
            .insert(schema.journeyInstances)
            .values({
              organizationId: ctx.orgId,
              journeyId: journey.id,
              versionId: version.id,
              recordModule: input.module,
              recordId: input.recordId,
              currentStateId: startState.id,
              stateEnteredAt: now,
              deadlineAt,
              status: "active",
              generation: 1,
            })
            .returning();

          if (!newInstance) continue;
          instanceIds.push(newInstance.id);

          // Schedule deadline if any
          if (deadlineAt) {
            await tx
              .insert(schema.journeyDueActions)
              .values({
                organizationId: ctx.orgId,
                instanceId: newInstance.id,
                stateId: startState.id,
                actionId: "__deadline__",
                dueAt: deadlineAt,
                generation: 1,
              })
              .onConflictDoNothing();
          }

          const ownerId =
            input.record && typeof input.record.fields.Owner === "string"
              ? input.record.fields.Owner
              : ctx.userId;

          // Schedule start state actions
          const startActions = startState.actions ?? [];
          for (const action of startActions) {
            const isImmediate =
              action.timing === "immediate" ||
              (typeof action.timing === "object" && action.timing.type === "immediate");

            const dueAt = isImmediate
              ? now
              : computeDueAt(now, action.timing, resolvedDeps?.timeZone ?? "UTC");

            const [dueRow] = await tx
              .insert(schema.journeyDueActions)
              .values({
                organizationId: ctx.orgId,
                instanceId: newInstance.id,
                stateId: startState.id,
                actionId: action.id,
                dueAt,
                generation: 1,
              })
              .onConflictDoNothing()
              .returning();

            if (isImmediate && dueRow) {
              const effectResult = await executeActionEffect(
                tx,
                ctx,
                newInstance,
                action,
                input.record,
                ownerId,
                resolvedDeps,
              );
              await tx
                .update(schema.journeyDueActions)
                .set({
                  outcome: effectResult.outcome,
                  outcomeReason: effectResult.outcomeReason ?? null,
                  executedAt: new Date(),
                })
                .where(
                  and(
                    eq(schema.journeyDueActions.organizationId, ctx.orgId),
                    eq(schema.journeyDueActions.id, dueRow.id),
                  ),
                );
            }
          }

          // Check if any transition from startState is triggered by record_created
          const recordCreatedTransition = transitions.find(
            (t) => t.from === startState.id && normalizeTriggerKind(t.trigger) === "record_created",
          );
          if (recordCreatedTransition) {
            recordCreatedTransitions.push({
              instanceId: newInstance.id,
              transitionId: recordCreatedTransition.id,
            });
          }
        }

        return instanceIds;
      });

      // Execute record_created transitions outside tx to avoid deadlock
      for (const t of recordCreatedTransitions) {
        await executeJourneyTransition(ctx, {
          instanceId: t.instanceId,
          transitionId: t.transitionId,
          eventId: `create_${t.instanceId}`,
          generation: 1,
          deps: resolvedDeps,
          record: input.record,
        });
      }

      return instanceIds;
    },

    async handleRecordEvent(ctx: OrgContext, event: RecordWriteEvent): Promise<void> {
      if (event.kind === "create") {
        await this.enterActiveJourneys(ctx, {
          module: event.module,
          recordId: event.record.id,
          record: event.record,
        });
      } else if (event.kind === "edit") {
        const activeJourneys = await getActiveJourneysForModule(ctx, event.module);
        if (activeJourneys.length === 0) return;

        const activeInstances = await withOrg(ctx, async (tx) => {
          return tx
            .select()
            .from(schema.journeyInstances)
            .where(
              and(
                eq(schema.journeyInstances.organizationId, ctx.orgId),
                eq(schema.journeyInstances.recordModule, event.module),
                eq(schema.journeyInstances.recordId, event.record.id),
                eq(schema.journeyInstances.status, "active"),
              ),
            );
        });

        for (const inst of activeInstances) {
          const version = await withOrg(ctx, async (tx) => {
            const [v] = await tx
              .select()
              .from(schema.journeyVersions)
              .where(
                and(
                  eq(schema.journeyVersions.organizationId, ctx.orgId),
                  eq(schema.journeyVersions.id, inst.versionId),
                ),
              );
            return v;
          });

          if (!version) continue;
          const transitions = (version.transitions as JourneyTransition[]) ?? [];
          const matchingTransitions = transitions.filter(
            (t) =>
              t.from === inst.currentStateId &&
              normalizeTriggerKind(t.trigger) === "record_updated",
          );

          for (const t of matchingTransitions) {
            const eventId = `update_${inst.id}_${Date.now()}_${randomUUID().slice(0, 8)}`;
            const res = await executeJourneyTransition(ctx, {
              instanceId: inst.id,
              transitionId: t.id,
              eventId,
              generation: inst.generation,
              deps: resolvedDeps,
              record: event.record,
            });
            if (res.status === "completed") {
              break;
            }
          }
        }
      }
    },

    async handleRecordDelete(
      ctx: OrgContext,
      event: { module: string; ids: readonly string[] },
    ): Promise<void> {
      if (!event.ids || event.ids.length === 0) return;
      const activeJourneys = await getActiveJourneysForModule(ctx, event.module);
      if (activeJourneys.length === 0) return;

      await withOrg(ctx, async (tx) => {
        await tx
          .update(schema.journeyInstances)
          .set({
            status: "stopped",
            generation: sql`${schema.journeyInstances.generation} + 1`,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(schema.journeyInstances.organizationId, ctx.orgId),
              eq(schema.journeyInstances.recordModule, event.module),
              inArray(schema.journeyInstances.recordId, [...event.ids]),
              eq(schema.journeyInstances.status, "active"),
            ),
          );
      });
    },

    async handleWebformSubmitted(
      ctx: OrgContext,
      input: { formId: string; recordModule: string; recordId: string; record: RecordData },
    ): Promise<void> {
      const activeJourneys = await getActiveJourneysForModule(ctx, input.recordModule);
      if (activeJourneys.length === 0) return;

      const activeInstances = await withOrg(ctx, async (tx) => {
        return tx
          .select()
          .from(schema.journeyInstances)
          .where(
            and(
              eq(schema.journeyInstances.organizationId, ctx.orgId),
              eq(schema.journeyInstances.recordModule, input.recordModule),
              eq(schema.journeyInstances.recordId, input.recordId),
              eq(schema.journeyInstances.status, "active"),
            ),
          );
      });

      for (const inst of activeInstances) {
        const version = await withOrg(ctx, async (tx) => {
          const [v] = await tx
            .select()
            .from(schema.journeyVersions)
            .where(
              and(
                eq(schema.journeyVersions.organizationId, ctx.orgId),
                eq(schema.journeyVersions.id, inst.versionId),
              ),
            );
          return v;
        });

        if (!version) continue;
        const transitions = (version.transitions as JourneyTransition[]) ?? [];
        const matchingTransitions = transitions.filter((t) => {
          if (t.from !== inst.currentStateId) return false;
          const kind = normalizeTriggerKind(t.trigger);
          if (kind !== "webform_submitted") return false;
          if (
            typeof t.trigger === "object" &&
            t.trigger !== null &&
            "formId" in t.trigger &&
            (t.trigger as { formId?: string }).formId
          ) {
            return (t.trigger as { formId?: string }).formId === input.formId;
          }
          return true;
        });

        for (const t of matchingTransitions) {
          const eventId = `webform_${input.formId}_${inst.id}_${Date.now()}`;
          const res = await executeJourneyTransition(ctx, {
            instanceId: inst.id,
            transitionId: t.id,
            eventId,
            generation: inst.generation,
            deps: resolvedDeps,
            record: input.record,
          });
          if (res.status === "completed") {
            break;
          }
        }
      }
    },

    writeObserver(ctx: OrgContext): RecordWriteObserver {
      return {
        assertEditable: async () => {},
        afterWrite: async (event: RecordWriteEvent) => {
          await this.handleRecordEvent(ctx, event);
        },
        afterDelete: async (event: { module: string; ids: readonly string[] }) => {
          await this.handleRecordDelete(ctx, event);
        },
      };
    },
  };
}

export type JourneysService = ReturnType<typeof createJourneysService>;
