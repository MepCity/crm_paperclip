import { schema as dbSchema } from "@crm/db";
import { lt, sql } from "drizzle-orm";
import type { Transaction } from "../tenancy/types";

/**
 * Resolves the client IP address from incoming request headers.
 *
 * Security & Proxy Architecture:
 * 1. `x-forwarded-for` is parsed first. In standard reverse proxy configurations
 *    (e.g., Vercel, Render, Cloudflare), the trusted edge proxy appends the connecting
 *    client's IP to the end of the chain. Taking the first element (`forwarded.split(",")[0]`)
 *    is vulnerable to client header injection (e.g., client sends `X-Forwarded-For: 1.2.3.4`
 *    which becomes `1.2.3.4, <real_ip>`), allowing rate limit bypass. Taking the rightmost (last)
 *    non-empty element safely extracts the real client IP appended by our hosts' edge proxy.
 * 2. If there is no `x-forwarded-for` header (or it contains no non-empty values),
 *    `x-real-ip` is used if present.
 * 3. Falls back to "127.0.0.1" if no valid header exists.
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const parts = forwarded
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);
    const last = parts[parts.length - 1];
    if (last) {
      return last;
    }
  }

  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) {
    return realIp;
  }

  return "127.0.0.1";
}

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
