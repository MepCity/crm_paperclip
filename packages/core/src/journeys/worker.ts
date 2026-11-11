import { schema } from "@crm/db";
import { and, eq, lte, sql } from "drizzle-orm";
import { can, canOnRecord } from "../access/evaluate";
import type { AccessSnapshot } from "../access/types";
import { matchesCriteria } from "../approvals/criteria";
import { ForbiddenError } from "../errors";
import {
  type Job,
  JobCatalog,
  type JobDefinition,
  JobExecutionError,
  type JobFence,
  type JobQueue,
} from "../jobs";
import { createMailOutbox, type OutboxOptions } from "../mail/outbox";
import type { MailRepository } from "../mail/types";
import type { RecordData, RecordService } from "../records";
import { createFixtureRecordService } from "../records/fixture";
import { systemOrgContext, withOrg } from "../tenancy";
import type { OrgContext } from "../tenancy/types";
import { computeDueAt } from "./delays";
import type {
  JourneyAction,
  JourneyCallAction,
  JourneyDeadline,
  JourneyEmailAction,
  JourneyFieldUpdateAction,
  JourneyNotifyUserAction,
  JourneyState,
  JourneyTaskAction,
  JourneyTransition,
  JourneyTrigger,
} from "./types";

export interface JourneysWorkerDeps {
  recordService?: RecordService;
  mailRepository?: MailRepository;
  outboxOptions?: OutboxOptions;
  accessSnapshotProvider: (ctx: OrgContext, userId: string) => Promise<AccessSnapshot>;
  canAccess?: (
    userId: string,
    module: string,
    action: string,
    recordId?: string,
  ) => Promise<boolean> | boolean;
  timeZone?: string;
  jobQueue?: JobQueue;
}

export interface ExecuteTransitionParams {
  instanceId: string;
  transitionId: string;
  eventId: string;
  generation: number;
  jobFence?: JobFence;
  deps?: JourneysWorkerDeps;
  record?: RecordData;
}

export type TransitionExecutionResult =
  | { status: "completed"; transitionId: string; toStateId: string }
  | { status: "criteria_failed"; transitionId: string; reason: string }
  | { status: "aborted"; reason: string };

export interface ExecuteDueActionParams {
  dueActionId?: string;
  instanceId?: string;
  stateId?: string;
  actionId?: string;
  generation?: number;
  jobFence?: JobFence;
  deps?: JourneysWorkerDeps;
}

export type ActionExecutionResult =
  | { status: "completed"; actionId: string; outcome: "completed"; type?: string }
  | { status: "skipped"; actionId: string; outcome: "skipped"; reason: string }
  | { status: "already_executed" }
  | { status: "aborted"; reason: string };

export const JOURNEY_TRANSITION_JOB_KIND = "journey_transition";
export const JOURNEY_TRANSITION_JOB_VERSION = 1;

export const JOURNEY_ACTION_JOB_KIND = "journey_action";
export const JOURNEY_ACTION_JOB_VERSION = 1;

export const JOURNEY_SWEEP_JOB_KIND = "journey_sweep";
export const JOURNEY_SWEEP_JOB_VERSION = 1;

export const journeyJobDefinitions: readonly JobDefinition[] = [
  {
    kind: JOURNEY_TRANSITION_JOB_KIND,
    version: JOURNEY_TRANSITION_JOB_VERSION,
    referenceKeys: ["instanceId", "transitionId", "eventId", "journeyGeneration"],
    retrySafe: false,
  },
  {
    kind: JOURNEY_ACTION_JOB_KIND,
    version: JOURNEY_ACTION_JOB_VERSION,
    referenceKeys: ["dueActionId", "instanceId", "stateId", "actionId", "journeyGeneration"],
    retrySafe: false,
  },
  {
    kind: JOURNEY_SWEEP_JOB_KIND,
    version: JOURNEY_SWEEP_JOB_VERSION,
    referenceKeys: [],
    retrySafe: true,
  },
];

export function createJourneyJobCatalog(): JobCatalog {
  return new JobCatalog(journeyJobDefinitions);
}

export function evaluateJourneyCriteria(
  fields: Record<string, unknown>,
  criteria?: unknown | null,
): boolean {
  if (!criteria) return true;
  if (typeof criteria === "object" && criteria !== null) {
    const obj = criteria as { kind?: string; criteria?: unknown };
    if (obj.kind === "all_records") return true;
    if (obj.kind === "criteria" && obj.criteria) {
      return matchesCriteria(
        fields as Parameters<typeof matchesCriteria>[0],
        obj.criteria as Parameters<typeof matchesCriteria>[1],
      );
    }
    return matchesCriteria(
      fields as Parameters<typeof matchesCriteria>[0],
      criteria as Parameters<typeof matchesCriteria>[1],
    );
  }
  return true;
}

function normalizeTriggerKind(trigger: JourneyTrigger): string {
  if (typeof trigger === "string") return trigger;
  if ("kind" in trigger) return trigger.kind;
  if ("type" in trigger) return (trigger as { type: string }).type;
  return "unknown";
}

/**
 * Executes a single action effect under owner permissions and journey actor scope (ADR 0019 §6, ADR 0013 §3).
 * Re-checks that the record owner is active and has the required right; otherwise outcome 'skipped' with 'actor_lost_access'.
 */
