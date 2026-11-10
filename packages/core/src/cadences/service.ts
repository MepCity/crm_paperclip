import { schema } from "@crm/db";
import { and, count, desc, eq, ilike, inArray, ne, sql } from "drizzle-orm";
import { ConflictError, NotFoundError, ValidationError } from "../errors";
import { withOrg } from "../tenancy";
import type { OrgContext } from "../tenancy/types";
import type {
  Cadence,
  CadenceAudience,
  CadenceDetail,
  CadenceExitRule,
  CadenceFilters,
  CadenceModule,
  CadenceStep,
  CadenceSummary,
  CadenceVersion,
  CreateCadenceInput,
  UpdateCadenceDraftInput,
} from "./types";
import {
  validateCreateCadence,
  validateStepsForPublish,
  validateUpdateCadenceDraft,
} from "./validation";

type Tx = Parameters<Parameters<typeof withOrg>[1]>[0];

function mapVersion(row: typeof schema.cadenceVersions.$inferSelect): CadenceVersion {
  return {
    id: row.id,
    organizationId: row.organizationId,
    cadenceId: row.cadenceId,
    number: row.number,
    state: row.state as CadenceVersion["state"],
    audience: (row.audience as CadenceAudience) ?? { kind: "manual" },
    steps: (row.steps as CadenceStep[]) ?? [],
    exitRules: (row.exitRules as CadenceExitRule[]) ?? [],
    publishedAt: row.publishedAt?.toISOString() ?? null,
    publishedBy: row.publishedBy,
    createdAt: row.createdAt.toISOString(),
  };
}

function mapCadence(row: typeof schema.cadences.$inferSelect): Cadence {
  return {
    id: row.id,
    organizationId: row.organizationId,
    name: row.name,
    module: row.module as CadenceModule,
    description: row.description,
    status: row.status as Cadence["status"],
    draftVersionId: row.draftVersionId,
    publishedVersionId: row.publishedVersionId,
    createdAt: row.createdAt.toISOString(),
    createdBy: row.createdBy,
    updatedAt: row.updatedAt.toISOString(),
    updatedBy: row.updatedBy,
  };
}

async function getCadenceInternal(
  tx: Tx,
  orgId: string,
  cadenceId: string,
): Promise<CadenceDetail> {
  const [cadenceRow] = await tx
    .select()
    .from(schema.cadences)
    .where(and(eq(schema.cadences.organizationId, orgId), eq(schema.cadences.id, cadenceId)));
  if (!cadenceRow) throw new NotFoundError("Cadence not found");

  const versionRows = await tx
    .select()
    .from(schema.cadenceVersions)
    .where(
      and(
        eq(schema.cadenceVersions.organizationId, orgId),
        eq(schema.cadenceVersions.cadenceId, cadenceId),
      ),
    )
    .orderBy(desc(schema.cadenceVersions.number));

  const versions = versionRows.map(mapVersion);

  const draftVersion = cadenceRow.draftVersionId
    ? (versions.find((v) => v.id === cadenceRow.draftVersionId) ?? null)
    : null;
  const publishedVersion = cadenceRow.publishedVersionId
    ? (versions.find((v) => v.id === cadenceRow.publishedVersionId) ?? null)
    : null;

  const currentVersion = draftVersion ?? publishedVersion ?? versions[0];
  if (!currentVersion) {
    throw new NotFoundError("No versions found for cadence");
  }

  const [enrollmentCount] = await tx
    .select({ count: count(schema.cadenceEnrollments.id) })
    .from(schema.cadenceEnrollments)
    .where(
      and(
        eq(schema.cadenceEnrollments.organizationId, orgId),
        eq(schema.cadenceEnrollments.cadenceId, cadenceId),
      ),
    );

  return {
    ...mapCadence(cadenceRow),
    draftVersion,
    publishedVersion,
    currentVersion,
    recordCount: Number(enrollmentCount?.count ?? 0),
  };
}

