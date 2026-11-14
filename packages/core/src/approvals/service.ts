import { sql } from "drizzle-orm";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  RecordLockedForApprovalError,
  ValidationError,
} from "../errors";
import {
  getNotificationService,
  type NotificationKind,
  type NotificationService,
} from "../notifications";
import { decodeCursor, encodeCursor } from "../notifications/service";
import type { ModuleMetadataReader, RecordService } from "../records/contract";
import {
  type RecordWriteEvent,
  type RecordWriteObserver,
  WriteObserverFailure,
} from "../records/write-observer";
import { withOrg } from "../tenancy";
import type { OrgContext, Transaction } from "../tenancy/types";
import { matchesCondition } from "./criteria";
import { type ApproverDirectory, accessApproverDirectory } from "./directory";
import { mapProcess, ProcessService } from "./process-service";

export type { ApproverDirectory } from "./directory";

import { isAdmin, iso, isoOrNull, isUuid, pgCode, type Row, rowsOf } from "./shared";
import {
  type ActionKind,
  APPROVAL_OPEN_STATUSES,
  type ApprovalDetail,
  type ApprovalHistoryItem,
  type ApprovalListItem,
  type ApprovalProcess,
  type ApproverState,
  type DecisionAction,
  type DecisionInput,
  decisionSchema,
  type Page,
  type ProcessKind,
  type ProcessStep,
  type RequestStatus,
  type UserRef,
} from "./types";

export const APPROVAL_PAGE_SIZE = 20;
const OPEN = APPROVAL_OPEN_STATUSES as readonly string[];
const OPEN_SQL = sql.raw(`('${APPROVAL_OPEN_STATUSES.join("','")}')`);

export type SystemRecords = Pick<RecordService, "get" | "update"> & Partial<ModuleMetadataReader>;

export type ApprovalServiceDeps = {
  /** Record access for system-actor field updates; never wired to the write observer. */
  systemRecords?: (ctx: OrgContext) => SystemRecords;
  notifications?: NotificationService;
  directory?: ApproverDirectory;
};

type RequestRow = {
  id: string;
  processId: string;
  kind: ProcessKind;
  module: string;
  recordId: string;
  label: string;
  submitter: string;
  submittedAt: string;
  step: number;
  status: RequestStatus;
  decidedAt: string | null;
};

function mapRequest(row: Row): RequestRow {
  return {
    id: String(row.id),
    processId: String(row.process_id),
    kind: row.kind as ProcessKind,
    module: String(row.record_module),
    recordId: String(row.record_id),
    label: String(row.record_label ?? ""),
    submitter: String(row.submitter_user_id),
    submittedAt: iso(row.submitted_at),
    step: Number(row.current_step),
    status: row.status as RequestStatus,
    decidedAt: isoOrNull(row.decided_at),
  };
}

function ownerOf(fields: Readonly<Record<string, unknown>>): string | null {
  const owner = fields.Owner;
  if (typeof owner === "string") return owner;
  if (owner && typeof owner === "object" && "id" in owner)
    return String((owner as { id: unknown }).id);
  return null;
}

function listItem(row: Row): ApprovalListItem {
  const steps = (row.steps ?? []) as ProcessStep[];
  const step = Number(row.current_step);
  return {
    id: String(row.id),
    kind: row.kind as ProcessKind,
    processId: String(row.process_id),
    processName: String(row.process_name ?? ""),
    module: String(row.record_module),
    recordId: String(row.record_id),
    recordLabel: String(row.record_label ?? ""),
    step,
    stepName: steps[step - 1]?.name ?? "",
    status: row.status as RequestStatus,
    submitter: { id: String(row.submitter_user_id), name: String(row.submitter_name ?? "") },
    submittedAt: iso(row.submitted_at),
  };
}

const LIST_COLUMNS = sql`r.id, r.kind, r.process_id, p.name AS process_name, p.steps, r.record_module,
  r.record_id, r.record_label, r.current_step, r.status, r.submitter_user_id, su.name AS submitter_name,
  r.submitted_at`;
const LIST_JOINS = sql`FROM approval_requests r
  JOIN approval_processes p ON p.organization_id = r.organization_id AND p.id = r.process_id
  JOIN users su ON su.id = r.submitter_user_id`;

export class ApprovalService {
  readonly processes: ProcessService;
  private readonly notifications: NotificationService;
  private readonly directory: ApproverDirectory;

  constructor(private readonly deps: ApprovalServiceDeps = {}) {
    this.processes = new ProcessService(deps.systemRecords);
    this.notifications = deps.notifications ?? getNotificationService();
    this.directory = deps.directory ?? accessApproverDirectory;
  }

  // ---------------------------------------------------------------- record write path