export async function executeActionEffect(
  tx: Parameters<Parameters<typeof withOrg>[1]>[0],
  ctx: OrgContext,
  instance: {
    id: string;
    journeyId: string;
    versionId: string;
    recordModule: string;
    recordId: string;
    generation: number;
  },
  action: JourneyAction,
  record: RecordData,
  ownerId: string,
  deps?: JourneysWorkerDeps,
): Promise<{ outcome: "completed" | "skipped"; outcomeReason?: string }> {
  // 1. Re-check owner is an active member
  const [membership] = await tx
    .select({ role: schema.memberships.role })
    .from(schema.memberships)
    .where(
      and(eq(schema.memberships.organizationId, ctx.orgId), eq(schema.memberships.userId, ownerId)),
    );

  let hasRight = Boolean(
    membership && (membership.role === "admin" || membership.role === "member"),
  );

  if (hasRight) {
    if (!deps?.accessSnapshotProvider) {
      hasRight = false;
    } else {
      const snapshot = await deps.accessSnapshotProvider(ctx, ownerId);
      if (action.kind === "email") {
        if (!canOnRecord(snapshot, instance.recordModule, "view", ownerId)) {
          hasRight = false;
        }
      } else if (action.kind === "task") {
        if (!can(snapshot, "Tasks", "create")) {
          hasRight = false;
        }
      } else if (action.kind === "call") {
        if (!can(snapshot, "Calls", "create")) {
          hasRight = false;
        }
      } else if (action.kind === "field_update") {
        if (!canOnRecord(snapshot, instance.recordModule, "edit", ownerId)) {
          hasRight = false;
        }
      } else if (action.kind === "notify_user") {
        const notifyAction = action as JourneyNotifyUserAction;
        let targetUserId = notifyAction.userRef;
        if (targetUserId === "owner" || targetUserId === "record_owner") {
          targetUserId = ownerId;
        }
        const [targetMembership] = await tx
          .select({ role: schema.memberships.role })
          .from(schema.memberships)
          .where(
            and(
              eq(schema.memberships.organizationId, ctx.orgId),
              eq(schema.memberships.userId, targetUserId),
            ),
          );
        if (
          !targetMembership ||
          (targetMembership.role !== "admin" && targetMembership.role !== "member")
        ) {
          hasRight = false;
        }
      }
    }
  }

  if (hasRight && deps?.canAccess) {
    const allowed = await deps.canAccess(ownerId, instance.recordModule, "edit", record.id);
    if (!allowed) {
      hasRight = false;
    }
  }

  if (!hasRight) {
    return { outcome: "skipped", outcomeReason: "actor_lost_access" };
  }

  const idempotencyKey = `journey-act_${instance.id}_${action.id}_${instance.generation}`.slice(
    0,
    128,
  );

  try {
    if (action.kind === "email") {
      const email = record.fields.Email as string | undefined;
      if (!email) {
        return { outcome: "skipped", outcomeReason: "missing_email" };
      }
      if (deps?.outboxOptions) {
        const outbox = createMailOutbox({ ...ctx, userId: ownerId }, deps.outboxOptions);
        const mailRepo = deps.mailRepository ?? deps.outboxOptions.repository;
        const mailSnapshot = await mailRepo.read(ctx.orgId);
        const userMailbox = mailSnapshot.mailboxes.find(
          (m) => m.ownerUserId === ownerId && m.status === "connected",
        );
        if (!userMailbox) {
          return { outcome: "skipped", outcomeReason: "actor_lost_access" };
        }
        const [ownerUser] = await tx
          .select({ email: schema.users.email })
          .from(schema.users)
          .where(eq(schema.users.id, ownerId));

        const senderAddress =
          (userMailbox as { address?: string; email?: string }).address?.trim() ||
          (userMailbox as { address?: string; email?: string }).email?.trim() ||
          (userMailbox.id.includes("@") ? userMailbox.id.trim() : undefined) ||
          (ownerUser?.email?.includes("@") ? ownerUser.email.trim() : undefined);

        if (!senderAddress) {
          return { outcome: "skipped", outcomeReason: "missing_mailbox_address" };
        }

        await outbox.compose({
          idempotencyKey,
          mailboxId: userMailbox.id,
          from: { address: senderAddress },
          to: [{ address: email }],
          subject: (action as JourneyEmailAction).id || "Journey Notification",
          summary: "Automated journey sequence message",
          attachments: [],
        });
      }
    } else if (action.kind === "task") {
      const recordService =
        deps?.recordService ??
        createFixtureRecordService(ctx, {
          actor: {
            kind: "journey",
            id: instance.journeyId,
            versionId: instance.versionId,
            module: instance.recordModule,
          },
        });
      const taskAction = action as JourneyTaskAction;
      const isContactOrLead =
        instance.recordModule === "Leads" || instance.recordModule === "Contacts";
      await recordService.create(
        "Tasks",
        {
          Subject: taskAction.subject,
          Priority: taskAction.priority,
          Status: "Not Started",
          Owner: ownerId,
          ...(isContactOrLead
            ? { Who_Id: { module: instance.recordModule, id: instance.recordId } }
            : { What_Id: { module: instance.recordModule, id: instance.recordId } }),
        },
        { idempotencyKey },
      );
    } else if (action.kind === "call") {
      const recordService =
        deps?.recordService ??
        createFixtureRecordService(ctx, {
          actor: {
            kind: "journey",
            id: instance.journeyId,
            versionId: instance.versionId,
            module: instance.recordModule,
          },
        });
      const callAction = action as JourneyCallAction;
      const isContactOrLead =
        instance.recordModule === "Leads" || instance.recordModule === "Contacts";
      await recordService.create(
        "Calls",
        {
          Subject: callAction.subject,
          Call_Type: callAction.callType,
          Call_Start_Time: new Date().toISOString(),
          Owner: ownerId,
          ...(isContactOrLead
            ? { Who_Id: { module: instance.recordModule, id: instance.recordId } }
            : { What_Id: { module: instance.recordModule, id: instance.recordId } }),
        },
        { idempotencyKey },
      );
    } else if (action.kind === "field_update") {
      const recordService =
        deps?.recordService ??
        createFixtureRecordService(ctx, {
          actor: {
            kind: "journey",
            id: instance.journeyId,
            versionId: instance.versionId,
            module: instance.recordModule,
          },
        });
      const fieldUpdate = action as JourneyFieldUpdateAction;
      await recordService.update(
        instance.recordModule,
        instance.recordId,
        { [fieldUpdate.field]: fieldUpdate.value as string | number | boolean | null },
        { idempotencyKey },
      );
    } else if (action.kind === "notify_user") {
      const notifyAction = action as JourneyNotifyUserAction;
      let targetUserId = notifyAction.userRef;
      if (targetUserId === "owner" || targetUserId === "record_owner") {
        targetUserId = ownerId;
      }
      await tx.insert(schema.notifications).values({
        organizationId: ctx.orgId,
        recipientUserId: targetUserId,
        kind: "journey_notification",
        subject: {
          journeyId: instance.journeyId,
          instanceId: instance.id,
          recordModule: instance.recordModule,
          recordId: instance.recordId,
          message: notifyAction.message,
        },
      });
    }
  } catch (err) {
    if (err instanceof ForbiddenError || (err as { name?: string }).name === "ForbiddenError") {
      return { outcome: "skipped", outcomeReason: "actor_lost_access" };
    }
    throw err;
  }

  return { outcome: "completed" };
}