export function createCadenceService() {
  return {
    async listCadences(ctx: OrgContext, filters?: CadenceFilters): Promise<CadenceSummary[]> {
      return withOrg(ctx, async (tx) => {
        const conditions = [eq(schema.cadences.organizationId, ctx.orgId)];

        if (filters?.search?.trim()) {
          conditions.push(ilike(schema.cadences.name, `%${filters.search.trim()}%`));
        }
        if (filters?.module && filters.module !== "all") {
          conditions.push(eq(schema.cadences.module, filters.module));
        }
        if (filters?.status && filters.status !== "all") {
          conditions.push(eq(schema.cadences.status, filters.status));
        }

        const cadences = await tx
          .select()
          .from(schema.cadences)
          .where(and(...conditions))
          .orderBy(desc(schema.cadences.createdAt));

        if (cadences.length === 0) return [];

        const cadenceIds = cadences.map((c) => c.id);

        const versionIds = cadences
          .map((c) => c.publishedVersionId ?? c.draftVersionId)
          .filter((id): id is string => Boolean(id));

        const versions =
          versionIds.length > 0
            ? await tx
                .select({
                  id: schema.cadenceVersions.id,
                  cadenceId: schema.cadenceVersions.cadenceId,
                  audience: schema.cadenceVersions.audience,
                })
                .from(schema.cadenceVersions)
                .where(
                  and(
                    eq(schema.cadenceVersions.organizationId, ctx.orgId),
                    inArray(schema.cadenceVersions.id, versionIds),
                  ),
                )
            : [];

        const versionMap = new Map(versions.map((v) => [v.id, v.audience as CadenceAudience]));

        const counts = await tx
          .select({
            cadenceId: schema.cadenceEnrollments.cadenceId,
            count: count(schema.cadenceEnrollments.id),
          })
          .from(schema.cadenceEnrollments)
          .where(
            and(
              eq(schema.cadenceEnrollments.organizationId, ctx.orgId),
              inArray(schema.cadenceEnrollments.cadenceId, cadenceIds),
            ),
          )
          .groupBy(schema.cadenceEnrollments.cadenceId);

        const countMap = new Map(counts.map((c) => [c.cadenceId, Number(c.count)]));

        return cadences.map((c) => {
          const targetVersionId = c.publishedVersionId ?? c.draftVersionId;
          const audience = (targetVersionId ? versionMap.get(targetVersionId) : null) ?? {
            kind: "manual",
          };
          return {
            id: c.id,
            name: c.name,
            module: c.module as CadenceModule,
            description: c.description,
            status: c.status as Cadence["status"],
            audience,
            recordCount: countMap.get(c.id) ?? 0,
            draftVersionId: c.draftVersionId,
            publishedVersionId: c.publishedVersionId,
            createdAt: c.createdAt.toISOString(),
            updatedAt: c.updatedAt.toISOString(),
          };
        });
      });
    },

    async getCadence(ctx: OrgContext, cadenceId: string): Promise<CadenceDetail> {
      return withOrg(ctx, async (tx) => {
        return getCadenceInternal(tx, ctx.orgId, cadenceId);
      });
    },

    async createCadence(ctx: OrgContext, rawInput: CreateCadenceInput): Promise<CadenceDetail> {
      const input = validateCreateCadence(rawInput);

      return withOrg(ctx, async (tx) => {
        const [existing] = await tx
          .select({ id: schema.cadences.id })
          .from(schema.cadences)
          .where(
            and(
              eq(schema.cadences.organizationId, ctx.orgId),
              sql`lower(${schema.cadences.name}) = lower(${input.name})`,
            ),
          );
        if (existing) {
          throw new ConflictError("Cadence name must be unique");
        }

        const [createdCadence] = await tx
          .insert(schema.cadences)
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

        if (!createdCadence) throw new Error("Failed to create cadence");

        const [createdVersion] = await tx
          .insert(schema.cadenceVersions)
          .values({
            organizationId: ctx.orgId,
            cadenceId: createdCadence.id,
            number: 1,
            state: "draft",
            audience: input.audience,
            steps: [],
            exitRules: [],
          })
          .returning();

        if (!createdVersion) throw new Error("Failed to create cadence version");

        await tx
          .update(schema.cadences)
          .set({
            draftVersionId: createdVersion.id,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(schema.cadences.organizationId, ctx.orgId),
              eq(schema.cadences.id, createdCadence.id),
            ),
          );

        return getCadenceInternal(tx, ctx.orgId, createdCadence.id);
      });
    },

    async updateCadenceDraft(
      ctx: OrgContext,
      cadenceId: string,
      rawInput: UpdateCadenceDraftInput,
    ): Promise<CadenceDetail> {
      const input = validateUpdateCadenceDraft(rawInput);

      return withOrg(ctx, async (tx) => {
        const [cadence] = await tx
          .select()
          .from(schema.cadences)
          .where(
            and(eq(schema.cadences.organizationId, ctx.orgId), eq(schema.cadences.id, cadenceId)),
          );
        if (!cadence) throw new NotFoundError("Cadence not found");

        if (input.name && input.name.toLowerCase() !== cadence.name.toLowerCase()) {
          const [conflict] = await tx
            .select({ id: schema.cadences.id })
            .from(schema.cadences)
            .where(
              and(
                eq(schema.cadences.organizationId, ctx.orgId),
                ne(schema.cadences.id, cadenceId),
                sql`lower(${schema.cadences.name}) = lower(${input.name})`,
              ),
            );
          if (conflict) {
            throw new ConflictError("Cadence name must be unique");
          }
        }

        let draftVersionId = cadence.draftVersionId;

        if (draftVersionId) {
          const [draft] = await tx
            .select()
            .from(schema.cadenceVersions)
            .where(
              and(
                eq(schema.cadenceVersions.organizationId, ctx.orgId),
                eq(schema.cadenceVersions.id, draftVersionId),
                eq(schema.cadenceVersions.state, "draft"),
              ),
            );
          if (!draft) throw new NotFoundError("Draft version not found");

          const updatedAudience = input.audience ?? (draft.audience as CadenceAudience);
          const updatedSteps = input.steps ?? (draft.steps as CadenceStep[]);
          const updatedExitRules = input.exitRules ?? (draft.exitRules as CadenceExitRule[]);

          await tx
            .update(schema.cadenceVersions)
            .set({
              audience: updatedAudience,
              steps: updatedSteps,
              exitRules: updatedExitRules,
            })
            .where(
              and(
                eq(schema.cadenceVersions.organizationId, ctx.orgId),
                eq(schema.cadenceVersions.id, draftVersionId),
                eq(schema.cadenceVersions.state, "draft"),
              ),
            );
        } else {
          if (!cadence.publishedVersionId) {
            throw new NotFoundError("No version found to create draft from");
          }
          const [published] = await tx
            .select()
            .from(schema.cadenceVersions)
            .where(
              and(
                eq(schema.cadenceVersions.organizationId, ctx.orgId),
                eq(schema.cadenceVersions.id, cadence.publishedVersionId),
              ),
            );
          if (!published) throw new NotFoundError("Published version not found");

          const [newDraft] = await tx
            .insert(schema.cadenceVersions)
            .values({
              organizationId: ctx.orgId,
              cadenceId,
              number: published.number + 1,
              state: "draft",
              audience: input.audience ?? published.audience,
              steps: input.steps ?? published.steps,
              exitRules: input.exitRules ?? published.exitRules,
            })
            .returning();

          if (!newDraft) throw new Error("Failed to create draft version");
          draftVersionId = newDraft.id;
        }

        await tx
          .update(schema.cadences)
          .set({
            name: input.name ?? cadence.name,
            description: input.description !== undefined ? input.description : cadence.description,
            draftVersionId,
            updatedAt: new Date(),
            updatedBy: ctx.userId,
          })
          .where(
            and(eq(schema.cadences.organizationId, ctx.orgId), eq(schema.cadences.id, cadenceId)),
          );

        return getCadenceInternal(tx, ctx.orgId, cadenceId);
      });
    },

    async publishCadence(ctx: OrgContext, cadenceId: string): Promise<CadenceDetail> {
      return withOrg(ctx, async (tx) => {
        const [cadence] = await tx
          .select()
          .from(schema.cadences)
          .where(
            and(eq(schema.cadences.organizationId, ctx.orgId), eq(schema.cadences.id, cadenceId)),
          );
        if (!cadence) throw new NotFoundError("Cadence not found");

        if (!cadence.draftVersionId) {
          if (cadence.publishedVersionId) {
            return getCadenceInternal(tx, ctx.orgId, cadenceId);
          }
          throw new ValidationError({ cadence: ["No draft version to publish"] });
        }

        const [draft] = await tx
          .select()
          .from(schema.cadenceVersions)
          .where(
            and(
              eq(schema.cadenceVersions.organizationId, ctx.orgId),
              eq(schema.cadenceVersions.id, cadence.draftVersionId),
              eq(schema.cadenceVersions.state, "draft"),
            ),
          );
        if (!draft) throw new NotFoundError("Draft version not found");

        validateStepsForPublish(draft.steps as CadenceStep[]);

        if (cadence.publishedVersionId) {
          await tx
            .update(schema.cadenceVersions)
            .set({
              state: "superseded",
            })
            .where(
              and(
                eq(schema.cadenceVersions.organizationId, ctx.orgId),
                eq(schema.cadenceVersions.id, cadence.publishedVersionId),
                eq(schema.cadenceVersions.state, "published"),
              ),
            );
        }

        await tx
          .update(schema.cadenceVersions)
          .set({
            state: "published",
            publishedAt: new Date(),
            publishedBy: ctx.userId,
          })
          .where(
            and(
              eq(schema.cadenceVersions.organizationId, ctx.orgId),
              eq(schema.cadenceVersions.id, draft.id),
              eq(schema.cadenceVersions.state, "draft"),
            ),
          );

        await tx
          .update(schema.cadences)
          .set({
            status: "active",
            publishedVersionId: draft.id,
            draftVersionId: null,
            updatedAt: new Date(),
            updatedBy: ctx.userId,
          })
          .where(
            and(eq(schema.cadences.organizationId, ctx.orgId), eq(schema.cadences.id, cadenceId)),
          );

        return getCadenceInternal(tx, ctx.orgId, cadenceId);
      });
    },

    async activateCadence(ctx: OrgContext, cadenceId: string): Promise<CadenceDetail> {
      return withOrg(ctx, async (tx) => {
        const [cadence] = await tx
          .select()
          .from(schema.cadences)
          .where(
            and(eq(schema.cadences.organizationId, ctx.orgId), eq(schema.cadences.id, cadenceId)),
          );
        if (!cadence) throw new NotFoundError("Cadence not found");

        if (!cadence.publishedVersionId) {
          throw new ValidationError({
            status: ["Cannot activate a cadence that has never been published"],
          });
        }

        await tx
          .update(schema.cadences)
          .set({
            status: "active",
            updatedAt: new Date(),
            updatedBy: ctx.userId,
          })
          .where(
            and(eq(schema.cadences.organizationId, ctx.orgId), eq(schema.cadences.id, cadenceId)),
          );

        return getCadenceInternal(tx, ctx.orgId, cadenceId);
      });
    },

    async deactivateCadence(ctx: OrgContext, cadenceId: string): Promise<CadenceDetail> {
      return withOrg(ctx, async (tx) => {
        const [cadence] = await tx
          .select()
          .from(schema.cadences)
          .where(
            and(eq(schema.cadences.organizationId, ctx.orgId), eq(schema.cadences.id, cadenceId)),
          );
        if (!cadence) throw new NotFoundError("Cadence not found");

        await tx
          .update(schema.cadences)
          .set({
            status: "inactive",
            updatedAt: new Date(),
            updatedBy: ctx.userId,
          })
          .where(
            and(eq(schema.cadences.organizationId, ctx.orgId), eq(schema.cadences.id, cadenceId)),
          );

        return getCadenceInternal(tx, ctx.orgId, cadenceId);
      });
    },

    async deleteCadence(ctx: OrgContext, cadenceId: string): Promise<void> {
      return withOrg(ctx, async (tx) => {
        const [cadence] = await tx
          .select({ id: schema.cadences.id })
          .from(schema.cadences)
          .where(
            and(eq(schema.cadences.organizationId, ctx.orgId), eq(schema.cadences.id, cadenceId)),
          );
        if (!cadence) throw new NotFoundError("Cadence not found");

        await tx
          .delete(schema.cadences)
          .where(
            and(eq(schema.cadences.organizationId, ctx.orgId), eq(schema.cadences.id, cadenceId)),
          );
      });
    },

    publish(ctx: OrgContext, cadenceId: string) {
      return this.publishCadence(ctx, cadenceId);
    },

    activate(ctx: OrgContext, cadenceId: string) {
      return this.activateCadence(ctx, cadenceId);
    },

    deactivate(ctx: OrgContext, cadenceId: string) {
      return this.deactivateCadence(ctx, cadenceId);
    },

    delete(ctx: OrgContext, cadenceId: string) {
      return this.deleteCadence(ctx, cadenceId);
    },
  };
}

export type CadenceService = ReturnType<typeof createCadenceService>;
