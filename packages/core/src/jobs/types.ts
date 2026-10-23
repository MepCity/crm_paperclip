import { z } from "zod";

const opaque = z.string().regex(/^[A-Za-z0-9_-]{1,128}$/);
const safeCode = z.enum([
  "transient",
  "rate_limited",
  "invalid_payload",
  "resource_missing",
  "authorization_revoked",
  "permanent",
  "delivery_unknown",
  "lease_expired",
  "handler_missing",
  "internal",
  "connection_cancelled",
]);
export type JobErrorCode = z.infer<typeof safeCode>;
export type JobStatus = "queued" | "running" | "succeeded" | "failed" | "cancelled";
export type JobPayload = Readonly<Record<string, string>>;

/** Only opaque resource references belong here. Schema changes require a new version. */
export interface JobDefinition {
  kind: string;
  version: number;
  referenceKeys: readonly string[];
  /** False for effects whose outcome cannot safely be replayed after a crash. */
  retrySafe: boolean;
}
export interface Job {
  organizationId: string;
  id: string;
  kind: string;
  payloadVersion: number;
  payload: JobPayload;
  idempotencyKey: string;
  status: JobStatus;
  /** All timestamps are UTC epoch milliseconds, supplied by the adapter clock. */
  runAt: number;
  attempts: number;
  maxAttempts: number;
  lockedBy: string | null;
  leaseToken: string | null;
  leaseExpiresAt: number | null;
  createdAt: number;
  updatedAt: number;
  finishedAt: number | null;
  lastErrorCode: JobErrorCode | null;
  lastErrorAt: number | null;
}
export interface JobFence {
  organizationId: string;
  id: string;
  lockedBy: string;
  leaseToken: string;
}
export function fence(job: Job): JobFence {
  if (!job.lockedBy || !job.leaseToken) throw new Error("Job is not leased");
  return {
    organizationId: job.organizationId,
    id: job.id,
    lockedBy: job.lockedBy,
    leaseToken: job.leaseToken,
  };
}
export interface EnqueueJob {
  kind: string;
  payloadVersion: number;
  payload: unknown;
  idempotencyKey: string;
  runAt?: number;
  maxAttempts?: number;
}
export interface JobFailure {
  code: JobErrorCode;
  retryable: boolean;
  /** Absolute UTC deadline; a provider Retry-After is never shortened. */
  retryAfter?: number;
}

/** Trusted server context supplies organizationId; it must never come from payload JSON. */
export interface JobQueue {
  enqueue(context: { organizationId: string }, input: EnqueueJob): Promise<Job>;
  get(context: { organizationId: string }, id: string): Promise<Job | undefined>;
  claim(input: {
    workerId: string;
    limit: number;
    leaseMs: number;
    maxRunningPerOrganization?: number;
  }): Promise<Job[]>;
  recoverExpired(limit: number): Promise<number>;
  renew(fence: JobFence, leaseMs: number): Promise<boolean>;
  succeed(fence: JobFence): Promise<boolean>;
  fail(fence: JobFence, failure: JobFailure): Promise<boolean>;
  cancel(fence: JobFence): Promise<boolean>;
}

export class JobContractError extends Error {
  constructor(readonly code: "invalid_payload" | "enqueue_conflict" | "invalid_input") {
    super(code);
  }
}
export class JobExecutionError extends Error {
  constructor(readonly failure: JobFailure) {
    super("Job execution failed");
  }
}
export function safeFailure(error: unknown): JobFailure {
  if (error instanceof JobExecutionError) {
    const result = z
      .object({
        code: safeCode,
        retryable: z.boolean(),
        retryAfter: z.number().finite().optional(),
      })
      .safeParse(error.failure);
    if (result.success) {
      const { code, retryable, retryAfter } = result.data;
      return {
        code,
        retryable: retryable && ["transient", "rate_limited", "lease_expired"].includes(code),
        ...(retryAfter === undefined ? {} : { retryAfter }),
      };
    }
  }
  return { code: "internal", retryable: false };
}
export function positiveInteger(value: number, max = 100): number {
  if (!Number.isInteger(value) || value < 1 || value > max)
    throw new JobContractError("invalid_input");
  return value;
}
export function validateOpaque(value: string): string {
  if (!opaque.safeParse(value).success) throw new JobContractError("invalid_input");
  return value;
}
export class JobCatalog {
  private readonly definitions = new Map<string, JobDefinition>();
  constructor(definitions: readonly JobDefinition[]) {
    for (const definition of definitions) {
      validateOpaque(definition.kind);
      positiveInteger(definition.version, 10000);
      const key = `${definition.kind}:${definition.version}`;
      if (
        typeof definition.retrySafe !== "boolean" ||
        this.definitions.has(key) ||
        definition.referenceKeys.length > 16 ||
        new Set(definition.referenceKeys).size !== definition.referenceKeys.length ||
        definition.referenceKeys.some(
          (key) =>
            !/^[a-zA-Z][a-zA-Z0-9]*(Id|Ref|Generation)$/.test(key) ||
            /organi[sz]ation|tenant|secret|token|credential/i.test(key),
        )
      ) {
        throw new JobContractError("invalid_input");
      }
      this.definitions.set(key, structuredClone(definition));
    }
  }
  definition(kind: string, version: number): JobDefinition {
    if (
      !opaque.safeParse(kind).success ||
      !Number.isInteger(version) ||
      version < 1 ||
      version > 10000
    )
      throw new JobContractError("invalid_payload");
    const definition = this.definitions.get(`${kind}:${version}`);
    if (!definition) throw new JobContractError("invalid_payload");
    return structuredClone(definition);
  }
  validate(kind: string, version: number, payload: unknown): JobPayload {
    const definition = this.definition(kind, version);
    const schema = z.strictObject(
      Object.fromEntries(definition.referenceKeys.map((key) => [key, opaque])),
    );
    const result = schema.safeParse(payload);
    if (!result.success || Buffer.byteLength(JSON.stringify(result.data)) > 4096) {
      throw new JobContractError("invalid_payload");
    }
    return result.data;
  }
}

export function retryDelay(attempts: number, random: () => number): number {
  const sample = random();
  if (!Number.isFinite(sample) || sample < 0 || sample > 1)
    throw new JobContractError("invalid_input");
  return Math.floor(sample * Math.min(900000, 5000 * 2 ** Math.min(30, Math.max(0, attempts - 1))));
}