/**
 * Executes a journey transition under instance locking, criteria evaluation, and job fence (ADR 0019 §6).
 * Atomically writes journey_transition_runs and transitions the instance to the target state.
 */
export async function executeJourneyTransition(
  ctx: OrgContext,
  params: ExecuteTransitionParams,
): Promise<TransitionExecutionResult> {
  return withOrg(ctx, async (tx) => {
    // 0. Job fence validation (ADR 0019 §6, ADR 0013 §3)
    if (params.jobFence) {
      if (params.jobFence.organizationId !== ctx.orgId) {
        return { status: "aborted", reason: "fence_tenant_mismatch" };
      }
      if (!params.jobFence.id || !params.jobFence.lockedBy || !params.jobFence.leaseToken) {
        return { status: "aborted", reason: "invalid_job_fence" };
      }
      if (params.deps?.jobQueue) {
        const stillLeased = await params.deps.jobQueue.renew(params.jobFence, 60000);
        if (!stillLeased) {
          return { status: "aborted", reason: "fence_lease_lost" };
        }
      }
    }

    // 1. Lock instance FOR UPDATE
    const [instance] = await tx
      .select()
      .from(schema.journeyInstances)
      .where(
        and(
          eq(schema.journeyInstances.organizationId, ctx.orgId),
          eq(schema.journeyInstances.id, params.instanceId),
        ),
      )
      .for("update");

    if (!instance) {
      return { status: "aborted", reason: "instance_not_found" };
    }

    if (instance.status !== "active") {
      return { status: "aborted", reason: `instance_${instance.status}` };
    }

    if (instance.generation !== params.generation) {
      return { status: "aborted", reason: "generation_mismatch" };
    }

    // 2. Check if journey is active
    const [journey] = await tx
      .select()
      .from(schema.journeys)
      .where(
        and(
          eq(schema.journeys.organizationId, ctx.orgId),
          eq(schema.journeys.id, instance.journeyId),
        ),
      );

    if (journey?.status !== "active") {
      return { status: "aborted", reason: "journey_inactive" };
    }

    // 3. Idempotency: verify this transition run has not already executed for (instanceId, transitionId, eventId)
    const [existingRun] = await tx
      .select({ id: schema.journeyTransitionRuns.id })
      .from(schema.journeyTransitionRuns)
      .where(
        and(
          eq(schema.journeyTransitionRuns.organizationId, ctx.orgId),
          eq(schema.journeyTransitionRuns.instanceId, instance.id),
          eq(schema.journeyTransitionRuns.transitionId, params.transitionId),
          eq(schema.journeyTransitionRuns.eventId, params.eventId),
        ),
      );

    if (existingRun) {
      return { status: "aborted", reason: "already_executed" };
    }

    // 4. Load version and transition definition
    const [version] = await tx
      .select()
      .from(schema.journeyVersions)
      .where(
        and(
          eq(schema.journeyVersions.organizationId, ctx.orgId),
          eq(schema.journeyVersions.id, instance.versionId),
        ),
      );

    if (!version) {
      return { status: "aborted", reason: "version_not_found" };
    }

    const states = (version.states as JourneyState[]) ?? [];
    const transitions = (version.transitions as JourneyTransition[]) ?? [];

    const transition = transitions.find((t) => t.id === params.transitionId);
    if (!transition) {
      return { status: "aborted", reason: "transition_not_found" };
    }

    if (transition.from !== instance.currentStateId) {
      return { status: "aborted", reason: "transition_source_mismatch" };
    }

    const targetState = states.find((s) => s.id === transition.to);
    if (!targetState) {
      return { status: "aborted", reason: "target_state_not_found" };
    }

    // 5. Fetch target record
    let record = params.record ?? null;
    if (!record) {
      try {
        const recordService =
          params.deps?.recordService ??
          createFixtureRecordService(ctx, {
            actor: {
              kind: "journey",
              id: instance.journeyId,
              versionId: instance.versionId,
              module: instance.recordModule,
            },
          });
        record = await recordService.get(instance.recordModule, instance.recordId);
      } catch {
        // Record deleted or missing -> stop instance with generation bump
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
              eq(schema.journeyInstances.id, instance.id),
            ),
          );
        return { status: "aborted", reason: "record_missing" };
      }
    }

    const ownerId =
      record && typeof record.fields.Owner === "string" ? record.fields.Owner : ctx.userId;

    // 6. Evaluate criteria (criteria pass/fail)
    if (transition.criteria && record) {
      const criteriaMatches = evaluateJourneyCriteria(record.fields, transition.criteria);
      if (!criteriaMatches) {
        // Record failed criteria: write run record with criteria_failed and abort transition
        await tx.insert(schema.journeyTransitionRuns).values({
          organizationId: ctx.orgId,
          instanceId: instance.id,
          transitionId: transition.id,
          eventId: params.eventId,
          result: "criteria_failed",
          resultReason: "criteria_not_met",
          executedAt: new Date(),
        });
        return {
          status: "criteria_failed",
          transitionId: transition.id,
          reason: "criteria_not_met",
        };
      }
    }

    // 7. Execute transition actions under job fence
    const transitionActions = transition.actions ?? [];
    for (const action of transitionActions) {
      if (record) {
        await executeActionEffect(tx, ctx, instance, action, record, ownerId, params.deps);
      }
    }

    // 8. Write journey_transition_runs
    await tx.insert(schema.journeyTransitionRuns).values({
      organizationId: ctx.orgId,
      instanceId: instance.id,
      transitionId: transition.id,
      eventId: params.eventId,
      result: "success",
      executedAt: new Date(),
    });

    // 9. Move instance to target state and schedule actions + deadline
    const now = new Date();
    const deadlineAt = targetState.deadline
      ? computeDueAt(now, targetState.deadline, params.deps?.timeZone ?? "UTC")
      : null;

    await tx
      .update(schema.journeyInstances)
      .set({
        currentStateId: targetState.id,
        stateEnteredAt: now,
        deadlineAt,
        updatedAt: now,
      })
      .where(
        and(
          eq(schema.journeyInstances.organizationId, ctx.orgId),
          eq(schema.journeyInstances.id, instance.id),
        ),
      );

    // Schedule deadline due action if targetState has a deadline
    if (deadlineAt) {
      await tx
        .insert(schema.journeyDueActions)
        .values({
          organizationId: ctx.orgId,
          instanceId: instance.id,
          stateId: targetState.id,
          actionId: "__deadline__",
          dueAt: deadlineAt,
          generation: instance.generation,
        })
        .onConflictDoNothing();
    }

    // Schedule target state actions
    const stateActions = targetState.actions ?? [];
    for (const action of stateActions) {
      const isImmediate =
        action.timing === "immediate" ||
        (typeof action.timing === "object" && action.timing.type === "immediate");

      const dueAt = isImmediate
        ? now
        : computeDueAt(now, action.timing, params.deps?.timeZone ?? "UTC");

      const [dueRow] = await tx
        .insert(schema.journeyDueActions)
        .values({
          organizationId: ctx.orgId,
          instanceId: instance.id,
          stateId: targetState.id,
          actionId: action.id,
          dueAt,
          generation: instance.generation,
        })
        .onConflictDoNothing()
        .returning();

      // If immediate and record is present, execute immediately
      if (isImmediate && record && dueRow) {
        const effectResult = await executeActionEffect(
          tx,
          ctx,
          instance,
          action,
          record,
          ownerId,
          params.deps,
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

    // Schedule any date_reached transitions from targetState
    for (const t of transitions) {
      if (t.from === targetState.id) {
        const kind = normalizeTriggerKind(t.trigger);
        if (kind === "date_reached" && record) {
          const triggerObj = t.trigger as {
            kind?: string;
            type?: string;
            field: string;
            offset?: unknown;
          };
          const dateVal = record.fields[triggerObj.field];
          if (dateVal && typeof dateVal === "string") {
            const baseDate = new Date(dateVal);
            if (!Number.isNaN(baseDate.getTime())) {
              const dueAt = triggerObj.offset
                ? computeDueAt(
                    baseDate,
                    triggerObj.offset as JourneyDeadline,
                    params.deps?.timeZone ?? "UTC",
                  )
                : baseDate;
              await tx
                .insert(schema.journeyDueActions)
                .values({
                  organizationId: ctx.orgId,
                  instanceId: instance.id,
                  stateId: targetState.id,
                  actionId: `__date_${t.id}`,
                  dueAt,
                  generation: instance.generation,
                })
                .onConflictDoNothing();
            }
          }
        }
      }
    }

    return {
      status: "completed",
      transitionId: transition.id,
      toStateId: targetState.id,
    };
  });
}

/**
 * Executes a scheduled due action or due deadline/date event from journey_due_actions (Scope 2 & 4).
 * Enforces generation match: actions with an old generation end 'skipped' with 'generation_mismatch'.
 */
export async function executeJourneyDueAction(
  ctx: OrgContext,
  params: ExecuteDueActionParams,
): Promise<ActionExecutionResult> {
  return withOrg(ctx, async (tx) => {
    // 0. Job fence validation
    if (params.jobFence) {
      if (params.jobFence.organizationId !== ctx.orgId) {
        return { status: "aborted", reason: "fence_tenant_mismatch" };
      }
      if (!params.jobFence.id || !params.jobFence.lockedBy || !params.jobFence.leaseToken) {
        return { status: "aborted", reason: "invalid_job_fence" };
      }
      if (params.deps?.jobQueue) {
        const stillLeased = await params.deps.jobQueue.renew(params.jobFence, 60000);
        if (!stillLeased) {
          return { status: "aborted", reason: "fence_lease_lost" };
        }
      }
    }

    // 1. Locate the due action row
    const conditions = [eq(schema.journeyDueActions.organizationId, ctx.orgId)];
    if (params.dueActionId) {
      conditions.push(eq(schema.journeyDueActions.id, params.dueActionId));
    } else if (params.instanceId && params.stateId && params.actionId && params.generation) {
      conditions.push(
        eq(schema.journeyDueActions.instanceId, params.instanceId),
        eq(schema.journeyDueActions.stateId, params.stateId),
        eq(schema.journeyDueActions.actionId, params.actionId),
        eq(schema.journeyDueActions.generation, params.generation),
      );
    } else {
      return { status: "aborted", reason: "insufficient_parameters" };
    }

    const [dueAction] = await tx
      .select()
      .from(schema.journeyDueActions)
      .where(and(...conditions));

    if (!dueAction) {
      return { status: "aborted", reason: "due_action_not_found" };
    }

    if (dueAction.outcome !== null) {
      return { status: "already_executed" };
    }

    // 2. Lock instance row FOR UPDATE
    const [instance] = await tx
      .select()
      .from(schema.journeyInstances)
      .where(
        and(
          eq(schema.journeyInstances.organizationId, ctx.orgId),
          eq(schema.journeyInstances.id, dueAction.instanceId),
        ),
      )
      .for("update");

    if (!instance) {
      await tx
        .update(schema.journeyDueActions)
        .set({
          outcome: "skipped",
          outcomeReason: "instance_not_found",
          executedAt: new Date(),
        })
        .where(
          and(
            eq(schema.journeyDueActions.organizationId, ctx.orgId),
            eq(schema.journeyDueActions.id, dueAction.id),
          ),
        );
      return {
        status: "skipped",
        actionId: dueAction.actionId,
        outcome: "skipped",
        reason: "instance_not_found",
      };
    }

    // 3. Generation check (Lifecycle rule: due actions with an old generation end skipped)
    if (instance.generation !== dueAction.generation) {
      await tx
        .update(schema.journeyDueActions)
        .set({
          outcome: "skipped",
          outcomeReason: "generation_mismatch",
          executedAt: new Date(),
        })
        .where(
          and(
            eq(schema.journeyDueActions.organizationId, ctx.orgId),
            eq(schema.journeyDueActions.id, dueAction.id),
          ),
        );
      return {
        status: "skipped",
        actionId: dueAction.actionId,
        outcome: "skipped",
        reason: "generation_mismatch",
      };
    }

    if (instance.status !== "active") {
      await tx
        .update(schema.journeyDueActions)
        .set({
          outcome: "skipped",
          outcomeReason: `instance_${instance.status}`,
          executedAt: new Date(),
        })
        .where(
          and(
            eq(schema.journeyDueActions.organizationId, ctx.orgId),
            eq(schema.journeyDueActions.id, dueAction.id),
          ),
        );
      return {
        status: "skipped",
        actionId: dueAction.actionId,
        outcome: "skipped",
        reason: `instance_${instance.status}`,
      };
    }

    if (instance.currentStateId !== dueAction.stateId) {
      await tx
        .update(schema.journeyDueActions)
        .set({
          outcome: "skipped",
          outcomeReason: "state_mismatch",
          executedAt: new Date(),
        })
        .where(
          and(
            eq(schema.journeyDueActions.organizationId, ctx.orgId),
            eq(schema.journeyDueActions.id, dueAction.id),
          ),
        );
      return {
        status: "skipped",
        actionId: dueAction.actionId,
        outcome: "skipped",
        reason: "state_mismatch",
      };
    }

    // 4. Check journey status
    const [journey] = await tx
      .select()
      .from(schema.journeys)
      .where(
        and(
          eq(schema.journeys.organizationId, ctx.orgId),
          eq(schema.journeys.id, instance.journeyId),
        ),
      );

    if (journey?.status !== "active") {
      await tx
        .update(schema.journeyDueActions)
        .set({
          outcome: "skipped",
          outcomeReason: "journey_inactive",
          executedAt: new Date(),
        })
        .where(
          and(
            eq(schema.journeyDueActions.organizationId, ctx.orgId),
            eq(schema.journeyDueActions.id, dueAction.id),
          ),
        );
      return {
        status: "skipped",
        actionId: dueAction.actionId,
        outcome: "skipped",
        reason: "journey_inactive",
      };
    }

    // 5. Load version definition
    const [version] = await tx
      .select()
      .from(schema.journeyVersions)
      .where(
        and(
          eq(schema.journeyVersions.organizationId, ctx.orgId),
          eq(schema.journeyVersions.id, instance.versionId),
        ),
      );

    if (!version) {
      return { status: "aborted", reason: "version_not_found" };
    }

    const states = (version.states as JourneyState[]) ?? [];
    const transitions = (version.transitions as JourneyTransition[]) ?? [];

    // 6. Handle Deadline Missed trigger
    if (dueAction.actionId === "__deadline__") {
      const deadlineTransition = transitions.find(
        (t) =>
          t.from === instance.currentStateId &&
          normalizeTriggerKind(t.trigger) === "deadline_missed",
      );

      if (deadlineTransition) {
        const transResult = await executeJourneyTransition(ctx, {
          instanceId: instance.id,
          transitionId: deadlineTransition.id,
          eventId: `deadline_${dueAction.id}`,
          generation: instance.generation,
          deps: params.deps,
        });

        await tx
          .update(schema.journeyDueActions)
          .set({
            outcome: transResult.status === "completed" ? "completed" : "skipped",
            outcomeReason: transResult.status === "completed" ? null : transResult.status,
            executedAt: new Date(),
          })
          .where(
            and(
              eq(schema.journeyDueActions.organizationId, ctx.orgId),
              eq(schema.journeyDueActions.id, dueAction.id),
            ),
          );

        return {
          status: "completed",
          actionId: dueAction.actionId,
          outcome: "completed",
          type: "deadline_missed",
        };
      }

      await tx
        .update(schema.journeyDueActions)
        .set({
          outcome: "completed",
          outcomeReason: "no_matching_transition",
          executedAt: new Date(),
        })
        .where(
          and(
            eq(schema.journeyDueActions.organizationId, ctx.orgId),
            eq(schema.journeyDueActions.id, dueAction.id),
          ),
        );

      return {
        status: "completed",
        actionId: dueAction.actionId,
        outcome: "completed",
        type: "deadline_missed",
      };
    }

    // 7. Handle Date Reached trigger
    if (dueAction.actionId.startsWith("__date_")) {
      const transId = dueAction.actionId.replace("__date_", "");
      const dateTransition = transitions.find(
        (t) => t.id === transId && t.from === instance.currentStateId,
      );

      if (dateTransition) {
        const transResult = await executeJourneyTransition(ctx, {
          instanceId: instance.id,
          transitionId: dateTransition.id,
          eventId: `date_${dueAction.id}`,
          generation: instance.generation,
          deps: params.deps,
        });

        await tx
          .update(schema.journeyDueActions)
          .set({
            outcome: transResult.status === "completed" ? "completed" : "skipped",
            outcomeReason: transResult.status === "completed" ? null : transResult.status,
            executedAt: new Date(),
          })
          .where(
            and(
              eq(schema.journeyDueActions.organizationId, ctx.orgId),
              eq(schema.journeyDueActions.id, dueAction.id),
            ),
          );

        return {
          status: "completed",
          actionId: dueAction.actionId,
          outcome: "completed",
          type: "date_reached",
        };
      }
    }

    // 8. Handle regular action
    const currentState = states.find((s) => s.id === dueAction.stateId);
    const action = currentState?.actions.find((a) => a.id === dueAction.actionId);

    if (!action) {
      await tx
        .update(schema.journeyDueActions)
        .set({
          outcome: "skipped",
          outcomeReason: "action_not_found",
          executedAt: new Date(),
        })
        .where(
          and(
            eq(schema.journeyDueActions.organizationId, ctx.orgId),
            eq(schema.journeyDueActions.id, dueAction.id),
          ),
        );
      return {
        status: "skipped",
        actionId: dueAction.actionId,
        outcome: "skipped",
        reason: "action_not_found",
      };
    }

    // Fetch target record
    let record: RecordData | null = null;
    try {
      const recordService =
        params.deps?.recordService ??
        createFixtureRecordService(ctx, {
          actor: {
            kind: "journey",
            id: instance.journeyId,
            versionId: instance.versionId,
            module: instance.recordModule,
          },
        });
      record = await recordService.get(instance.recordModule, instance.recordId);
    } catch {
      // Record deleted or inaccessible -> stop instance with generation bump
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
            eq(schema.journeyInstances.id, instance.id),
          ),
        );

      await tx
        .update(schema.journeyDueActions)
        .set({
          outcome: "skipped",
          outcomeReason: "record_missing",
          executedAt: new Date(),
        })
        .where(
          and(
            eq(schema.journeyDueActions.organizationId, ctx.orgId),
            eq(schema.journeyDueActions.id, dueAction.id),
          ),
        );

      return {
        status: "skipped",
        actionId: dueAction.actionId,
        outcome: "skipped",
        reason: "record_missing",
      };
    }

    const ownerId =
      record && typeof record.fields.Owner === "string" ? record.fields.Owner : ctx.userId;

    if (!record) {
      return { status: "aborted", reason: "record_missing" };
    }

    const effectResult = await executeActionEffect(
      tx,
      ctx,
      instance,
      action,
      record,
      ownerId,
      params.deps,
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
          eq(schema.journeyDueActions.id, dueAction.id),
        ),
      );

    if (effectResult.outcome === "skipped") {
      return {
        status: "skipped",
        actionId: dueAction.actionId,
        outcome: "skipped",
        reason: effectResult.outcomeReason ?? "unknown",
      };
    }

    return {
      status: "completed",
      actionId: dueAction.actionId,
      outcome: "completed",
    };
  });
}