  /** The generic observer for every module (ADR 0018 §5), bound to the writing user. */
  writeObserver(ctx: OrgContext): RecordWriteObserver {
    return {
      assertEditable: (input) => this.assertEditable(ctx, input.module, input.ids, input.operation),
      afterWrite: (event) => this.afterWrite(ctx, event),
    };
  }

  /** §4.5: an open approval locks edits except for administrators and current approvers. */
  async assertEditable(
    ctx: OrgContext,
    module: string,
    ids: readonly string[],
    operation: "update" | "delete",
  ): Promise<void> {
    if (ctx.role === "admin" || ids.length === 0) return;
    const locked = await withOrg(ctx, async (tx) => {
      const rows = rowsOf(
        await tx.execute(
          sql`SELECT r.id, r.current_step,
                EXISTS (SELECT 1 FROM approval_request_approvers a
                  WHERE a.organization_id = r.organization_id AND a.request_id = r.id
                    AND a.step = r.current_step AND a.user_id = ${ctx.userId} AND a.state = 'pending') AS is_approver
              FROM approval_requests r
              WHERE r.organization_id = ${ctx.orgId} AND r.kind = 'approval' AND r.status = 'pending'
                AND r.record_module = ${module} AND r.record_id = ANY(${pgTextArray(ids)}::text[])`,
        ),
      );
      if (rows.length === 0) return false;
      if (operation === "delete") return true;
      return rows.some((row) => !row.is_approver);
    });
    if (locked) throw new RecordLockedForApprovalError();
  }

  async afterWrite(ctx: OrgContext, event: RecordWriteEvent): Promise<void> {
    try {
      await withOrg(ctx, async (tx) => {
        const active = (await this.processes.activeProcesses(tx, ctx.orgId)).filter(
          (process) => process.module === event.module,
        );
        const existing = rowsOf(
          await tx.execute(
            sql`SELECT * FROM approval_requests
                WHERE organization_id = ${ctx.orgId} AND record_module = ${event.module}
                  AND record_id = ${event.record.id} AND status IN ${OPEN_SQL} FOR UPDATE`,
          ),
        )[0];
        if (existing) {
          await this.rearm(tx, ctx, mapRequest(existing), event);
          return;
        }
        const process = active.find(
          (candidate) =>
            (candidate.trigger === "create_or_edit" ||
              (candidate.trigger === "create") === (event.kind === "create")) &&
            matchesCondition(event.record.fields, candidate.criteria),
        );
        if (!process) return;
        await this.submit(tx, ctx, process, event);
      });
    } catch (error) {
      // A concurrent writer opened a request for this record first: nothing to do.
      if (pgCode(error) === "23505") return;
      // Fail closed (MEP-1518): the record service undoes a write whose request was not stored.
      throw new WriteObserverFailure("The approval request could not be submitted.", error);
    }
  }

  /** Review cycle: an edit by the owner (or submitter) after a rejection asks for a new review. */
  private async rearm(
    tx: Transaction,
    ctx: OrgContext,
    request: RequestRow,
    event: RecordWriteEvent,
  ): Promise<void> {
    if (request.kind !== "review" || request.status !== "waiting_rereview" || event.kind !== "edit")
      return;
    const owner = ownerOf(event.record.fields);
    if (ctx.userId !== owner && ctx.userId !== request.submitter) return;
    await tx.execute(
      sql`UPDATE approval_requests SET status = 'waiting_review', decided_at = NULL
          WHERE organization_id = ${ctx.orgId} AND id = ${request.id}`,
    );
    await tx.execute(
      sql`UPDATE approval_request_approvers SET state = 'pending'
          WHERE organization_id = ${ctx.orgId} AND request_id = ${request.id} AND step = ${request.step}
            AND state IN ('approved', 'rejected', 'skipped')`,
    );
    await this.logAction(
      tx,
      ctx.orgId,
      request.id,
      request.step,
      ctx.userId,
      "submitted",
      null,
      null,
    );
    const reviewers = rowsOf(
      await tx.execute(
        sql`SELECT user_id FROM approval_request_approvers
            WHERE organization_id = ${ctx.orgId} AND request_id = ${request.id}
              AND step = ${request.step} AND state = 'pending'`,
      ),
    ).map((row) => String(row.user_id));
    await this.notifications.notify(tx, ctx.orgId, {
      recipients: reviewers,
      kind: "review_assigned",
      subject: subjectOf(request),
      actorUserId: ctx.userId,
    });
  }

