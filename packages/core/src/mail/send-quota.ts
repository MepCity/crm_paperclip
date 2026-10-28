/**
 * Sliding-window send quota (ADR 0009 Topic 7): pure, in-memory counters per
 * mailbox and per organization. Counting is per recipient; time is injected.
 */

export const DEFAULT_SEND_QUOTA_WINDOW_MS = 24 * 60 * 60 * 1000;

export interface SendQuotaKey {
  organizationId: string;
  mailboxId: string;
}

export interface SendQuotaOptions {
  perMailboxLimit: number;
  perOrganizationLimit: number;
  windowMs?: number;
}

export type SendQuotaCheck =
  | { ok: true; remaining: number }
  | { ok: false; reason: "mailbox_limit" | "organization_limit"; retryAt: Date };

export interface SendQuota {
  /** Does not change state. */
  check(key: SendQuotaKey, recipients: number, now: Date): SendQuotaCheck;
  /** Records usage only; does not enforce limits. */
  record(key: SendQuotaKey, recipients: number, now: Date): void;
}

interface Entry {
  organizationId: string;
  mailboxId: string;
  count: number;
  at: number;
}

function assertPositiveInteger(value: number, name: string): void {
  if (!Number.isInteger(value) || value <= 0) {
    throw new RangeError(`${name} must be a positive integer`);
  }
}

export function createSendQuota(options: SendQuotaOptions): SendQuota {
  const { perMailboxLimit, perOrganizationLimit } = options;
  const windowMs = options.windowMs ?? DEFAULT_SEND_QUOTA_WINDOW_MS;
  assertPositiveInteger(perMailboxLimit, "perMailboxLimit");
  assertPositiveInteger(perOrganizationLimit, "perOrganizationLimit");
  assertPositiveInteger(windowMs, "windowMs");

  let entries: Entry[] = [];

  const prune = (nowMs: number): void => {
    entries = entries.filter((e) => e.at + windowMs > nowMs);
  };

  const used = (list: Entry[]): number => list.reduce((sum, e) => sum + e.count, 0);

  // Earliest moment at which `needed` units fit under `limit` (entries sorted by time).
  const retryAtFor = (scope: Entry[], limit: number, needed: number): Date => {
    let total = used(scope);
    for (const e of scope) {
      total -= e.count;
      if (total + needed <= limit) return new Date(e.at + windowMs);
    }
    const last = scope[scope.length - 1];
    return new Date((last?.at ?? 0) + windowMs);
  };

  return {
    check(key, recipients, now) {
      assertPositiveInteger(recipients, "recipients");
      const nowMs = now.getTime();
      const active = entries.filter((e) => e.at + windowMs > nowMs);
      const orgScope = active.filter((e) => e.organizationId === key.organizationId);
      const mailboxScope = orgScope.filter((e) => e.mailboxId === key.mailboxId);
      const mailboxRemaining = perMailboxLimit - used(mailboxScope);
      const orgRemaining = perOrganizationLimit - used(orgScope);
      if (recipients > mailboxRemaining) {
        return {
          ok: false,
          reason: "mailbox_limit",
          retryAt: retryAtFor(mailboxScope, perMailboxLimit, recipients),
        };
      }
      if (recipients > orgRemaining) {
        return {
          ok: false,
          reason: "organization_limit",
          retryAt: retryAtFor(orgScope, perOrganizationLimit, recipients),
        };
      }
      return { ok: true, remaining: Math.min(mailboxRemaining, orgRemaining) - recipients };
    },
    record(key, recipients, now) {
      assertPositiveInteger(recipients, "recipients");
      const nowMs = now.getTime();
      prune(nowMs);
      entries.push({
        organizationId: key.organizationId,
        mailboxId: key.mailboxId,
        count: recipients,
        at: nowMs,
      });
      entries.sort((a, b) => a.at - b.at);
    },
  };
}