export interface SweepDueJourneyActionsOptions {
  limit?: number;
  asOf?: Date;
  deps?: JourneysWorkerDeps;
  jobFence?: JobFence;
  jobQueue?: JobQueue;
}

/**
 * Sweeps due journey actions across all active journeys and instances.
 * Bounded batch: limit 200 per tick (ADR 0019).
 * Past-due actions after downtime run once, never back-filled.
 */
export async function sweepDueJourneyActions(
  ctx: OrgContext,
  options?: SweepDueJourneyActionsOptions,
): Promise<number> {
  const asOf = options?.asOf ?? new Date();
  const limit = Math.min(options?.limit ?? 200, 200);

  const dueRows = await withOrg(ctx, async (tx) => {
    return tx
      .select({
        id: schema.journeyDueActions.id,
        instanceId: schema.journeyDueActions.instanceId,
        stateId: schema.journeyDueActions.stateId,
        actionId: schema.journeyDueActions.actionId,
        generation: schema.journeyDueActions.generation,
      })
      .from(schema.journeyDueActions)
      .innerJoin(
        schema.journeyInstances,
        and(
          eq(schema.journeyInstances.organizationId, schema.journeyDueActions.organizationId),
          eq(schema.journeyInstances.id, schema.journeyDueActions.instanceId),
        ),
      )
      .innerJoin(
        schema.journeys,
        and(
          eq(schema.journeys.organizationId, schema.journeyInstances.organizationId),
          eq(schema.journeys.id, schema.journeyInstances.journeyId),
        ),
      )
      .where(
        and(
          eq(schema.journeyDueActions.organizationId, ctx.orgId),
          sql`${schema.journeyDueActions.outcome} IS NULL`,
          lte(schema.journeyDueActions.dueAt, asOf),
          eq(schema.journeyInstances.status, "active"),
          eq(schema.journeyInstances.generation, schema.journeyDueActions.generation),
          eq(schema.journeys.status, "active"),
        ),
      )
      .orderBy(schema.journeyDueActions.dueAt)
      .limit(limit);
  });

  const queue = options?.jobQueue ?? options?.deps?.jobQueue;
  if (queue) {
    let enqueuedCount = 0;
    for (const row of dueRows) {
      await queue.enqueue(
        { organizationId: ctx.orgId },
        {
          kind: JOURNEY_ACTION_JOB_KIND,
          payloadVersion: JOURNEY_ACTION_JOB_VERSION,
          payload: {
            dueActionId: row.id,
            instanceId: row.instanceId,
            stateId: row.stateId,
            actionId: row.actionId,
            journeyGeneration: String(row.generation),
          },
          idempotencyKey:
            `journey-act_${row.instanceId}_${row.stateId}_${row.actionId}_${row.generation}`.slice(
              0,
              128,
            ),
        },
      );
      enqueuedCount++;
    }
    return enqueuedCount;
  }

  let executedCount = 0;
  for (const row of dueRows) {
    const res = await executeJourneyDueAction(ctx, {
      dueActionId: row.id,
      instanceId: row.instanceId,
      stateId: row.stateId,
      actionId: row.actionId,
      generation: row.generation,
      jobFence: options?.jobFence,
      deps: options?.deps,
    });
    if (res.status === "completed" || res.status === "skipped") {
      executedCount++;
    }
  }

  return executedCount;
}

