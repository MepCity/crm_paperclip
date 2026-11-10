import { schema } from "@crm/db";
import { and, eq, lte, sql } from "drizzle-orm";
import { can, canOnRecord } from "../access/evaluate";
import type { AccessSnapshot } from "../access/types";
import type { JobFence } from "../jobs";
import type { OutboxOptions } from "../mail/outbox";
import { createMailOutbox } from "../mail/outbox";
import type { MailRepository } from "../mail/types";
import type { RecordData, RecordService } from "../records";
import { withOrg } from "../tenancy";
import type { OrgContext } from "../tenancy/types";
import { computeDueAt } from "./delays";
import { evaluateExitRules } from "./exit-rules";
import type {
  CadenceCallStep,
  CadenceEmailStep,
  CadenceExitRule,
  CadenceModule,
  CadenceStep,
  CadenceTaskStep,
} from "./types";

export interface CadenceWorkerDeps {
  recordService?: RecordService;
  mailRepository?: MailRepository;
  outboxOptions?: OutboxOptions;
  accessSnapshotProvider?: (ctx: OrgContext, userId: string) => Promise<AccessSnapshot>;
  timeZone?: string;
}

export interface ExecuteStepParams {
  enrollmentId: string;
  stepId: string;
  generation: number;
  jobFence?: JobFence;
  deps?: CadenceWorkerDeps;
}

export type StepExecutionResult =
  | { status: "completed"; stepId: string; outcome: "completed" }
  | { status: "skipped"; stepId: string; outcome: "skipped"; reason: string }
  | { status: "exited"; rule: string }
  | { status: "aborted"; reason: string };

/**
 * Executes a single due step for an enrollment under row locking and job fence.
 * Re-checks user access, evaluates exit rules before step execution, and updates generation.
 */