  private async submit(
    tx: Transaction,
    ctx: OrgContext,
    process: ApprovalProcess,
    event: RecordWriteEvent,
  ): Promise<void> {
    const status = process.kind === "review" ? "waiting_review" : "pending";
    const created = rowsOf(
      await tx.execute(
        sql`INSERT INTO approval_requests (organization_id, process_id, kind, record_module, record_id,
              record_label, submitter_user_id, current_step, status)
            VALUES (${ctx.orgId}, ${process.id}, ${process.kind}, ${event.module}, ${event.record.id},
              ${event.label.slice(0, 500)}, ${ctx.userId}, 1, ${status})
            RETURNING *`,
      ),
    )[0];
    if (!created) throw new Error("Request insert returned no row");
    const request = mapRequest(created);
    let resolutionError: string | null = null;
    let approvers: string[] = [];
    try {
      approvers = await this.resolveApprovers(tx, ctx.orgId, process.steps[0], event);
    } catch (error) {
      resolutionError = error instanceof Error ? error.message : "Approver resolution failed";
      console.error("Approval approver resolution failed", error);
    }
    // A step nobody can decide never approves itself (MEP-1518): it stays pending.
    if (!resolutionError && approvers.length === 0) resolutionError = noApprovers(1);
    await this.logAction(
      tx,
      ctx.orgId,
      request.id,
      1,
      ctx.userId,
      "submitted",
      resolutionError ? `resolution_error: ${resolutionError}`.slice(0, 500) : null,
      null,
    );
    // The request stays open with no approvers; administrators see it in the "All" scope.
    if (resolutionError) return;
    await this.openStep(tx, ctx, request, process, 1, approvers, ctx.userId);
  }

  private async resolveApprovers(
    tx: Transaction,
    orgId: string,
    step: ProcessStep | undefined,
    event: Pick<RecordWriteEvent, "record">,
  ): Promise<string[]> {
    if (!step) return [];
    const { kind, refs } = step.approvers;
    let ids: string[] = [];
    if (kind === "users") {
      const valid = refs.filter(isUuid);
      if (valid.length)
        ids = rowsOf(
          await tx.execute(
            sql`SELECT user_id FROM memberships WHERE organization_id = ${orgId}
                AND user_id = ANY(${pgTextArray(valid)}::uuid[])`,
          ),
        ).map((row) => String(row.user_id));
    } else if (kind === "roles") {
      const roles = refs.filter((ref) => ref === "admin" || ref === "member");
      if (roles.length)
        ids = rowsOf(
          await tx.execute(
            sql`SELECT user_id FROM memberships WHERE organization_id = ${orgId}
                AND role = ANY(${pgTextArray(roles)}::text[])`,
          ),
        ).map((row) => String(row.user_id));
    } else if (kind === "groups") {
      ids = await this.directory.groupMembers(tx, orgId, refs);
    } else {
      ids = await this.directory.ownerManagers(tx, orgId, ownerOf(event.record.fields));
    }
    return [...new Set(ids)];
  }

  /**
   * Moves the request to `step` and assigns its approvers. A step without approvers stays
   * pending with a resolution error for an administrator to recall; it never auto-approves.
   */
  private async openStep(
    tx: Transaction,
    ctx: OrgContext,
    request: RequestRow,
    process: ApprovalProcess,
    step: number,
    approvers: readonly string[],
    actorId: string,
  ): Promise<void> {
    await tx.execute(
      sql`UPDATE approval_requests SET current_step = ${step}
          WHERE organization_id = ${ctx.orgId} AND id = ${request.id}`,
    );
    const next = { ...request, step };
    if (approvers.length === 0) {
      await this.logAction(
        tx,
        ctx.orgId,
        request.id,
        step,
        null,
        "submitted",
        `resolution_error: ${noApprovers(step)}`,
        null,
      );
      return;
    }
    for (const userId of approvers) {
      await tx.execute(
        sql`INSERT INTO approval_request_approvers (organization_id, request_id, step, user_id)
            VALUES (${ctx.orgId}, ${request.id}, ${step}, ${userId})
            ON CONFLICT (organization_id, request_id, step, user_id) DO UPDATE SET state = 'pending'`,
      );
    }
    await this.notifications.notify(tx, ctx.orgId, {
      recipients: approvers,
      kind: process.kind === "review" ? "review_assigned" : "approval_assigned",
      subject: subjectOf(next),
      actorUserId: actorId,
    });
  }

  private async finalize(
    tx: Transaction,
    ctx: OrgContext,
    request: RequestRow,
    process: ApprovalProcess,
    outcome: "approved" | "rejected",
    actorId: string | null,
  ): Promise<void> {
    const status =
      outcome === "approved"
        ? "approved"
        : process.kind === "review"
          ? "waiting_rereview"
          : "rejected";
    await tx.execute(
      sql`UPDATE approval_requests SET status = ${status},
            decided_at = ${status === "waiting_rereview" ? null : sql`now()`}
          WHERE organization_id = ${ctx.orgId} AND id = ${request.id}`,
    );
    const updates = outcome === "approved" ? process.onApprove : process.onReject;
    if (updates.length > 0) await this.applyFieldUpdates(ctx, request, updates);
    await this.notifications.notify(tx, ctx.orgId, {
      recipients: [request.submitter],
      kind: process.kind === "review" ? "review_decided" : "approval_decided",
      subject: { ...subjectOf(request), outcome },
      actorUserId: actorId,
    });
  }

