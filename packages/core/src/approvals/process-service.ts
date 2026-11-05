import { sql } from "drizzle-orm";
import type { z } from "zod";
import { ConflictError, NotFoundError, ValidationError } from "../errors";
import type { ModuleMetadataReader } from "../records/contract";
import { withOrg } from "../tenancy";
import type { OrgContext, Transaction } from "../tenancy/types";
import { iso, isUuid, nameConflict, pgCode, type Row, requireProcessAdmin, rowsOf } from "./shared";
import {
  type ApprovalProcess,
  type CreateProcessInput,
  createProcessSchema,
  type ProcessKind,
  type UpdateProcessInput,
  updateProcessSchema,
} from "./types";

export function mapProcess(row: Row): ApprovalProcess {
  return {
    id: String(row.id),
    kind: row.kind as ProcessKind,
    name: String(row.name),
    module: String(row.module),
    trigger: row.trigger as ApprovalProcess["trigger"],
    criteria: row.criteria as ApprovalProcess["criteria"],
    steps: row.steps as ApprovalProcess["steps"],
    reviewFields: row.review_fields as string[],
    onApprove: row.on_approve as ApprovalProcess["onApprove"],
    onReject: row.on_reject as ApprovalProcess["onReject"],
    active: Boolean(row.active),
    position: Number(row.position),
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
  };
}

function parseInput<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (result.success) return result.data;
  const fields: Record<string, string[]> = {};
  for (const issue of result.error.issues) {
    const key = issue.path.length ? issue.path.map(String).join(".") : "body";
    fields[key] = [...(fields[key] ?? []), issue.message];
  }
  throw new ValidationError(fields);
}

type CacheEntry = { version: string; processes: ApprovalProcess[] };

/**
 * Process definitions (setup) and the per-organization cache of active processes.
 * The cache key is a version read from the table (row count and newest update), so
 * every process write invalidates it on every server instance.
 */
export class ProcessService {
  private readonly cache = new Map<string, CacheEntry>();

  constructor(private readonly metadata?: (ctx: OrgContext) => Partial<ModuleMetadataReader>) {}

  async activeProcesses(tx: Transaction, orgId: string): Promise<ApprovalProcess[]> {
    const versionRows = rowsOf(
      await tx.execute(
        sql`SELECT count(*)::int AS n, max(updated_at) AS newest FROM approval_processes WHERE organization_id = ${orgId}`,
      ),
    );
    const row = versionRows[0];
    const version = `${row?.n ?? 0}:${row?.newest ? iso(row.newest) : ""}`;
    const hit = this.cache.get(orgId);
    if (hit && hit.version === version) return hit.processes;
    const processes = rowsOf(
      await tx.execute(
        sql`SELECT * FROM approval_processes WHERE organization_id = ${orgId} AND active
            ORDER BY position, created_at, id`,
      ),
    ).map(mapProcess);
    this.cache.set(orgId, { version, processes });
    return processes;
  }

  clearCache(): void {
    this.cache.clear();
  }

  async list(ctx: OrgContext, kind: ProcessKind): Promise<ApprovalProcess[]> {
    return withOrg(ctx, async (tx) => {
      await requireProcessAdmin(tx, ctx);
      const result = await tx.execute(
        sql`SELECT * FROM approval_processes WHERE organization_id = ${ctx.orgId} AND kind = ${kind}
            ORDER BY position, created_at, id`,
      );
      return rowsOf(result).map(mapProcess);
    });
  }

  async get(ctx: OrgContext, kind: ProcessKind, id: string): Promise<ApprovalProcess> {
    if (!isUuid(id)) throw new NotFoundError();
    return withOrg(ctx, async (tx) => {
      await requireProcessAdmin(tx, ctx);
      return this.load(tx, ctx, kind, id);
    });
  }

  private async load(
    tx: Transaction,
    ctx: OrgContext,
    kind: ProcessKind,
    id: string,
  ): Promise<ApprovalProcess> {
    const row = rowsOf(
      await tx.execute(
        sql`SELECT * FROM approval_processes
            WHERE organization_id = ${ctx.orgId} AND kind = ${kind} AND id = ${id}`,
      ),
    )[0];
    if (!row) throw new NotFoundError();
    return mapProcess(row);
  }

  private async assertModule(ctx: OrgContext, module: string): Promise<void> {
    const reader = this.metadata?.(ctx);
    if (!reader?.getModuleProjection) return;
    try {
      await reader.getModuleProjection(module);
    } catch {
      throw new ValidationError({ module: ["Choose an existing module."] });
    }
  }

  private shape(
    kind: ProcessKind,
    value: {
      steps: unknown[];
      reviewFields: string[];
      onApprove: unknown[];
      onReject: unknown[];
    },
  ): void {
    if (kind === "review") {
      if (value.steps.length !== 1)
        throw new ValidationError({ steps: ["A review process has exactly one reviewer step."] });
      if (value.reviewFields.length === 0)
        throw new ValidationError({ reviewFields: ["Choose at least one field to review."] });
    } else if (value.reviewFields.length > 0) {
      throw new ValidationError({ reviewFields: ["Only review processes list review fields."] });
    }
  }