export async function executeCadenceStep(
  ctx: OrgContext,
  params: ExecuteStepParams,
): Promise<StepExecutionResult> {
  return withOrg(ctx, async (tx) => {
    // 1. Lock the enrollment row FOR UPDATE (ADR 0019 §6)
    const [enrollment] = await tx
      .select()
      .from(schema.cadenceEnrollments)
      .where(
        and(
          eq(schema.cadenceEnrollments.organizationId, ctx.orgId),
          eq(schema.cadenceEnrollments.id, params.enrollmentId),
        ),
      )
      .for("update");

    if (!enrollment) {
      return { status: "aborted", reason: "enrollment_not_found" };
    }

    // Require active state and exact generation match
    if (enrollment.state !== "active") {
      return { status: "aborted", reason: `enrollment_${enrollment.state}` };
    }

    if (enrollment.generation !== params.generation) {
      return { status: "aborted", reason: "generation_mismatch" };
    }

    if (enrollment.nextStepId !== params.stepId) {
      return { status: "aborted", reason: "step_mismatch" };
    }

    // 2. Check if cadence is active
    const [cadence] = await tx
      .select()
      .from(schema.cadences)
      .where(
        and(
          eq(schema.cadences.organizationId, ctx.orgId),
          eq(schema.cadences.id, enrollment.cadenceId),
        ),
      );

    if (cadence?.status !== "active") {
      // Deactivated cadence stops scheduled actions
      return { status: "aborted", reason: "cadence_inactive" };
    }

    // 3. Idempotency: verify step has not already run for this (enrollmentId, stepId, generation)
    const [existingRun] = await tx
      .select({ id: schema.cadenceStepRuns.id })
      .from(schema.cadenceStepRuns)
      .where(
        and(
          eq(schema.cadenceStepRuns.organizationId, ctx.orgId),
          eq(schema.cadenceStepRuns.enrollmentId, enrollment.id),
          eq(schema.cadenceStepRuns.stepId, params.stepId),
          eq(schema.cadenceStepRuns.generation, params.generation),
        ),
      );

    if (existingRun) {
      return { status: "aborted", reason: "already_executed" };
    }

    // 4. Load the cadence version
    const [version] = await tx
      .select()
      .from(schema.cadenceVersions)
      .where(
        and(
          eq(schema.cadenceVersions.organizationId, ctx.orgId),
          eq(schema.cadenceVersions.id, enrollment.versionId),
        ),
      );

    if (!version) {
      return { status: "aborted", reason: "version_not_found" };
    }

    const steps = (version.steps as CadenceStep[]) ?? [];
    const exitRules = (version.exitRules as CadenceExitRule[]) ?? [];

    const currentStepIndex = steps.findIndex((s) => s.id === params.stepId);
    if (currentStepIndex === -1) {
      return { status: "aborted", reason: "step_not_found" };
    }
    const currentStep = steps[currentStepIndex] as CadenceStep;

    // Fetch the target record if record service is provided
    let record: RecordData | null = null;
    if (params.deps?.recordService) {
      try {
        record = await params.deps.recordService.get(enrollment.recordModule, enrollment.recordId);
      } catch {
        // Record was deleted or inaccessible -> exit enrollment
        await tx
          .update(schema.cadenceEnrollments)
          .set({
            state: "exited",
            reason: "record_missing",
            generation: sql`${schema.cadenceEnrollments.generation} + 1`,
            nextStepId: null,
            nextDueAt: null,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(schema.cadenceEnrollments.organizationId, ctx.orgId),
              eq(schema.cadenceEnrollments.id, enrollment.id),
            ),
          );
        return { status: "exited", rule: "record_missing" };
      }
    }

    // 5. Exit rules: evaluated before every step and win over simultaneous step (ADR 0019 §6, spec C3)
    if (record && exitRules.length > 0) {
      const matchedExitRule = await evaluateExitRules(exitRules, {
        record,
        recordModule: enrollment.recordModule as CadenceModule,
        recordId: enrollment.recordId,
        enrollmentCreatedAt: enrollment.createdAt,
        recordService: params.deps?.recordService,
        mailRepository: params.deps?.mailRepository,
      });

      if (matchedExitRule) {
        await tx
          .update(schema.cadenceEnrollments)
          .set({
            state: "exited",
            reason: `exit_rule:${matchedExitRule.kind}`,
            generation: sql`${schema.cadenceEnrollments.generation} + 1`,
            nextStepId: null,
            nextDueAt: null,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(schema.cadenceEnrollments.organizationId, ctx.orgId),
              eq(schema.cadenceEnrollments.id, enrollment.id),
            ),
          );
        return { status: "exited", rule: matchedExitRule.kind };
      }
    }

    // 6. Check that enrolling user is active and has the required right (ADR 0019 §6)
    // "before each effect re-check the user is active and has the right, else step skipped reason actor_lost_access"
    const [membership] = await tx
      .select({
        role: schema.memberships.role,
      })
      .from(schema.memberships)
      .where(
        and(
          eq(schema.memberships.organizationId, ctx.orgId),
          eq(schema.memberships.userId, enrollment.enrolledBy),
        ),
      );

    let hasRight = Boolean(
      membership && (membership.role === "admin" || membership.role === "member"),
    );

    if (hasRight && params.deps?.accessSnapshotProvider) {
      const snapshot = await params.deps.accessSnapshotProvider(ctx, enrollment.enrolledBy);
      if (currentStep.kind === "email") {
        const ownerId = record ? (record.fields.Owner as string | undefined) : undefined;
        const canRead = canOnRecord(snapshot, enrollment.recordModule, "view", ownerId);
        if (!canRead) hasRight = false;
      } else if (currentStep.kind === "task") {
        if (!can(snapshot, "Tasks", "create")) hasRight = false;
      } else if (currentStep.kind === "call") {
        if (!can(snapshot, "Calls", "create")) hasRight = false;
      }
    }

    let outcome: "completed" | "skipped" = "completed";
    let outcomeReason: string | null = null;

    if (!hasRight) {
      outcome = "skipped";
      outcomeReason = "actor_lost_access";
    } else {
      // 7. Execute the effect
      try {
        if (currentStep.kind === "email") {
          const email = record ? (record.fields.Email as string | undefined) : undefined;
          if (!email) {
            outcome = "skipped";
            outcomeReason = "missing_email";
          } else if (params.deps?.outboxOptions) {
            const outbox = createMailOutbox(
              { ...ctx, userId: enrollment.enrolledBy },
              params.deps.outboxOptions,
            );
            // Locate user's connected mailbox
            const mailRepo = params.deps.mailRepository ?? params.deps.outboxOptions.repository;
            const mailSnapshot = await mailRepo.read(ctx.orgId);
            const userMailbox = mailSnapshot.mailboxes.find(
              (m) => m.ownerUserId === enrollment.enrolledBy && m.status === "connected",
            );
            if (!userMailbox) {
              outcome = "skipped";
              outcomeReason = "actor_lost_access";
            } else {
              await outbox.compose({
                idempotencyKey: `cadence-${enrollment.id}-${currentStep.id}-${enrollment.generation}`,
                mailboxId: userMailbox.id,
                from: {
                  address: userMailbox.id.includes("@") ? userMailbox.id : "user@example.com",
                },
                to: [{ address: email }],
                subject: (currentStep as CadenceEmailStep).name ?? "Cadence Outreach",
                summary: "Automated sequence message",
                attachments: [],
              });
            }
          }
        } else if (currentStep.kind === "task") {
          if (params.deps?.recordService) {
            const taskStep = currentStep as CadenceTaskStep;
            const isContactOrLead =
              enrollment.recordModule === "Leads" || enrollment.recordModule === "Contacts";
            await params.deps.recordService.create("Tasks", {
              Subject: taskStep.subject,
              Priority: taskStep.priority,
              Status: "Not Started",
              Owner: enrollment.enrolledBy,
              ...(isContactOrLead
                ? { Who_Id: { module: enrollment.recordModule, id: enrollment.recordId } }
                : { What_Id: { module: enrollment.recordModule, id: enrollment.recordId } }),
            });
          }
        } else if (currentStep.kind === "call") {
          if (params.deps?.recordService) {
            const callStep = currentStep as CadenceCallStep;
            const isContactOrLead =
              enrollment.recordModule === "Leads" || enrollment.recordModule === "Contacts";
            await params.deps.recordService.create("Calls", {
              Subject: callStep.subject,
              Call_Type: callStep.callType,
              Call_Start_Time: new Date().toISOString(),
              Owner: enrollment.enrolledBy,
              ...(isContactOrLead
                ? { Who_Id: { module: enrollment.recordModule, id: enrollment.recordId } }
                : { What_Id: { module: enrollment.recordModule, id: enrollment.recordId } }),
            });
          }
        }
      } catch (err) {
        outcome = "skipped";
        outcomeReason = err instanceof Error ? err.message : "execution_failed";
      }
    }

    // 8. Record step run in cadence_step_runs
    await tx.insert(schema.cadenceStepRuns).values({
      organizationId: ctx.orgId,
      enrollmentId: enrollment.id,
      stepId: currentStep.id,
      generation: enrollment.generation,
      outcome,
      outcomeReason,
      executedAt: new Date(),
    });

    // 9. Advance enrollment: find next step or complete
    const nextStep = steps[currentStepIndex + 1];
    if (nextStep) {
      const nextDueAt = computeDueAt(new Date(), nextStep.delay, params.deps?.timeZone ?? "UTC");
      await tx
        .update(schema.cadenceEnrollments)
        .set({
          nextStepId: nextStep.id,
          nextDueAt,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(schema.cadenceEnrollments.organizationId, ctx.orgId),
            eq(schema.cadenceEnrollments.id, enrollment.id),
          ),
        );
    } else {
      await tx
        .update(schema.cadenceEnrollments)
        .set({
          state: "completed",
          nextStepId: null,
          nextDueAt: null,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(schema.cadenceEnrollments.organizationId, ctx.orgId),
            eq(schema.cadenceEnrollments.id, enrollment.id),
          ),
        );
    }

    if (outcome === "skipped") {
      return {
        status: "skipped",
        stepId: currentStep.id,
        outcome: "skipped",
        reason: outcomeReason ?? "unknown",
      };
    }

    return {
      status: "completed",
      stepId: currentStep.id,
      outcome: "completed",
    };
  });
}

