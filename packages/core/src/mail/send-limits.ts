import { randomUUID } from "node:crypto";
import { ValidationError } from "../errors";

/** Interim defaults (ADR 0009 Topic 7); configurable per call via `SendLimits`. */
export const DEFAULT_MAILBOX_DAILY_LIMIT = 500;
export const DEFAULT_ORGANIZATION_DAILY_LIMIT = 2000;

export interface SendLimits {
  perMailboxDaily: number;
  perOrganizationDaily: number;
}

export const DEFAULT_SEND_LIMITS: SendLimits = {
  perMailboxDaily: DEFAULT_MAILBOX_DAILY_LIMIT,
  perOrganizationDaily: DEFAULT_ORGANIZATION_DAILY_LIMIT,
};

export interface ReserveInput {
  organizationId: string;
  mailboxId: string;
  /** Envelope recipients (to + cc + bcc) of the message. */
  recipientCount: number;
  now: Date;
}

export type ReserveResult =
  | { allowed: true; reservationId: string; remaining: { mailbox: number; organization: number } }
  | { allowed: false; reason: "mailbox_daily" | "organization_daily"; resetsAt: Date };

export interface SendLimitStore {
  reserve(input: ReserveInput, limits?: SendLimits): Promise<ReserveResult>;
  /** Refunds a reservation (send rejected before reaching the provider). Unknown ids are a no-op. */
  release(reservationId: string): Promise<void>;
}

function utcDay(now: Date): string {
  return now.toISOString().slice(0, 10);
}

function nextUtcMidnight(now: Date): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
}

function assertCount(value: number, field: string, min: number): void {
  if (!Number.isInteger(value) || value < min) {
    throw new ValidationError({ [field]: ["Must be a whole number."] });
  }
}

interface Reservation {
  organizationKey: string;
  mailboxKey: string;
  count: number;
}

/**
 * In-memory store. `reserve` is synchronous inside, so check-and-increment can never
 * interleave between concurrent callers.
 */
export class InMemorySendLimitStore implements SendLimitStore {
  private readonly counters = new Map<string, number>();
  private readonly reservations = new Map<string, Reservation>();

  async reserve(
    input: ReserveInput,
    limits: SendLimits = DEFAULT_SEND_LIMITS,
  ): Promise<ReserveResult> {
    assertCount(input.recipientCount, "recipientCount", 1);
    assertCount(limits.perMailboxDaily, "perMailboxDaily", 0);
    assertCount(limits.perOrganizationDaily, "perOrganizationDaily", 0);
    if (Number.isNaN(input.now.getTime())) {
      throw new ValidationError({ now: ["Invalid date."] });
    }
    const day = utcDay(input.now);
    const organizationKey = `${day}|org|${input.organizationId}`;
    const mailboxKey = `${day}|mbx|${input.organizationId}|${input.mailboxId}`;
    const orgUsed = this.counters.get(organizationKey) ?? 0;
    const mailboxUsed = this.counters.get(mailboxKey) ?? 0;
    const resetsAt = nextUtcMidnight(input.now);
    if (orgUsed + input.recipientCount > limits.perOrganizationDaily) {
      return { allowed: false, reason: "organization_daily", resetsAt };
    }
    if (mailboxUsed + input.recipientCount > limits.perMailboxDaily) {
      return { allowed: false, reason: "mailbox_daily", resetsAt };
    }
    this.counters.set(organizationKey, orgUsed + input.recipientCount);
    this.counters.set(mailboxKey, mailboxUsed + input.recipientCount);
    const reservationId = randomUUID();
    this.reservations.set(reservationId, {
      organizationKey,
      mailboxKey,
      count: input.recipientCount,
    });
    return {
      allowed: true,
      reservationId,
      remaining: {
        mailbox: limits.perMailboxDaily - mailboxUsed - input.recipientCount,
        organization: limits.perOrganizationDaily - orgUsed - input.recipientCount,
      },
    };
  }

  async release(reservationId: string): Promise<void> {
    const reservation = this.reservations.get(reservationId);
    if (!reservation) return;
    this.reservations.delete(reservationId);
    for (const key of [reservation.organizationKey, reservation.mailboxKey]) {
      this.counters.set(key, Math.max(0, (this.counters.get(key) ?? 0) - reservation.count));
    }
  }
}