  /** On-approve and on-reject updates run as the system actor, never through the write observer. */
  private async applyFieldUpdates(
    ctx: OrgContext,
    request: RequestRow,
    updates: ApprovalProcess["onApprove"],
  ): Promise<void> {
    const records = this.deps.systemRecords?.(ctx);
    if (!records) return;
    const input = Object.fromEntries(updates.map((update) => [update.field, update.value]));
    try {
      await records.update(request.module, request.recordId, input);
    } catch (error) {
      // A record deleted while its request was open leaves nothing to update.
      if (!(error instanceof NotFoundError)) throw error;
    }
  }

  private async logAction(
    tx: Transaction,
    orgId: string,
    requestId: string,
    step: number,
    actor: string | null,
    action: ActionKind,
    comment: string | null,
    target: string | null,
  ): Promise<void> {
    await tx.execute(
      sql`INSERT INTO approval_actions (organization_id, request_id, step, actor_user_id, action, comment, target_user_id)
          VALUES (${orgId}, ${requestId}, ${step}, ${actor}, ${action}, ${comment}, ${target})`,
    );
  }

  // ---------------------------------------------------------------- queue

  async counts(
    ctx: OrgContext,
  ): Promise<Record<"blueprint" | "approval" | "review" | "image_validation", number>> {
    return withOrg(ctx, async (tx) => {
      const rows = rowsOf(
        await tx.execute(
          sql`SELECT r.kind, count(*)::int AS n
              FROM approval_request_approvers a
              JOIN approval_requests r ON r.organization_id = a.organization_id AND r.id = a.request_id
              WHERE a.organization_id = ${ctx.orgId} AND a.user_id = ${ctx.userId}
                AND a.state = 'pending' AND a.step = r.current_step AND r.status IN ${OPEN_SQL}
                AND r.status <> 'waiting_rereview'
              GROUP BY r.kind`,
        ),
      );
      const count = (kind: string) => Number(rows.find((row) => row.kind === kind)?.n ?? 0);
      return {
        blueprint: 0,
        approval: count("approval"),
        review: count("review"),
        image_validation: 0,
      };
    });
  }

  async listQueue(
    ctx: OrgContext,
    params: {
      type: string;
      status?: string | undefined;
      module?: string | undefined;
      scope?: string | undefined;
      cursor?: string | undefined;
      limit?: number | undefined;
    },
  ): Promise<Page<ApprovalListItem>> {
    if (params.type === "blueprint" || params.type === "image_validation")
      return { items: [], nextCursor: null };
    if (params.type !== "approval" && params.type !== "review")
      throw new ValidationError({
        type: ["Choose approval, review, blueprint or image_validation."],
      });
    const status = params.status ?? "pending";
    if (status !== "pending" && status !== "decided")
      throw new ValidationError({ status: ["Choose pending or decided."] });
    const scope = params.scope ?? "mine";
    if (scope !== "mine" && scope !== "all")
      throw new ValidationError({ scope: ["Choose mine or all."] });
    const limit = Math.min(Math.max(params.limit ?? APPROVAL_PAGE_SIZE, 1), 50);
    const after = params.cursor ? decodeCursor(params.cursor) : null;
    return withOrg(ctx, async (tx) => {
      if (scope === "all" && !(await isAdmin(tx, ctx))) throw new ForbiddenError();
      const mine = sql`EXISTS (SELECT 1 FROM approval_request_approvers a
          WHERE a.organization_id = r.organization_id AND a.request_id = r.id AND a.user_id = ${ctx.userId}
            AND ${status === "pending" ? sql`a.state = 'pending' AND a.step = r.current_step AND r.status <> 'waiting_rereview'` : sql`a.state IN ('approved', 'rejected', 'delegated')`})`;
      const rows = rowsOf(
        await tx.execute(
          sql`SELECT ${LIST_COLUMNS} ${LIST_JOINS}
              WHERE r.organization_id = ${ctx.orgId} AND r.kind = ${params.type}
                AND ${status === "pending" ? sql`r.status IN ${OPEN_SQL}` : sql`(r.status NOT IN ${OPEN_SQL} OR ${scope === "mine" ? sql`true` : sql`false`})`}
                AND ${scope === "mine" ? mine : sql`true`}
                ${params.module ? sql`AND r.record_module = ${params.module}` : sql``}
                ${after ? sql`AND (r.submitted_at, r.id) < (${after[0]}::timestamptz, ${after[1]}::uuid)` : sql``}
              ORDER BY r.submitted_at DESC, r.id DESC LIMIT ${limit + 1}`,
        ),
      );
      const page = rows.slice(0, limit);
      const last = page.at(-1);
      return {
        items: page.map(listItem),
        nextCursor:
          rows.length > limit && last
            ? encodeCursor(iso(last.submitted_at), String(last.id))
            : null,
      };
    });
  }

