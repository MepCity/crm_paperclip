import { schema as dbSchema } from "@crm/db";
import { lt, sql } from "drizzle-orm";
import type { Transaction } from "../tenancy/types";

export interface RateLimitCheckResult {
  allowed: boolean;
  bucket?: string;
  count?: number;
  limit?: number;
}

async function incrementRateLimit(
  tx: Transaction,
  orgId: string,
  bucket: string,
  windowStart: Date,
): Promise<number> {
  const [row] = await tx
    .insert(dbSchema.publicRateLimits)
    .values({
      organizationId: orgId,
      bucket,
      windowStart,
      count: 1,
    })
    .onConflictDoUpdate({
      target: [
        dbSchema.publicRateLimits.organizationId,
        dbSchema.publicRateLimits.bucket,
        dbSchema.publicRateLimits.windowStart,
      ],
      set: { count: sql`${dbSchema.publicRateLimits.count} + 1` },
    })
    .returning({ count: dbSchema.publicRateLimits.count });

  return row?.count ?? 1;
}

export async function checkRateLimit(
  tx: Transaction,
  params: {
    orgId: string;
    formId: string;
    clientHash: string;
    isRender?: boolean;
    now?: Date;
  },
): Promise<RateLimitCheckResult> {
  const now = params.now ?? new Date();
  const nowMs = now.getTime();
  const windowStartMin = new Date(Math.floor(nowMs / 60000) * 60000);
  const windowStartHour = new Date(Math.floor(nowMs / 3600000) * 3600000);

  if (params.isRender) {
    const bucket = `render:${params.formId}:${params.clientHash}`;
    const limit = 120;
    const count = await incrementRateLimit(tx, params.orgId, bucket, windowStartMin);
    if (count > limit) {
      return { allowed: false, bucket, count, limit };
    }
    return { allowed: true, count, limit };
  }

  // Submissions check 4 limits per ADR 0019 §3.5:
  // 1. per form + client hash: 5/min
  const b1 = `submit:form_client:${params.formId}:${params.clientHash}:min`;
  const count1 = await incrementRateLimit(tx, params.orgId, b1, windowStartMin);
  if (count1 > 5) {
    return { allowed: false, bucket: b1, count: count1, limit: 5 };
  }

  // 2. per form + client hash: 30/h
  const b2 = `submit:form_client:${params.formId}:${params.clientHash}:hour`;
  const count2 = await incrementRateLimit(tx, params.orgId, b2, windowStartHour);
  if (count2 > 30) {
    return { allowed: false, bucket: b2, count: count2, limit: 30 };
  }

  // 3. per form: 600/h
  const b3 = `submit:form:${params.formId}`;
  const count3 = await incrementRateLimit(tx, params.orgId, b3, windowStartHour);
  if (count3 > 600) {
    return { allowed: false, bucket: b3, count: count3, limit: 600 };
  }

  // 4. per organisation: 2 000/h
  const b4 = "submit:org";
  const count4 = await incrementRateLimit(tx, params.orgId, b4, windowStartHour);
  if (count4 > 2000) {
    return { allowed: false, bucket: b4, count: count4, limit: 2000 };
  }

  return { allowed: true };
}

export async function sweepOldRateLimits(
  tx: Transaction,
  olderThanMs = 2 * 60 * 60 * 1000,
): Promise<number> {
  const cutoff = new Date(Date.now() - olderThanMs);
  const result = await tx
    .delete(dbSchema.publicRateLimits)
    .where(lt(dbSchema.publicRateLimits.windowStart, cutoff));
  return result.rowCount ?? 0;
}