export interface JourneyHandlerContext {
  readonly organizationId: string;
  readonly job: Job;
  readonly fence: JobFence;
  readonly signal?: AbortSignal;
  checkpoint(): Promise<void>;
}

export function createJourneyTransitionHandler(deps: JourneysWorkerDeps) {
  if (!deps?.accessSnapshotProvider) {
    throw new Error("createJourneyTransitionHandler requires accessSnapshotProvider");
  }
  return {
    kind: JOURNEY_TRANSITION_JOB_KIND,
    version: JOURNEY_TRANSITION_JOB_VERSION,
    async isCurrent(c: JourneyHandlerContext): Promise<boolean> {
      const { instanceId, journeyGeneration } = c.job.payload;
      const gen = Number(journeyGeneration);
      if (!instanceId || Number.isNaN(gen)) return false;
      return withOrg(systemOrgContext(c.organizationId), async (tx) => {
        const [instance] = await tx
          .select({
            status: schema.journeyInstances.status,
            generation: schema.journeyInstances.generation,
            journeyId: schema.journeyInstances.journeyId,
          })
          .from(schema.journeyInstances)
          .where(
            and(
              eq(schema.journeyInstances.organizationId, c.organizationId),
              eq(schema.journeyInstances.id, instanceId),
            ),
          );
        if (instance?.status !== "active" || instance.generation !== gen) return false;
        const [journey] = await tx
          .select({ status: schema.journeys.status })
          .from(schema.journeys)
          .where(
            and(
              eq(schema.journeys.organizationId, c.organizationId),
              eq(schema.journeys.id, instance.journeyId),
            ),
          );
        return journey?.status === "active";
      });
    },
    async run(c: JourneyHandlerContext): Promise<void> {
      const { instanceId, transitionId, eventId, journeyGeneration } = c.job.payload;
      const gen = Number(journeyGeneration);
      if (!instanceId || !transitionId || !eventId || Number.isNaN(gen)) {
        throw new JobExecutionError({ code: "invalid_payload", retryable: false });
      }
      await c.checkpoint();
      try {
        const result = await executeJourneyTransition(systemOrgContext(c.organizationId), {
          instanceId,
          transitionId,
          eventId,
          generation: gen,
          jobFence: c.fence,
          deps,
        });
        if (result.status === "aborted" && result.reason === "fence_lease_lost") {
          throw new JobExecutionError({ code: "lease_expired", retryable: true });
        }
      } catch (err) {
        if (err instanceof JobExecutionError) throw err;
        throw new JobExecutionError({ code: "transient", retryable: true });
      }
    },
  };
}