/**
 * Finds active due enrollments for an organisation and runs them.
 * Due batch capped at 200 per worker tick (ADR 0019 §consequences).
 */
export async function sweepDueEnrollments(
  ctx: OrgContext,
  options?: {
    limit?: number;
    asOf?: Date;
    deps?: CadenceWorkerDeps;
  },
): Promise<number> {
  const asOf = options?.asOf ?? new Date();
  const limit = Math.min(options?.limit ?? 200, 200);

  const dueRows = await withOrg(ctx, async (tx) => {
    return tx
      .select({
        id: schema.cadenceEnrollments.id,
        nextStepId: schema.cadenceEnrollments.nextStepId,
        generation: schema.cadenceEnrollments.generation,
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
          eq(schema.cadenceEnrollments.state, "active"),
          eq(schema.cadences.status, "active"),
          sql`${schema.cadenceEnrollments.nextStepId} IS NOT NULL`,
          lte(schema.cadenceEnrollments.nextDueAt, asOf),
        ),
      )
      .orderBy(schema.cadenceEnrollments.nextDueAt)
      .limit(limit);
  });

  let executedCount = 0;
  for (const row of dueRows) {
    if (!row.nextStepId) continue;
    const result = await executeCadenceStep(ctx, {
      enrollmentId: row.id,
      stepId: row.nextStepId,
      generation: row.generation,
      deps: options?.deps,
    });
    if (
      result.status === "completed" ||
      result.status === "skipped" ||
      result.status === "exited"
    ) {
      executedCount++;
    }
  }

  return executedCount;
}

