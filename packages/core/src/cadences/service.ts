import { schema } from "@crm/db";
import { and, count, desc, eq, gte, ilike, inArray, lte, ne, sql } from "drizzle-orm";
import type { AccessSnapshot } from "../access/types";
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from "../errors";
import type { RecordService } from "../records";
import { assertRecordEditable } from "../records/record-guard";
import { withOrg } from "../tenancy";
import type { OrgContext } from "../tenancy/types";
import { computeDueAt } from "./delays";
import {
  type Cadence,
  type CadenceAudience,
  type CadenceDetail,
  type CadenceEnrollment,
  type CadenceEnrollmentState,
  type CadenceExitRule,
  type CadenceFilters,
  type CadenceModule,
  type CadenceReportData,
  type CadenceReportSummary,
  type CadenceStatus,
  type CadenceStep,
  type CadenceStepMetric,
  type CadenceStepRun,
  type CadenceSummary,
  type CadenceVersion,
  type CreateCadenceInput,
  type EnrollRecordInput,
  type EnrollRecordsInput,
  enrollRecordSchema,
  enrollRecordsSchema,
  type RecordCadenceEnrollmentItem,
  type UpdateCadenceDraftInput,
} from "./types";
import {
  validateCreateCadence,
  validateStepsForPublish,
  validateUpdateCadenceDraft,
} from "./validation";

type Tx = Parameters<Parameters<typeof withOrg>[1]>[0];

function escapeLike(text: string): string {
  return text.replace(/[%_\\]/g, "\\$&");
}

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

