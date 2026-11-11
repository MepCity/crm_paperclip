import { schema } from "@crm/db";
import { and, count, desc, eq, ilike, sql } from "drizzle-orm";
import { ConflictError, NotFoundError, ValidationError } from "../errors";
import { withOrg } from "../tenancy";
import type { OrgContext } from "../tenancy/types";
import type {
  CreateJourneyInput,
  JourneyDetail,
  JourneyModule,
  JourneyState,
  JourneyStatus,
  JourneySummary,
  JourneyTransition,
  JourneyVersionState,
  JourneyVersionSummary,
  UpdateJourneyDraftInput,
} from "./types";
import {
  validateCreateJourney,
  validateJourneyForPublish,
  validateUpdateJourneyDraft,
} from "./validation";

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

export function createJourneysService() {
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
      });
    },
  };
}

export type JourneysService = ReturnType<typeof createJourneysService>;
