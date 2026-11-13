/**
 * Process-local throttle for credential posts: one bucket per client IP (only when a trusted
 * proxy supplies it) and one per target account. The per-account bucket is deliberately
 * generous so a stranger cannot lock a real user out for long. Counters live in memory, like
 * the library's own limiter; a shared store is architecture work tracked separately.
 */
const WINDOW_MS = 15 * 60_000;
const LIMITS = { ip: 30, account: 12 } as const;

const hits = new Map<string, { count: number; resetAt: number }>();

function hit(key: string, limit: number, now: number): boolean {
  const entry = hits.get(key);
  if (!entry || entry.resetAt <= now) {
    hits.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  entry.count += 1;
  return entry.count <= limit;
}

function sweep(now: number): void {
  if (hits.size < 5000) return;
  for (const [key, entry] of hits) if (entry.resetAt <= now) hits.delete(key);
}

/** Returns false when this attempt exceeds a bucket. */
export function checkAuthThrottle(
  kind: "sign-in" | "sign-up",
  ip: string | null,
  email: string,
  now = Date.now(),
): boolean {
  sweep(now);
  const ipOk = ip ? hit(`${kind}:ip:${ip}`, LIMITS.ip, now) : true;
  const accountOk = email ? hit(`${kind}:account:${email}`, LIMITS.account, now) : true;
  return ipOk && accountOk;
}

export function resetAuthThrottleForTests(): void {
  hits.clear();
}