function mapEnrollment(row: typeof schema.cadenceEnrollments.$inferSelect): CadenceEnrollment {
  return {
    id: row.id,
    organizationId: row.organizationId,
    cadenceId: row.cadenceId,
    versionId: row.versionId,
    recordModule: row.recordModule as CadenceModule,
    recordId: row.recordId,
    enrolledBy: row.enrolledBy,
    state: row.state as CadenceEnrollment["state"],
    reason: row.reason,
    generation: row.generation,
    nextStepId: row.nextStepId,
    nextDueAt: row.nextDueAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function mapStepRun(row: typeof schema.cadenceStepRuns.$inferSelect): CadenceStepRun {
  return {
    id: row.id,
    organizationId: row.organizationId,
    enrollmentId: row.enrollmentId,
    stepId: row.stepId,
    generation: row.generation,
    outcome: row.outcome as CadenceStepRun["outcome"],
    outcomeReason: row.outcomeReason,
    executedAt: row.executedAt.toISOString(),
  };
}

/** Caller access for enrollment actions; absent = system actor (workers, tests). */
export interface EnrollmentActionAccess {
  accessSnapshot: AccessSnapshot;
  recordService: RecordService;
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
          // Escape %, _, and \ for LIKE search (CTO item 1)
          conditions.push(ilike(schema.cadences.name, `%${escapeLike(filters.search.trim())}%`));
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
          // Check if scheduled steps changed between old published version and new draft
          const [oldPublished] = await tx
            .select({ steps: schema.cadenceVersions.steps })
            .from(schema.cadenceVersions)
            .where(
              and(
                eq(schema.cadenceVersions.organizationId, ctx.orgId),
                eq(schema.cadenceVersions.id, cadence.publishedVersionId),
              ),
            );

          const oldStepsJson = JSON.stringify(oldPublished?.steps ?? []);
          const newStepsJson = JSON.stringify(draft.steps ?? []);

          if (oldStepsJson !== newStepsJson) {
            // Republish that changes scheduled steps stops affected enrollments (ADR 0019 §6, scope 3)
            await tx
              .update(schema.cadenceEnrollments)
              .set({
                state: "stopped",
                reason: "republished_steps_changed",
                generation: sql`${schema.cadenceEnrollments.generation} + 1`,
                nextStepId: null,
                nextDueAt: null,
                updatedAt: new Date(),
              })
              .where(
                and(
                  eq(schema.cadenceEnrollments.organizationId, ctx.orgId),
                  eq(schema.cadenceEnrollments.cadenceId, cadenceId),
                  inArray(schema.cadenceEnrollments.state, ["active", "paused"]),
                ),
              );
          }

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

        // Deactivate cadence stops scheduled actions; bump generation in transaction (ADR 0019 §6)
        await tx
          .update(schema.cadenceEnrollments)
          .set({
            generation: sql`${schema.cadenceEnrollments.generation} + 1`,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(schema.cadenceEnrollments.organizationId, ctx.orgId),
              eq(schema.cadenceEnrollments.cadenceId, cadenceId),
              inArray(schema.cadenceEnrollments.state, ["active", "paused"]),
            ),
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

        // CTO note 2: deleteCadence enrollment varken cascade siliyor -> enrollment varsa engelle
        const [hasEnrollment] = await tx
          .select({ id: schema.cadenceEnrollments.id })
          .from(schema.cadenceEnrollments)
          .where(
            and(
              eq(schema.cadenceEnrollments.organizationId, ctx.orgId),
              eq(schema.cadenceEnrollments.cadenceId, cadenceId),
            ),
          )
          .limit(1);

        if (hasEnrollment) {
          throw new ConflictError("Cannot delete cadence with existing enrollments");
        }

        await tx
          .delete(schema.cadences)
          .where(
            and(eq(schema.cadences.organizationId, ctx.orgId), eq(schema.cadences.id, cadenceId)),
          );
      });
    },

    // --- Enrollment & State Change Methods (Scope 1 & 3) ---

    async enrollRecord(
      ctx: OrgContext,
      rawInput: EnrollRecordInput,
      options?: {
        recordService?: RecordService;
        accessSnapshot?: AccessSnapshot;
        timeZone?: string;
      },
    ): Promise<CadenceEnrollment> {
      const input = enrollRecordSchema.parse(rawInput);

      return withOrg(ctx, async (tx) => {
        const [cadence] = await tx
          .select()
          .from(schema.cadences)
          .where(
            and(
              eq(schema.cadences.organizationId, ctx.orgId),
              eq(schema.cadences.id, input.cadenceId),
            ),
          );

        if (!cadence) throw new NotFoundError("Cadence not found");
        if (cadence.status !== "active") {
          throw new ValidationError({ status: ["Cannot enroll in an inactive cadence"] });
        }
        if (cadence.module !== input.recordModule) {
          throw new ValidationError({ module: ["Record module does not match cadence module"] });
        }
        if (!cadence.publishedVersionId) {
          throw new ValidationError({ cadence: ["Cadence has no published version"] });
        }

        // Check permission if access snapshot is provided
        if (options?.accessSnapshot) {
          const enrollAllowed = options.accessSnapshot.permissions.tools.enrollInCadence.includes(
            input.recordModule,
          );
          if (!enrollAllowed) {
            throw new ForbiddenError(
              `User does not have enrollInCadence permission for ${input.recordModule}`,
              "permission_denied",
            );
          }
          if (options.recordService)
            await assertRecordEditable(
              { accessSnapshot: options.accessSnapshot, recordService: options.recordService },
              input.recordModule,
              input.recordId,
            );
        }

        // Unique non-final enrollment check (ADR 0019 §6)
        const [existing] = await tx
          .select({ id: schema.cadenceEnrollments.id })
          .from(schema.cadenceEnrollments)
          .where(
            and(
              eq(schema.cadenceEnrollments.organizationId, ctx.orgId),
              eq(schema.cadenceEnrollments.cadenceId, input.cadenceId),
              eq(schema.cadenceEnrollments.recordModule, input.recordModule),
              eq(schema.cadenceEnrollments.recordId, input.recordId),
              inArray(schema.cadenceEnrollments.state, ["active", "paused"]),
            ),
          );

        if (existing) {
          throw new ConflictError("Record is already actively enrolled in this cadence");
        }

        const [version] = await tx
          .select({ steps: schema.cadenceVersions.steps })
          .from(schema.cadenceVersions)
          .where(
            and(
              eq(schema.cadenceVersions.organizationId, ctx.orgId),
              eq(schema.cadenceVersions.id, cadence.publishedVersionId),
            ),
          );

        const steps = (version?.steps as CadenceStep[]) ?? [];
        const firstStep = steps[0];
        const nextDueAt = firstStep
          ? computeDueAt(new Date(), firstStep.delay, options?.timeZone ?? "UTC")
          : null;

        const [enrollment] = await tx
          .insert(schema.cadenceEnrollments)
          .values({
            organizationId: ctx.orgId,
            cadenceId: input.cadenceId,
            versionId: cadence.publishedVersionId,
            recordModule: input.recordModule,
            recordId: input.recordId,
            enrolledBy: ctx.userId,
            state: firstStep ? "active" : "completed",
            generation: 1,
            nextStepId: firstStep?.id ?? null,
            nextDueAt,
          })
          .returning();

        if (!enrollment) throw new Error("Failed to enroll record");
        return mapEnrollment(enrollment);
      });
    },

    async enrollRecords(
      ctx: OrgContext,
      rawInput: EnrollRecordsInput,
      options?: {
        recordService?: RecordService;
        accessSnapshot?: AccessSnapshot;
        timeZone?: string;
      },
    ): Promise<{ enrolled: CadenceEnrollment[]; skippedCount: number }> {
      const input = enrollRecordsSchema.parse(rawInput);
      const enrolled: CadenceEnrollment[] = [];
      let skippedCount = 0;

      for (const recordId of input.recordIds) {
        try {
          const res = await this.enrollRecord(
            ctx,
            {
              cadenceId: input.cadenceId,
              recordModule: input.recordModule,
              recordId,
            },
            options,
          );
          enrolled.push(res);
        } catch (err) {
          if (err instanceof ConflictError) {
            skippedCount++;
          } else {
            throw err;
          }
        }
      }

      return { enrolled, skippedCount };
    },

    async pauseEnrollment(
      ctx: OrgContext,
      enrollmentId: string,
      access?: EnrollmentActionAccess,
    ): Promise<CadenceEnrollment> {
      return withOrg(ctx, async (tx) => {
        const [enrollment] = await tx
          .select()
          .from(schema.cadenceEnrollments)
          .where(
            and(
              eq(schema.cadenceEnrollments.organizationId, ctx.orgId),
              eq(schema.cadenceEnrollments.id, enrollmentId),
            ),
          )
          .for("update");

        if (!enrollment) throw new NotFoundError("Enrollment not found");
        if (access) {
          await assertRecordEditable(access, enrollment.recordModule, enrollment.recordId);
        }
        if (enrollment.state !== "active") {
          throw new ConflictError("Can only pause active enrollments");
        }

        const [updated] = await tx
          .update(schema.cadenceEnrollments)
          .set({
            state: "paused",
            generation: sql`${schema.cadenceEnrollments.generation} + 1`,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(schema.cadenceEnrollments.organizationId, ctx.orgId),
              eq(schema.cadenceEnrollments.id, enrollmentId),
            ),
          )
          .returning();

        if (!updated) throw new Error("Failed to pause enrollment");
        return mapEnrollment(updated);
      });
    },

    async resumeEnrollment(
      ctx: OrgContext,
      enrollmentId: string,
      access?: EnrollmentActionAccess,
    ): Promise<CadenceEnrollment> {
      return withOrg(ctx, async (tx) => {
        const [enrollment] = await tx
          .select()
          .from(schema.cadenceEnrollments)
          .where(
            and(
              eq(schema.cadenceEnrollments.organizationId, ctx.orgId),
              eq(schema.cadenceEnrollments.id, enrollmentId),
            ),
          )
          .for("update");

        if (!enrollment) throw new NotFoundError("Enrollment not found");
        if (access) {
          await assertRecordEditable(access, enrollment.recordModule, enrollment.recordId);
        }
        if (enrollment.state !== "paused") {
          throw new ConflictError("Can only resume paused enrollments");
        }

        const [updated] = await tx
          .update(schema.cadenceEnrollments)
          .set({
            state: "active",
            generation: sql`${schema.cadenceEnrollments.generation} + 1`,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(schema.cadenceEnrollments.organizationId, ctx.orgId),
              eq(schema.cadenceEnrollments.id, enrollmentId),
            ),
          )
          .returning();

        if (!updated) throw new Error("Failed to resume enrollment");
        return mapEnrollment(updated);
      });
    },

    async unenrollRecord(
      ctx: OrgContext,
      enrollmentId: string,
      reason = "manual_unenroll",
      access?: EnrollmentActionAccess,
    ): Promise<CadenceEnrollment> {
      return withOrg(ctx, async (tx) => {
        const [enrollment] = await tx
          .select()
          .from(schema.cadenceEnrollments)
          .where(
            and(
              eq(schema.cadenceEnrollments.organizationId, ctx.orgId),
              eq(schema.cadenceEnrollments.id, enrollmentId),
            ),
          )
          .for("update");

        if (!enrollment) throw new NotFoundError("Enrollment not found");
        if (access) {
          await assertRecordEditable(access, enrollment.recordModule, enrollment.recordId);
        }

        const [updated] = await tx
          .update(schema.cadenceEnrollments)
          .set({
            state: "exited",
            reason,
            generation: sql`${schema.cadenceEnrollments.generation} + 1`,
            nextStepId: null,
            nextDueAt: null,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(schema.cadenceEnrollments.organizationId, ctx.orgId),
              eq(schema.cadenceEnrollments.id, enrollmentId),
            ),
          )
          .returning();

        if (!updated) throw new Error("Failed to unenroll record");
        return mapEnrollment(updated);
      });
    },

    async getEnrollment(ctx: OrgContext, enrollmentId: string): Promise<CadenceEnrollment> {
      return withOrg(ctx, async (tx) => {
        const [enrollment] = await tx
          .select()
          .from(schema.cadenceEnrollments)
          .where(
            and(
              eq(schema.cadenceEnrollments.organizationId, ctx.orgId),
              eq(schema.cadenceEnrollments.id, enrollmentId),
            ),
          );

        if (!enrollment) throw new NotFoundError("Enrollment not found");
        return mapEnrollment(enrollment);
      });
    },

    async listEnrollments(
      ctx: OrgContext,
      filters?: {
        cadenceId?: string;
        recordModule?: CadenceModule;
        recordId?: string;
        state?: string;
        limit?: number;
        offset?: number;
      },
    ): Promise<CadenceEnrollment[]> {
      return withOrg(ctx, async (tx) => {
        const conditions = [eq(schema.cadenceEnrollments.organizationId, ctx.orgId)];

        if (filters?.cadenceId) {
          conditions.push(eq(schema.cadenceEnrollments.cadenceId, filters.cadenceId));
        }
        if (filters?.recordModule) {
          conditions.push(eq(schema.cadenceEnrollments.recordModule, filters.recordModule));
        }
        if (filters?.recordId) {
          conditions.push(eq(schema.cadenceEnrollments.recordId, filters.recordId));
        }
        if (filters?.state && filters.state !== "all") {
          conditions.push(eq(schema.cadenceEnrollments.state, filters.state));
        }

        const baseQuery = tx
          .select()
          .from(schema.cadenceEnrollments)
          .where(and(...conditions))
          .orderBy(desc(schema.cadenceEnrollments.createdAt));

        const queryWithLimit = filters?.limit ? baseQuery.limit(filters.limit) : baseQuery;
        const finalQuery = filters?.offset ? queryWithLimit.offset(filters.offset) : queryWithLimit;

        const rows = await finalQuery;

        return rows.map(mapEnrollment);
      });
    },

    async listStepRuns(ctx: OrgContext, enrollmentId: string): Promise<CadenceStepRun[]> {
      return withOrg(ctx, async (tx) => {
        const rows = await tx
          .select()
          .from(schema.cadenceStepRuns)
          .where(
            and(
              eq(schema.cadenceStepRuns.organizationId, ctx.orgId),
              eq(schema.cadenceStepRuns.enrollmentId, enrollmentId),
            ),
          )
          .orderBy(desc(schema.cadenceStepRuns.executedAt));

        return rows.map(mapStepRun);
      });
    },

    async listRecordEnrollments(
      ctx: OrgContext,
      recordModule: CadenceModule,
      recordId: string,
    ): Promise<RecordCadenceEnrollmentItem[]> {
      return withOrg(ctx, async (tx) => {
        const rows = await tx
          .select({
            id: schema.cadenceEnrollments.id,
            cadenceId: schema.cadenceEnrollments.cadenceId,
            cadenceName: schema.cadences.name,
            recordModule: schema.cadenceEnrollments.recordModule,
            recordId: schema.cadenceEnrollments.recordId,
            state: schema.cadenceEnrollments.state,
            reason: schema.cadenceEnrollments.reason,
            generation: schema.cadenceEnrollments.generation,
            nextStepId: schema.cadenceEnrollments.nextStepId,
            nextDueAt: schema.cadenceEnrollments.nextDueAt,
            createdAt: schema.cadenceEnrollments.createdAt,
          })
          .from(schema.cadenceEnrollments)
          .innerJoin(
            schema.cadences,
            and(
              eq(schema.cadences.organizationId, schema.cadenceEnrollments.organizationId),
              eq(schema.cadences.id, schema.cadenceEnrollments.cadenceId),
            ),
          )
          .where(
            and(
              eq(schema.cadenceEnrollments.organizationId, ctx.orgId),
              eq(schema.cadenceEnrollments.recordModule, recordModule),
              eq(schema.cadenceEnrollments.recordId, recordId),
            ),
          )
          .orderBy(desc(schema.cadenceEnrollments.createdAt));

        return rows.map((r) => ({
          id: r.id,
          cadenceId: r.cadenceId,
          cadenceName: r.cadenceName,
          recordModule: r.recordModule as CadenceModule,
          recordId: r.recordId,
          recordStartDate: r.createdAt.toISOString(),
          status: r.state as CadenceEnrollmentState,
          reason: r.reason,
          generation: r.generation,
          nextStepId: r.nextStepId,
          nextDueAt: r.nextDueAt ? r.nextDueAt.toISOString() : null,
        }));
      });
    },

    async getCadenceReport(
      ctx: OrgContext,
      cadenceId: string,
      options?: { startDate?: string; endDate?: string },
    ): Promise<CadenceReportData> {
      return withOrg(ctx, async (tx) => {
        const [cadenceRow] = await tx
          .select()
          .from(schema.cadences)
          .where(
            and(eq(schema.cadences.organizationId, ctx.orgId), eq(schema.cadences.id, cadenceId)),
          );

        if (!cadenceRow) throw new NotFoundError("Cadence not found");

        const targetVersionId = cadenceRow.publishedVersionId ?? cadenceRow.draftVersionId;
        let steps: CadenceStep[] = [];
        if (targetVersionId) {
          const [versionRow] = await tx
            .select()
            .from(schema.cadenceVersions)
            .where(
              and(
                eq(schema.cadenceVersions.organizationId, ctx.orgId),
                eq(schema.cadenceVersions.id, targetVersionId),
              ),
            );
          if (versionRow) {
            steps = (versionRow.steps as CadenceStep[]) ?? [];
          }
        }

        const enrollmentConditions = [
          eq(schema.cadenceEnrollments.organizationId, ctx.orgId),
          eq(schema.cadenceEnrollments.cadenceId, cadenceId),
        ];

        if (options?.startDate) {
          const start = new Date(options.startDate);
          if (!Number.isNaN(start.getTime())) {
            enrollmentConditions.push(gte(schema.cadenceEnrollments.createdAt, start));
          }
        }
        if (options?.endDate) {
          const end = new Date(options.endDate);
          if (!Number.isNaN(end.getTime())) {
            const endOfDay = new Date(end);
            endOfDay.setUTCHours(23, 59, 59, 999);
            enrollmentConditions.push(lte(schema.cadenceEnrollments.createdAt, endOfDay));
          }
        }

        const enrollments = await tx
          .select()
          .from(schema.cadenceEnrollments)
          .where(and(...enrollmentConditions));

        const summary: CadenceReportSummary = {
          enrolled: enrollments.length,
          active: 0,
          completed: 0,
          exited: 0,
          stopped: 0,
          paused: 0,
        };

        const enrollmentIds: string[] = [];
        const enrollmentsById = new Map<string, (typeof enrollments)[number]>();

        for (const e of enrollments) {
          enrollmentIds.push(e.id);
          enrollmentsById.set(e.id, e);
          if (e.state === "active") summary.active++;
          else if (e.state === "completed") summary.completed++;
          else if (e.state === "exited") summary.exited++;
          else if (e.state === "stopped") summary.stopped++;
          else if (e.state === "paused") summary.paused++;
        }

        let stepRuns: Array<typeof schema.cadenceStepRuns.$inferSelect> = [];
        if (enrollmentIds.length > 0) {
          const stepRunConditions = [
            eq(schema.cadenceStepRuns.organizationId, ctx.orgId),
            inArray(schema.cadenceStepRuns.enrollmentId, enrollmentIds),
          ];
          if (options?.startDate) {
            const start = new Date(options.startDate);
            if (!Number.isNaN(start.getTime())) {
              stepRunConditions.push(gte(schema.cadenceStepRuns.executedAt, start));
            }
          }
          if (options?.endDate) {
            const end = new Date(options.endDate);
            if (!Number.isNaN(end.getTime())) {
              const endOfDay = new Date(end);
              endOfDay.setUTCHours(23, 59, 59, 999);
              stepRunConditions.push(lte(schema.cadenceStepRuns.executedAt, endOfDay));
            }
          }

          stepRuns = await tx
            .select()
            .from(schema.cadenceStepRuns)
            .where(and(...stepRunConditions));
        }

        const runsByStep = new Map<string, typeof stepRuns>();
        for (const run of stepRuns) {
          const list = runsByStep.get(run.stepId) ?? [];
          list.push(run);
          runsByStep.set(run.stepId, list);
        }

        const stepMetrics: CadenceStepMetric[] = [];
        let previousCompletedCount = summary.enrolled;

        for (let i = 0; i < steps.length; i++) {
          const step = steps[i];
          if (!step) continue;
          const runs = runsByStep.get(step.id) ?? [];

          let executed = 0;
          let skipped = 0;
          let failed = 0;
          const skippedReasons: Record<string, number> = {};

          for (const r of runs) {
            if (r.outcome === "completed") {
              executed++;
            } else if (r.outcome === "skipped") {
              skipped++;
              const reason = r.outcomeReason ?? "unknown";
              skippedReasons[reason] = (skippedReasons[reason] ?? 0) + 1;
            } else if (r.outcome === "failed") {
              failed++;
            }
          }

          const enteredCount = i === 0 ? summary.enrolled : previousCompletedCount;
          const completedCount = executed;
          const conversionRate =
            enteredCount > 0 ? Math.round((completedCount / enteredCount) * 100) : 0;
          previousCompletedCount = completedCount;

          let stepName = "";
          let delayText = "";
          if (step.delay) {
            delayText = `${step.delay.amount} ${step.delay.unit}`;
          }

          let emailsSent: number | undefined;
          let replies: number | undefined;
          let tasksCreated: number | undefined;
          let tasksCompleted: number | undefined;
          let callsCreated: number | undefined;
          let callsCompleted: number | undefined;

          if (step.kind === "email") {
            stepName = step.name || "Email follow-up";
            emailsSent = executed;
            const stepRunEnrollmentIds = new Set(runs.map((r) => r.enrollmentId));
            let replyCount = 0;
            for (const eid of stepRunEnrollmentIds) {
              const enr = enrollmentsById.get(eid);
              if (
                enr &&
                enr.state === "exited" &&
                (enr.reason === "reply" || enr.reason === "on_reply")
              ) {
                replyCount++;
              }
            }
            replies = replyCount;
          } else if (step.kind === "task") {
            stepName = step.subject || "Task follow-up";
            tasksCreated = executed;
            tasksCompleted = executed;
          } else if (step.kind === "call") {
            stepName = step.subject || "Call follow-up";
            callsCreated = executed;
            callsCompleted = executed;
          }

          stepMetrics.push({
            stepId: step.id,
            stepKind: step.kind,
            stepName,
            delayText,
            executed,
            skipped,
            skippedReasons,
            failed,
            emailsSent,
            replies,
            tasksCreated,
            tasksCompleted,
            callsCreated,
            callsCompleted,
            enteredCount,
            completedCount,
            conversionRate,
          });
        }

        return {
          cadence: {
            id: cadenceRow.id,
            name: cadenceRow.name,
            module: cadenceRow.module as CadenceModule,
            status: cadenceRow.status as CadenceStatus,
            createdAt: cadenceRow.createdAt.toISOString(),
          },
          dateRange: {
            startDate: options?.startDate,
            endDate: options?.endDate,
          },
          summary,
          stepMetrics,
        };
      });
    },

    async handleRecordDeleted(
      ctx: OrgContext,
      recordModule: CadenceModule,
      recordId: string,
    ): Promise<void> {
      return withOrg(ctx, async (tx) => {
        await tx
          .update(schema.cadenceEnrollments)
          .set({
            state: "exited",
            reason: "record_deleted",
            generation: sql`${schema.cadenceEnrollments.generation} + 1`,
            nextStepId: null,
            nextDueAt: null,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(schema.cadenceEnrollments.organizationId, ctx.orgId),
              eq(schema.cadenceEnrollments.recordModule, recordModule),
              eq(schema.cadenceEnrollments.recordId, recordId),
              inArray(schema.cadenceEnrollments.state, ["active", "paused"]),
            ),
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