  /** The viewer's relation to a request, or null when they must not know it exists. */
  private async relation(
    tx: Transaction,
    ctx: OrgContext,
    request: RequestRow,
  ): Promise<{ pending: boolean; involved: boolean; admin: boolean } | null> {
    const admin = await isAdmin(tx, ctx);
    const rows = rowsOf(
      await tx.execute(
        sql`SELECT step, state FROM approval_request_approvers
            WHERE organization_id = ${ctx.orgId} AND request_id = ${request.id} AND user_id = ${ctx.userId}`,
      ),
    );
    const pending = rows.some(
      (row) => row.state === "pending" && Number(row.step) === request.step,
    );
    const involved = rows.length > 0 || request.submitter === ctx.userId;
    if (!admin && !involved) return null;
    return { pending, involved, admin };
  }

  private async loadRequest(
    tx: Transaction,
    ctx: OrgContext,
    id: string,
    lock = false,
  ): Promise<RequestRow> {
    if (!isUuid(id)) throw new NotFoundError();
    const row = rowsOf(
      await tx.execute(
        sql`SELECT * FROM approval_requests WHERE organization_id = ${ctx.orgId} AND id = ${id} ${lock ? sql`FOR UPDATE` : sql``}`,
      ),
    )[0];
    if (!row) throw new NotFoundError();
    return mapRequest(row);
  }

  /** Being a current approver grants read of the record for the life of the request (§4.3). */
  async hasApproverGrant(ctx: OrgContext, module: string, recordId: string): Promise<boolean> {
    return withOrg(ctx, async (tx) => {
      const rows = await tx.execute(
        sql`SELECT 1 FROM approval_requests r
            JOIN approval_request_approvers a ON a.organization_id = r.organization_id
              AND a.request_id = r.id AND a.step = r.current_step
            WHERE r.organization_id = ${ctx.orgId} AND r.record_module = ${module}
              AND r.record_id = ${recordId} AND r.status IN ${OPEN_SQL}
              AND a.user_id = ${ctx.userId} AND a.state = 'pending' LIMIT 1`,
      );
      return rows.rows.length > 0;
    });
  }

  async detail(ctx: OrgContext, id: string): Promise<ApprovalDetail> {
    const loaded = await withOrg(ctx, async (tx) => {
      const request = await this.loadRequest(tx, ctx, id);
      const relation = await this.relation(tx, ctx, request);
      if (!relation) throw new NotFoundError();
      const header = rowsOf(
        await tx.execute(
          sql`SELECT ${LIST_COLUMNS}, p.review_fields, p.steps AS process_steps ${LIST_JOINS}
              WHERE r.organization_id = ${ctx.orgId} AND r.id = ${id}`,
        ),
      )[0];
      if (!header) throw new NotFoundError();
      const approvers = rowsOf(
        await tx.execute(
          sql`SELECT a.step, a.user_id, u.name, a.state, a.delegated_from_user_id, d.name AS delegated_name
              FROM approval_request_approvers a JOIN users u ON u.id = a.user_id
              LEFT JOIN users d ON d.id = a.delegated_from_user_id
              WHERE a.organization_id = ${ctx.orgId} AND a.request_id = ${id}
              ORDER BY a.step, u.name, a.user_id`,
        ),
      );
      const actions = rowsOf(
        await tx.execute(
          sql`SELECT x.id, x.step, x.action, x.comment, x.acted_at, x.actor_user_id, au.name AS actor_name,
                x.target_user_id, tu.name AS target_name
              FROM approval_actions x LEFT JOIN users au ON au.id = x.actor_user_id
              LEFT JOIN users tu ON tu.id = x.target_user_id
              WHERE x.organization_id = ${ctx.orgId} AND x.request_id = ${id}
              ORDER BY x.acted_at, x.id`,
        ),
      );
      return { request, relation, header, approvers, actions };
    });
    const { request, relation, header, approvers, actions } = loaded;
    const steps = (header.process_steps ?? []) as ProcessStep[];
    const open = OPEN.includes(request.status);
    return {
      request: {
        ...listItem(header),
        decidedAt: request.decidedAt,
        stepCount: steps.length,
      },
      record: await this.recordSummary(ctx, request, (header.review_fields ?? []) as string[]),
      steps: steps.map((step, index) => ({
        step: index + 1,
        name: step.name,
        rule: step.rule,
        approvers: approvers
          .filter((row) => Number(row.step) === index + 1)
          .map((row) => ({
            id: String(row.user_id),
            name: String(row.name ?? ""),
            state: row.state as ApproverState,
            delegatedFrom: row.delegated_from_user_id
              ? { id: String(row.delegated_from_user_id), name: String(row.delegated_name ?? "") }
              : null,
          })),
      })),
      actions: actions.map((row) => ({
        id: String(row.id),
        step: Number(row.step),
        action: row.action as ActionKind,
        actor: userRef(row.actor_user_id, row.actor_name),
        target: userRef(row.target_user_id, row.target_name),
        comment: row.comment ? String(row.comment) : null,
        actedAt: iso(row.acted_at),
      })),
      permissions: {
        canDecide: open && relation.pending && request.status !== "waiting_rereview",
        canRecall: open && (relation.admin || request.submitter === ctx.userId),
      },
    };
  }

