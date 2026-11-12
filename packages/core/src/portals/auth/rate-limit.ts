import { schema } from "@crm/db";
import { sql } from "drizzle-orm";
import type { Transaction } from "../../tenancy/types";

/**
 * ADR 0019a §2.5 limits, fixed windows in `public_rate_limits`, buckets prefixed `portal:`
 * (swept by the webforms sweep after 2 h).
 */
export const PORTAL_LIMITS = {
  loginIdentityFailures: { limit: 5, windowMs: 15 * 60_000 },
  loginClient: { limit: 20, windowMs: 15 * 60_000 },
  loginOrg: { limit: 300, windowMs: 60 * 60_000 },
  resetEmail: { limit: 3, windowMs: 60 * 60_000 },
  resetClient: { limit: 10, windowMs: 60 * 60_000 },
  tokenClient: { limit: 10, windowMs: 15 * 60_000 },
  session: { limit: 300, windowMs: 60_000 },
} as const;

export type PortalLimitName = keyof typeof PORTAL_LIMITS;

/** Lock duration after the identity failure limit (ADR 0019a §2.5). */
export const LOCK_MS = 15 * 60_000;

/** Increments the bucket and reports whether this hit is still within the limit. */
export async function hitPortalLimit(
  tx: Transaction,
  orgId: string,
  name: PortalLimitName,
  key: string,
  now: Date,
): Promise<{ allowed: boolean; count: number }> {
  const { limit, windowMs } = PORTAL_LIMITS[name];
  const windowStart = new Date(Math.floor(now.getTime() / windowMs) * windowMs);
  const [row] = await tx
    .insert(schema.publicRateLimits)
    .values({ organizationId: orgId, bucket: `portal:${name}:${key}`, windowStart, count: 1 })
    .onConflictDoUpdate({
      target: [
        schema.publicRateLimits.organizationId,
        schema.publicRateLimits.bucket,
        schema.publicRateLimits.windowStart,
      ],
      set: { count: sql`${schema.publicRateLimits.count} + 1` },
    })
    .returning({ count: schema.publicRateLimits.count });
  const count = row?.count ?? 1;
  return { allowed: count <= limit, count };
}
