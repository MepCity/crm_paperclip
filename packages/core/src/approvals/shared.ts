import { sql } from "drizzle-orm";
import { getAccessSnapshot } from "../access/context";
import { adminPermitted } from "../access-gate";
import { ConflictError, ForbiddenError } from "../errors";
import type { OrgContext, Transaction } from "../tenancy/types";

export type Row = Record<string, unknown>;

export function rowsOf(result: { rows: unknown[] }): Row[] {
  return result.rows as Row[];
}

export function iso(value: unknown): string {
  return (value instanceof Date ? value : new Date(String(value))).toISOString();
}

export function isoOrNull(value: unknown): string | null {
  return value === null || value === undefined ? null : iso(value);
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (value: string): boolean => UUID.test(value);

/** The pg error code behind a Drizzle-wrapped query failure. */
export function pgCode(error: unknown): string | undefined {
  let current: unknown = error;
  for (let depth = 0; depth < 4 && current; depth += 1) {
    const code = (current as { code?: unknown }).code;
    if (typeof code === "string" && /^[0-9A-Z]{5}$/.test(code)) return code;
    current = (current as { cause?: unknown }).cause;
  }
  return undefined;
}

/**
 * Process setup is `admin.manageAutomation` (ADR 0017 §3). An administrator membership is
 * re-read inside the transaction; any other member needs a profile that grants the key.
 */
export async function requireProcessAdmin(tx: Transaction, ctx: OrgContext): Promise<void> {
  if (ctx.role === "admin") {
    if (!(await isAdmin(tx, ctx))) throw new ForbiddenError();
    return;
  }
  if (!(await adminPermitted(ctx, "manageAutomation", getAccessSnapshot)))
    throw new ForbiddenError();
}

export async function isAdmin(tx: Transaction, ctx: OrgContext): Promise<boolean> {
  const result = await tx.execute(
    sql`SELECT role FROM memberships WHERE organization_id = ${ctx.orgId} AND user_id = ${ctx.userId}`,
  );
  return (rowsOf(result)[0]?.role as string | undefined) === "admin";
}

export function nameConflict(): ConflictError {
  return new ConflictError("A process with this name already exists for the module.");
}