  /** The approver's scoped read: only the business card fields (approval) or the review fields. */
  private async recordSummary(
    ctx: OrgContext,
    request: RequestRow,
    reviewFields: readonly string[],
  ): Promise<ApprovalDetail["record"]> {
    const records = this.deps.systemRecords?.(ctx);
    if (!records) return null;
    try {
      const record = await records.get(request.module, request.recordId);
      let names: readonly string[] = reviewFields;
      if (request.kind === "approval") {
        const projection = await records.getModuleProjection?.(request.module);
        names = projection?.businessCardFields ?? Object.keys(record.fields).slice(0, 8);
      }
      const fields: Record<string, unknown> = {};
      for (const name of names) if (name in record.fields) fields[name] = record.fields[name];
      return { module: request.module, id: request.recordId, label: request.label, fields };
    } catch (error) {
      if (error instanceof NotFoundError) return null;
      throw error;
    }
  }

  // ---------------------------------------------------------------- decisions

  async decide(
    ctx: OrgContext,
    id: string,
    action: DecisionAction,
    rawInput: DecisionInput = {},
  ): Promise<ApprovalDetail> {
    const parsed = decisionSchema.safeParse(rawInput);
    if (!parsed.success) throw new ValidationError({ body: ["Send a valid decision."] });
    const input = parsed.data;
    await withOrg(ctx, async (tx) => {
      const request = await this.loadRequest(tx, ctx, id, true);
      const relation = await this.relation(tx, ctx, request);
      if (!relation) throw new NotFoundError();
      if (!OPEN.includes(request.status))
        throw new ConflictError("This request is already closed.");
      const process = await this.loadProcess(tx, ctx, request.processId);
      const comment = input.comment ? input.comment : null;
      if (action === "recall") {
        if (!relation.admin && request.submitter !== ctx.userId) throw new ForbiddenError();
        await tx.execute(
          sql`UPDATE approval_request_approvers SET state = 'skipped'
              WHERE organization_id = ${ctx.orgId} AND request_id = ${id} AND state = 'pending'`,
        );
        await tx.execute(
          sql`UPDATE approval_requests SET status = 'recalled', decided_at = now()
              WHERE organization_id = ${ctx.orgId} AND id = ${id}`,
        );
        await this.logAction(
          tx,
          ctx.orgId,
          id,
          request.step,
          ctx.userId,
          "recalled",
          comment,
          null,
        );
        return;
      }
      if (request.status === "waiting_rereview")
        throw new ConflictError("This item waits for the record owner to edit it again.");
      if (!relation.pending) throw new ForbiddenError();
      const step = process.steps[request.step - 1];
      if (!step) throw new ConflictError("The process no longer has this step.");

      if (action === "delegate") {
        const target = input.targetUserId;
        if (!target) throw new ValidationError({ targetUserId: ["Choose a user to delegate to."] });
        if (target === ctx.userId)
          throw new ValidationError({ targetUserId: ["Choose another user."] });
        const member = await tx.execute(
          sql`SELECT 1 FROM memberships WHERE organization_id = ${ctx.orgId} AND user_id = ${target}`,
        );
        if (member.rows.length === 0)
          throw new ValidationError({ targetUserId: ["Choose a member of this organization."] });
        const already = await tx.execute(
          sql`SELECT 1 FROM approval_request_approvers
              WHERE organization_id = ${ctx.orgId} AND request_id = ${id} AND step = ${request.step}
                AND user_id = ${target} AND state = 'pending'`,
        );
        if (already.rows.length > 0)
          throw new ValidationError({ targetUserId: ["This user is already an approver."] });
        await tx.execute(
          sql`UPDATE approval_request_approvers SET state = 'delegated'
              WHERE organization_id = ${ctx.orgId} AND request_id = ${id} AND step = ${request.step}
                AND user_id = ${ctx.userId}`,
        );
        await tx.execute(
          sql`INSERT INTO approval_request_approvers
                (organization_id, request_id, step, user_id, state, delegated_from_user_id)
              VALUES (${ctx.orgId}, ${id}, ${request.step}, ${target}, 'pending', ${ctx.userId})
              ON CONFLICT (organization_id, request_id, step, user_id)
              DO UPDATE SET state = 'pending', delegated_from_user_id = ${ctx.userId}`,
        );
        await this.logAction(
          tx,
          ctx.orgId,
          id,
          request.step,
          ctx.userId,
          "delegated",
          comment,
          target,
        );
        await this.notifications.notify(tx, ctx.orgId, {
          recipients: [target],
          kind: assignedKind(request.kind),
          subject: subjectOf(request),
          actorUserId: ctx.userId,
        });
        return;
      }

      if (action === "reject" && !comment)
        throw new ValidationError({ comment: ["A comment is required to reject."] });
      const decided: ApproverState = action === "approve" ? "approved" : "rejected";
      await tx.execute(
        sql`UPDATE approval_request_approvers SET state = ${decided}
            WHERE organization_id = ${ctx.orgId} AND request_id = ${id} AND step = ${request.step}
              AND user_id = ${ctx.userId}`,
      );
      await this.logAction(
        tx,
        ctx.orgId,
        id,
        request.step,
        ctx.userId,
        action === "approve" ? "approved" : "rejected",
        comment,
        null,
      );
      const remaining = Number(
        rowsOf(
          await tx.execute(
            sql`SELECT count(*)::int AS n FROM approval_request_approvers
                WHERE organization_id = ${ctx.orgId} AND request_id = ${id} AND step = ${request.step}
                  AND state = 'pending'`,
          ),
        )[0]?.n ?? 0,
      );
      const stepDone = action === "reject" || step.rule === "any" || remaining === 0;
      if (!stepDone) return;
      await tx.execute(
        sql`UPDATE approval_request_approvers SET state = 'skipped'
            WHERE organization_id = ${ctx.orgId} AND request_id = ${id} AND step = ${request.step}
              AND state = 'pending'`,
      );
      if (action === "reject") {
        await this.finalize(tx, ctx, request, process, "rejected", ctx.userId);
      } else if (request.step >= process.steps.length) {
        await this.finalize(tx, ctx, request, process, "approved", ctx.userId);
      } else {
        const record = await this.currentRecord(ctx, request);
        const following = await this.resolveApprovers(tx, ctx.orgId, process.steps[request.step], {
          record,
        });
        await this.openStep(tx, ctx, request, process, request.step + 1, following, ctx.userId);
      }
    });
    return this.detail(ctx, id);
  }

