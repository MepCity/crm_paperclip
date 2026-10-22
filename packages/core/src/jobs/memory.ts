import { randomUUID } from "node:crypto";
import {
  type EnqueueJob,
  type Job,
  type JobCatalog,
  JobContractError,
  JobExecutionError,
  type JobFailure,
  type JobFence,
  type JobQueue,
  type JobStatus,
  positiveInteger,
  retryDelay,
  safeFailure,
  validateOpaque,
} from "./types";

/** Ephemeral contract adapter. No restart durability, domain transactions or RLS. */
export class InMemoryJobQueue implements JobQueue {
  private readonly rows = new Map<string, Job>();
  private readonly keys = new Map<string, { id: string; fingerprint: string }>();
  constructor(
    private readonly catalog: JobCatalog,
    private readonly clock: () => number = Date.now,
    private readonly random: () => number = Math.random,
  ) {}

  async enqueue(context: { organizationId: string }, input: EnqueueJob): Promise<Job> {
    const organizationId = validateOpaque(context.organizationId);
    validateOpaque(input.idempotencyKey);
    const payload = this.catalog.validate(input.kind, input.payloadVersion, input.payload);
    const maxAttempts = positiveInteger(input.maxAttempts ?? 5);
    if (input.runAt !== undefined && !Number.isFinite(input.runAt))
      throw new JobContractError("invalid_input");
    const fingerprint = JSON.stringify([
      input.payloadVersion,
      Object.entries(payload).sort(([a], [b]) => a.localeCompare(b)),
      input.runAt ?? null,
      maxAttempts,
    ]);
    const key = JSON.stringify([organizationId, input.kind, input.idempotencyKey]);
    const previous = this.keys.get(key);
    if (previous) {
      if (previous.fingerprint !== fingerprint) throw new JobContractError("enqueue_conflict");
      return structuredClone(this.rows.get(previous.id) as Job);
    }
    const now = this.clock();
    const row: Job = {
      organizationId,
      id: randomUUID(),
      kind: input.kind,
      payloadVersion: input.payloadVersion,
      payload,
      idempotencyKey: input.idempotencyKey,
      status: "queued",
      runAt: input.runAt ?? now,
      attempts: 0,
      maxAttempts,
      lockedBy: null,
      leaseToken: null,
      leaseExpiresAt: null,
      createdAt: now,
      updatedAt: now,
      finishedAt: null,
      lastErrorCode: null,
      lastErrorAt: null,
    };
    this.rows.set(row.id, row);
    this.keys.set(key, { id: row.id, fingerprint });
    return structuredClone(row);
  }
  async get(context: { organizationId: string }, id: string): Promise<Job | undefined> {
    const row = this.rows.get(id);
    return row?.organizationId === context.organizationId ? structuredClone(row) : undefined;
  }
  async claim(input: {
    workerId: string;
    limit: number;
    leaseMs: number;
    maxRunningPerOrganization?: number;
  }): Promise<Job[]> {
    validateOpaque(input.workerId);
    positiveInteger(input.limit);
    positiveInteger(input.leaseMs, 300000);
    const perOrganization = positiveInteger(input.maxRunningPerOrganization ?? 2);
    const now = this.clock();
    const running = new Map<string, number>();
    for (const row of this.rows.values()) {
      if (row.status === "running")
        running.set(row.organizationId, (running.get(row.organizationId) ?? 0) + 1);
    }
    const due = [...this.rows.values()]
      .filter((row) => row.status === "queued" && row.runAt <= now)
      .sort((a, b) => a.runAt - b.runAt || a.id.localeCompare(b.id));
    const claimed: Job[] = [];
    for (const row of due) {
      if (claimed.length === input.limit) break;
      const count = running.get(row.organizationId) ?? 0;
      if (count >= perOrganization) continue;
      row.status = "running";
      row.attempts++;
      row.lockedBy = input.workerId;
      row.leaseToken = randomUUID();
      row.leaseExpiresAt = now + input.leaseMs;
      row.updatedAt = now;
      running.set(row.organizationId, count + 1);
      claimed.push(structuredClone(row));
    }
    return claimed;
  }
  async recoverExpired(limit: number): Promise<number> {
    positiveInteger(limit);
    const now = this.clock();
    let recovered = 0;
    for (const row of this.rows.values()) {
      if (recovered === limit) break;
      if (row.status !== "running" || (row.leaseExpiresAt as number) > now) continue;
      const retrySafe = this.catalog.definition(row.kind, row.payloadVersion).retrySafe;
      this.applyFailure(row, {
        code: retrySafe ? "lease_expired" : "delivery_unknown",
        retryable: retrySafe,
      });
      recovered++;
    }
    return recovered;
  }
  async renew(fence: JobFence, leaseMs: number): Promise<boolean> {
    positiveInteger(leaseMs, 300000);
    const row = this.owned(fence);
    if (!row) return false;
    row.leaseExpiresAt = this.clock() + leaseMs;
    row.updatedAt = this.clock();
    return true;
  }
  async succeed(fence: JobFence): Promise<boolean> {
    const row = this.owned(fence);
    if (!row) return false;
    this.finish(row, "succeeded");
    return true;
  }
  async cancel(fence: JobFence): Promise<boolean> {
    const row = this.owned(fence);
    if (!row) return false;
    row.lastErrorCode = "connection_cancelled";
    row.lastErrorAt = this.clock();
    this.finish(row, "cancelled");
    return true;
  }
  async fail(fence: JobFence, failure: JobFailure): Promise<boolean> {
    const row = this.owned(fence);
    if (!row) return false;
    this.applyFailure(row, safeFailure(new JobExecutionError(failure)));
    return true;
  }
  private owned(fence: JobFence): Job | undefined {
    const row = this.rows.get(fence.id);
    return row &&
      row.organizationId === fence.organizationId &&
      row.status === "running" &&
      row.lockedBy === fence.lockedBy &&
      row.leaseToken === fence.leaseToken &&
      (row.leaseExpiresAt as number) > this.clock()
      ? row
      : undefined;
  }
  private clearLease(row: Job) {
    row.lockedBy = null;
    row.leaseToken = null;
    row.leaseExpiresAt = null;
  }
  private finish(row: Job, status: JobStatus) {
    row.status = status;
    row.finishedAt = this.clock();
    row.updatedAt = this.clock();
    this.clearLease(row);
  }
  private applyFailure(row: Job, failure: JobFailure) {
    const now = this.clock();
    const retry =
      failure.retryable && failure.code !== "delivery_unknown" && row.attempts < row.maxAttempts;
    const runAt = retry
      ? Math.max(now + retryDelay(row.attempts, this.random), failure.retryAfter ?? now)
      : row.runAt;
    row.lastErrorCode = failure.code;
    row.lastErrorAt = now;
    if (retry) {
      row.status = "queued";
      row.runAt = runAt;
      row.updatedAt = now;
      this.clearLease(row);
    } else this.finish(row, "failed");
  }
}