/**
 * Sweeps custom view audiences: resolves viewId within org and enrolls matching records.
 * CTO item 3: viewId resolved and verified inside org at execution time.
 */
export async function sweepAudienceCustomViews(
  ctx: OrgContext,
  deps: CadenceWorkerDeps & { recordService: RecordService },
): Promise<{ enrolledCount: number }> {
  let enrolledCount = 0;

  const activeViewCadences = await withOrg(ctx, async (tx) => {
    return tx
      .select({
        cadenceId: schema.cadences.id,
        module: schema.cadences.module,
        versionId: schema.cadences.publishedVersionId,
        audience: schema.cadenceVersions.audience,
        steps: schema.cadenceVersions.steps,
      })
      .from(schema.cadences)
      .innerJoin(
        schema.cadenceVersions,
        and(
          eq(schema.cadenceVersions.organizationId, schema.cadences.organizationId),
          eq(schema.cadenceVersions.id, schema.cadences.publishedVersionId),
        ),
      )
      .where(
        and(eq(schema.cadences.organizationId, ctx.orgId), eq(schema.cadences.status, "active")),
      );
  });

  for (const cad of activeViewCadences) {
    if (!cad.versionId) continue;
    const audience = cad.audience as { kind: string; viewId?: string; enrollNewMatches?: boolean };
    if (audience?.kind !== "custom_view" || !audience.viewId) continue;

    // Verify custom view within org and module (CTO note 3)
    try {
      await deps.recordService.getView(cad.module, audience.viewId);
    } catch {
      // View not found in org for this module -> skip
      continue;
    }

    // Query matching records from custom view
    const listResult = await deps.recordService.list(cad.module, {
      viewId: audience.viewId,
      page: 1,
      perPage: 100,
    });
    const matchingRecords =
      (listResult as unknown as { records?: readonly RecordData[] })?.records ??
      (Array.isArray(listResult) ? listResult : []);

    const steps = (cad.steps as CadenceStep[]) ?? [];
    const firstStep = steps[0];

    for (const rec of matchingRecords) {
      // Check if already has an enrollment
      const hasEnrollment = await withOrg(ctx, async (tx) => {
        const [existing] = await tx
          .select({ id: schema.cadenceEnrollments.id })
          .from(schema.cadenceEnrollments)
          .where(
            and(
              eq(schema.cadenceEnrollments.organizationId, ctx.orgId),
              eq(schema.cadenceEnrollments.cadenceId, cad.cadenceId),
              eq(schema.cadenceEnrollments.recordModule, cad.module),
              eq(schema.cadenceEnrollments.recordId, rec.id),
              audience.enrollNewMatches
                ? sql`${schema.cadenceEnrollments.state} in ('active', 'paused')`
                : sql`true`,
            ),
          )
          .limit(1);
        return Boolean(existing);
      });

      if (!hasEnrollment) {
        const nextDueAt = firstStep
          ? computeDueAt(new Date(), firstStep.delay, deps.timeZone ?? "UTC")
          : null;

        await withOrg(ctx, async (tx) => {
          await tx.insert(schema.cadenceEnrollments).values({
            organizationId: ctx.orgId,
            cadenceId: cad.cadenceId,
            versionId: cad.versionId as string,
            recordModule: cad.module,
            recordId: rec.id,
            enrolledBy: ctx.userId,
            state: firstStep ? "active" : "completed",
            generation: 1,
            nextStepId: firstStep?.id ?? null,
            nextDueAt,
          });
        });

        enrolledCount++;
      }
    }
  }

  return { enrolledCount };
}