  private async currentRecord(
    ctx: OrgContext,
    request: RequestRow,
  ): Promise<RecordWriteEvent["record"]> {
    try {
      const record = await this.deps.systemRecords?.(ctx).get(request.module, request.recordId);
      if (record) return record;
    } catch (error) {
      if (!(error instanceof NotFoundError)) throw error;
    }
    return { id: request.recordId, fields: {} };
  }

  private async loadProcess(
    tx: Transaction,
    ctx: OrgContext,
    id: string,
  ): Promise<ApprovalProcess> {
    const row = rowsOf(
      await tx.execute(
        sql`SELECT * FROM approval_processes WHERE organization_id = ${ctx.orgId} AND id = ${id}`,
      ),
    )[0];
    if (!row) throw new NotFoundError();
    return mapProcess(row);
  }

  // ---------------------------------------------------------------- history

  private historyFilters(
    ctx: OrgContext,
    admin: boolean,
    params: {
      type?: string | undefined;
      module?: string | undefined;
      user?: string | undefined;
      action?: string | undefined;
      from?: string | undefined;
      to?: string | undefined;
    },
  ) {
    for (const [name, value] of [
      ["from", params.from],
      ["to", params.to],
    ] as const) {
      if (value !== undefined && Number.isNaN(Date.parse(value)))
        throw new ValidationError({ [name]: ["Send an ISO date."] });
    }
    if (params.user !== undefined && !isUuid(params.user))
      throw new ValidationError({ user: ["Send a user id."] });
    if (params.type !== undefined && params.type !== "approval" && params.type !== "review")
      throw new ValidationError({ type: ["Choose approval or review."] });
    return sql`${
      admin
        ? sql`true`
        : sql`(r.submitter_user_id = ${ctx.userId} OR EXISTS (
        SELECT 1 FROM approval_request_approvers v WHERE v.organization_id = r.organization_id
          AND v.request_id = r.id AND v.user_id = ${ctx.userId}))`
    }
      ${params.type ? sql`AND r.kind = ${params.type}` : sql``}
      ${params.module ? sql`AND r.record_module = ${params.module}` : sql``}
      ${params.user ? sql`AND x.actor_user_id = ${params.user}` : sql``}
      ${params.action ? sql`AND x.action = ${params.action}` : sql``}
      ${params.from ? sql`AND x.acted_at >= ${params.from}::timestamptz` : sql``}
      ${params.to ? sql`AND x.acted_at <= ${params.to}::timestamptz` : sql``}`;
  }