export function createJourneyActionHandler(deps: JourneysWorkerDeps) {
  if (!deps?.accessSnapshotProvider) {
    throw new Error("createJourneyActionHandler requires accessSnapshotProvider");
  }
  return {
    kind: JOURNEY_ACTION_JOB_KIND,
    version: JOURNEY_ACTION_JOB_VERSION,
    async isCurrent(c: JourneyHandlerContext): Promise<boolean> {
      const { dueActionId, instanceId, journeyGeneration } = c.job.payload;
      const gen = Number(journeyGeneration);
      if (!instanceId || Number.isNaN(gen)) return false;
      return withOrg(systemOrgContext(c.organizationId), async (tx) => {
        if (dueActionId) {
          const [dueAction] = await tx
            .select({ outcome: schema.journeyDueActions.outcome })
            .from(schema.journeyDueActions)
            .where(
              and(
                eq(schema.journeyDueActions.organizationId, c.organizationId),
                eq(schema.journeyDueActions.id, dueActionId),
              ),
            );
          if (dueAction?.outcome !== null) return false;
        }
        const [instance] = await tx
          .select({
            status: schema.journeyInstances.status,
            generation: schema.journeyInstances.generation,
            journeyId: schema.journeyInstances.journeyId,
          })
          .from(schema.journeyInstances)
          .where(
            and(
              eq(schema.journeyInstances.organizationId, c.organizationId),
              eq(schema.journeyInstances.id, instanceId),
            ),
          );
        if (instance?.status !== "active" || instance.generation !== gen) return false;
        const [journey] = await tx
          .select({ status: schema.journeys.status })
          .from(schema.journeys)
          .where(
            and(
              eq(schema.journeys.organizationId, c.organizationId),
              eq(schema.journeys.id, instance.journeyId),
            ),
          );
        return journey?.status === "active";
      });
    },
    async run(c: JourneyHandlerContext): Promise<void> {
      const { dueActionId, instanceId, stateId, actionId, journeyGeneration } = c.job.payload;
      const gen = Number(journeyGeneration);
      await c.checkpoint();
      try {
        const result = await executeJourneyDueAction(systemOrgContext(c.organizationId), {
          dueActionId,
          instanceId,
          stateId,
          actionId,
          generation: gen,
          jobFence: c.fence,
          deps,
        });
        if (result.status === "aborted" && result.reason === "fence_lease_lost") {
          throw new JobExecutionError({ code: "lease_expired", retryable: true });
        }
      } catch (err) {
        if (err instanceof JobExecutionError) throw err;
        throw new JobExecutionError({ code: "transient", retryable: true });
      }
    },
  };
}

export function createJourneySweepHandler(deps?: JourneysWorkerDeps) {
  return {
    kind: JOURNEY_SWEEP_JOB_KIND,
    version: JOURNEY_SWEEP_JOB_VERSION,
    async isCurrent(): Promise<boolean> {
      return true;
    },
    async run(c: JourneyHandlerContext): Promise<void> {
      await c.checkpoint();
      const ctx = systemOrgContext(c.organizationId);
      await sweepDueJourneyActions(ctx, { deps, jobFence: c.fence });
    },
  };
}