  async create(
    ctx: OrgContext,
    kind: ProcessKind,
    rawInput: CreateProcessInput,
  ): Promise<ApprovalProcess> {
    const input = parseInput(createProcessSchema, rawInput);
    this.shape(kind, input);
    await this.assertModule(ctx, input.module);
    try {
      return await withOrg(ctx, async (tx) => {
        await requireProcessAdmin(tx, ctx);
        const row = rowsOf(
          await tx.execute(
            sql`INSERT INTO approval_processes (organization_id, kind, name, module, trigger, criteria,
                  steps, review_fields, on_approve, on_reject, active, position, created_by, updated_by)
                VALUES (${ctx.orgId}, ${kind}, ${input.name}, ${input.module}, ${input.trigger},
                  ${JSON.stringify(input.criteria)}::jsonb, ${JSON.stringify(input.steps)}::jsonb,
                  ${JSON.stringify(input.reviewFields)}::jsonb, ${JSON.stringify(input.onApprove)}::jsonb,
                  ${JSON.stringify(input.onReject)}::jsonb, false,
                  (SELECT COALESCE(max(position) + 1, 0) FROM approval_processes
                    WHERE organization_id = ${ctx.orgId} AND kind = ${kind}),
                  ${ctx.userId}, ${ctx.userId})
                RETURNING *`,
          ),
        )[0];
        if (!row) throw new Error("Process insert returned no row");
        return mapProcess(row);
      });
    } catch (error) {
      if (pgCode(error) === "23505") throw nameConflict();
      throw error;
    }
  }

  async update(
    ctx: OrgContext,
    kind: ProcessKind,
    id: string,
    rawInput: UpdateProcessInput,
  ): Promise<ApprovalProcess> {
    if (!isUuid(id)) throw new NotFoundError();
    const input = parseInput(updateProcessSchema, rawInput);
    if (input.module) await this.assertModule(ctx, input.module);
    try {
      return await withOrg(ctx, async (tx) => {
        await requireProcessAdmin(tx, ctx);
        const current = await this.load(tx, ctx, kind, id);
        const next = {
          name: input.name ?? current.name,
          module: input.module ?? current.module,
          trigger: input.trigger ?? current.trigger,
          criteria: input.criteria ?? current.criteria,
          steps: input.steps ?? current.steps,
          reviewFields: input.reviewFields ?? current.reviewFields,
          onApprove: input.onApprove ?? current.onApprove,
          onReject: input.onReject ?? current.onReject,
          active: input.active ?? current.active,
        };
        this.shape(kind, next);
        const row = rowsOf(
          await tx.execute(
            sql`UPDATE approval_processes SET name = ${next.name}, module = ${next.module},
                  trigger = ${next.trigger}, criteria = ${JSON.stringify(next.criteria)}::jsonb,
                  steps = ${JSON.stringify(next.steps)}::jsonb,
                  review_fields = ${JSON.stringify(next.reviewFields)}::jsonb,
                  on_approve = ${JSON.stringify(next.onApprove)}::jsonb,
                  on_reject = ${JSON.stringify(next.onReject)}::jsonb,
                  active = ${next.active}, updated_by = ${ctx.userId}, updated_at = now()
                WHERE organization_id = ${ctx.orgId} AND id = ${id} RETURNING *`,
          ),
        )[0];
        if (!row) throw new NotFoundError();
        return mapProcess(row);
      });
    } catch (error) {
      if (pgCode(error) === "23505") throw nameConflict();
      throw error;
    }
  }

  async remove(ctx: OrgContext, kind: ProcessKind, id: string): Promise<null> {
    if (!isUuid(id)) throw new NotFoundError();
    try {
      await withOrg(ctx, async (tx) => {
        await requireProcessAdmin(tx, ctx);
        const result = await tx.execute(
          sql`DELETE FROM approval_processes
              WHERE organization_id = ${ctx.orgId} AND kind = ${kind} AND id = ${id} RETURNING id`,
        );
        if (result.rows.length === 0) throw new NotFoundError();
      });
    } catch (error) {
      if (pgCode(error) === "23503" || pgCode(error) === "23001")
        throw new ConflictError("This process has requests. Deactivate it instead of deleting it.");
      throw error;
    }
    return null;
  }

  /** Puts the listed processes first, in the given order; unlisted ones keep their relative order after them. */
  async reorder(
    ctx: OrgContext,
    kind: ProcessKind,
    ids: readonly string[],
  ): Promise<ApprovalProcess[]> {
    if (new Set(ids).size !== ids.length || ids.some((id) => !isUuid(id)))
      throw new ValidationError({ ids: ["Send each process id once."] });
    return withOrg(ctx, async (tx) => {
      await requireProcessAdmin(tx, ctx);
      const existing = rowsOf(
        await tx.execute(
          sql`SELECT id FROM approval_processes WHERE organization_id = ${ctx.orgId} AND kind = ${kind}
              ORDER BY position, created_at, id FOR UPDATE`,
        ),
      ).map((row) => String(row.id));
      if (ids.some((id) => !existing.includes(id)))
        throw new ValidationError({ ids: ["Some processes were not found."] });
      const ordered = [...ids, ...existing.filter((id) => !ids.includes(id))];
      for (const [position, id] of ordered.entries()) {
        await tx.execute(
          sql`UPDATE approval_processes SET position = ${position}, updated_at = now(), updated_by = ${ctx.userId}
              WHERE organization_id = ${ctx.orgId} AND id = ${id}`,
        );
      }
      const result = await tx.execute(
        sql`SELECT * FROM approval_processes WHERE organization_id = ${ctx.orgId} AND kind = ${kind}
            ORDER BY position, created_at, id`,
      );
      return rowsOf(result).map(mapProcess);
    });
  }
}