  async history(
    ctx: OrgContext,
    params: {
      type?: string | undefined;
      module?: string | undefined;
      user?: string | undefined;
      action?: string | undefined;
      from?: string | undefined;
      to?: string | undefined;
      cursor?: string | undefined;
      limit?: number | undefined;
    },
  ): Promise<Page<ApprovalHistoryItem>> {
    const limit = Math.min(Math.max(params.limit ?? APPROVAL_PAGE_SIZE, 1), 50);
    const after = params.cursor ? decodeCursor(params.cursor) : null;
    return withOrg(ctx, async (tx) => {
      const where = this.historyFilters(ctx, await isAdmin(tx, ctx), params);
      const rows = rowsOf(
        await tx.execute(
          sql`SELECT x.id, x.request_id, x.step, x.action, x.comment, x.acted_at, r.kind, r.record_module,
                r.record_id, r.record_label, p.name AS process_name,
                x.actor_user_id, au.name AS actor_name, x.target_user_id, tu.name AS target_name
              FROM approval_actions x
              JOIN approval_requests r ON r.organization_id = x.organization_id AND r.id = x.request_id
              JOIN approval_processes p ON p.organization_id = r.organization_id AND p.id = r.process_id
              LEFT JOIN users au ON au.id = x.actor_user_id
              LEFT JOIN users tu ON tu.id = x.target_user_id
              WHERE x.organization_id = ${ctx.orgId} AND ${where}
                ${after ? sql`AND (x.acted_at, x.id) < (${after[0]}::timestamptz, ${after[1]}::uuid)` : sql``}
              ORDER BY x.acted_at DESC, x.id DESC LIMIT ${limit + 1}`,
        ),
      );
      const page = rows.slice(0, limit);
      const last = page.at(-1);
      return {
        items: page.map((row) => ({
          id: String(row.id),
          requestId: String(row.request_id),
          kind: row.kind as ProcessKind,
          module: String(row.record_module),
          recordId: String(row.record_id),
          recordLabel: String(row.record_label ?? ""),
          processName: String(row.process_name),
          step: Number(row.step),
          action: row.action as ActionKind,
          actor: userRef(row.actor_user_id, row.actor_name),
          target: userRef(row.target_user_id, row.target_name),
          comment: row.comment ? String(row.comment) : null,
          actedAt: iso(row.acted_at),
        })),
        nextCursor:
          rows.length > limit && last ? encodeCursor(iso(last.acted_at), String(last.id)) : null,
      };
    });
  }

  async historyMeta(ctx: OrgContext): Promise<{
    types: string[];
    actions: ActionKind[];
    modules: string[];
    users: UserRef[];
  }> {
    return withOrg(ctx, async (tx) => {
      const where = this.historyFilters(ctx, await isAdmin(tx, ctx), {});
      const rows = rowsOf(
        await tx.execute(
          sql`SELECT DISTINCT r.record_module, x.actor_user_id, au.name AS actor_name
              FROM approval_actions x
              JOIN approval_requests r ON r.organization_id = x.organization_id AND r.id = x.request_id
              LEFT JOIN users au ON au.id = x.actor_user_id
              WHERE x.organization_id = ${ctx.orgId} AND ${where}`,
        ),
      );
      const users = new Map<string, UserRef>();
      for (const row of rows) {
        const ref = userRef(row.actor_user_id, row.actor_name);
        if (ref) users.set(ref.id, ref);
      }
      return {
        types: ["approval", "review"],
        actions: ["submitted", "approved", "rejected", "delegated", "recalled", "auto_approved"],
        modules: [...new Set(rows.map((row) => String(row.record_module)))].sort(),
        users: [...users.values()].sort((a, b) => a.name.localeCompare(b.name)),
      };
    });
  }
}

function noApprovers(step: number): string {
  return `No approver could be resolved for step ${step}.`;
}

function userRef(id: unknown, name: unknown): UserRef | null {
  return id ? { id: String(id), name: String(name ?? "") } : null;
}

function assignedKind(kind: ProcessKind): NotificationKind {
  return kind === "review" ? "review_assigned" : "approval_assigned";
}

function subjectOf(request: Pick<RequestRow, "id" | "module" | "recordId">) {
  return { requestId: request.id, recordModule: request.module, recordId: request.recordId };
}

/** A Postgres array literal built from validated scalars, safe to cast with a type suffix. */
function pgTextArray(values: readonly string[]) {
  const literal = `{${values.map((value) => `"${value.replace(/[\\"]/g, "\\$&")}"`).join(",")}}`;
  return sql`${literal}`;
}

let shared: ApprovalService | undefined;
export function configureApprovalService(deps: ApprovalServiceDeps): ApprovalService {
  shared = new ApprovalService(deps);
  return shared;
}
export function getApprovalService(deps?: ApprovalServiceDeps): ApprovalService {
  shared ??= new ApprovalService(deps);
  return shared;
}
