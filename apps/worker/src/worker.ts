import {
  fence,
  type Job,
  type JobCatalog,
  JobContractError,
  type JobFence,
  type JobQueue,
  safeFailure,
} from "@crm/core/jobs";

export interface HandlerContext {
  readonly organizationId: string;
  readonly job: Job;
  readonly fence: JobFence;
  readonly signal: AbortSignal;
  /** Call before every external effect/checkpoint; domain writes must also match fence. */
  checkpoint(): Promise<void>;
}
export interface JobHandler {
  kind: string;
  version: number;
  /** Recheck resource tenant, connection generation and current authorization. */
  isCurrent(context: HandlerContext): Promise<boolean>;
  run(context: HandlerContext): Promise<void>;
}
export class HandlerRegistry {
  private readonly handlers = new Map<string, JobHandler>();
  constructor(handlers: readonly JobHandler[]) {
    for (const handler of handlers) {
      const key = `${handler.kind}:${handler.version}`;
      if (this.handlers.has(key)) throw new Error("Duplicate job handler");
      this.handlers.set(key, handler);
    }
  }
  get(kind: string, version: number): JobHandler | undefined {
    return this.handlers.get(`${kind}:${version}`);
  }
}

/** A durable mailbox lease gate belongs in the future persistence adapter. */
export interface JobGate {
  acquire(job: Job): Promise<(() => void | Promise<void>) | undefined>;
}
/** Process-local exclusion only; deliberately not a distributed mailbox lease. */
export class InMemoryMailboxGate implements JobGate {
  private readonly held = new Set<string>();
  async acquire(job: Job) {
    const key = JSON.stringify([job.organizationId, job.payload.mailboxId ?? job.id]);
    if (this.held.has(key)) return undefined;
    this.held.add(key);
    return () => {
      this.held.delete(key);
    };
  }
}
export interface WorkerOptions {
  queue: JobQueue;
  catalog: JobCatalog;
  handlers: HandlerRegistry;
  workerId: string;
  concurrency?: number;
  pollMs?: number;
  leaseMs?: number;
  renewMs?: number;
  drainMs?: number;
  gate?: JobGate;
  cleanup?: () => void | Promise<void>;
  /** Safe classifications only; raw thrown values never leave the worker. */
  onEvent?: (event: "queue_unavailable" | "ownership_lost" | "forced_stop") => void;
}

export class Worker {
  private readonly active = new Map<Promise<void>, AbortController>();
  private readonly gate: JobGate;
  private readonly concurrency: number;
  private readonly leaseMs: number;
  private readonly renewMs: number;
  private stopping = false;
  private forced = false;
  private healthy = false;
  private loop?: Promise<void>;
  private cleanupPromise?: Promise<void>;
  private cleanup(): Promise<void> {
    this.cleanupPromise ??= Promise.resolve().then(() => this.options.cleanup?.());
    return this.cleanupPromise;
  }
  private stoppingPromise?: Promise<{ forced: boolean }>;
  private wake?: () => void;
  constructor(private readonly options: WorkerOptions) {
    this.concurrency = options.concurrency ?? 2;
    this.leaseMs = options.leaseMs ?? 60000;
    this.renewMs = options.renewMs ?? 20000;
    this.gate = options.gate ?? new InMemoryMailboxGate();
    if (
      !Number.isInteger(this.concurrency) ||
      this.concurrency < 1 ||
      this.concurrency > 100 ||
      !Number.isInteger(this.leaseMs) ||
      this.leaseMs < 2 ||
      this.leaseMs > 300000 ||
      !Number.isInteger(this.renewMs) ||
      this.renewMs < 1 ||
      this.renewMs >= this.leaseMs ||
      !Number.isFinite(options.pollMs ?? 5000) ||
      (options.pollMs ?? 5000) < 1 ||
      !Number.isFinite(options.drainMs ?? 30000) ||
      (options.drainMs ?? 30000) < 0 ||
      (options.drainMs ?? 30000) > 30000
    ) {
      throw new Error("Invalid worker limits");
    }
  }
  get ready() {
    return !!this.loop && this.healthy && !this.stopping;
  }
  start(): void {
    if (this.loop || this.stopping) throw new Error("Worker already started or stopped");
    this.loop = this.poll();
  }
  private event(event: "queue_unavailable" | "ownership_lost" | "forced_stop") {
    try {
      this.options.onEvent?.(event);
    } catch {
      /* Observers cannot interrupt cleanup. */
    }
  }
  private async poll() {
    while (!this.stopping) {
      try {
        await this.options.queue.recoverExpired(100);
        if (this.stopping) break;
        const capacity = this.concurrency - this.active.size;
        if (capacity > 0) {
          const jobs = await this.options.queue.claim({
            workerId: this.options.workerId,
            limit: capacity,
            leaseMs: this.leaseMs,
          });
          // A stop during an in-flight claim leaves leases to recovery, without executing effects.
          if (this.stopping) break;
          for (const job of jobs) {
            const controller = new AbortController();
            const task = this.execute(job, controller)
              .catch(() => {
                this.healthy = false;
                this.event("queue_unavailable");
              })
              .finally(() => {
                this.active.delete(task);
                this.wake?.();
              });
            this.active.set(task, controller);
          }
        }
        this.healthy = true;
      } catch {
        this.healthy = false;
        this.event("queue_unavailable");
      }
      if (!this.stopping) await this.pause();
    }
  }
  private pause() {
    return new Promise<void>((resolve) => {
      const timer = setTimeout(done, this.options.pollMs ?? 5000);
      const self = this;
      function done() {
        clearTimeout(timer);
        self.wake = undefined;
        resolve();
      }
      this.wake = done;
    });
  }
  private async execute(job: Job, controller: AbortController) {
    const owned = fence(job);
    let lost = false;
    let renewing = false;
    let release: (() => void | Promise<void>) | undefined;
    const lose = () => {
      lost = true;
      controller.abort();
      this.event("ownership_lost");
    };
    const heartbeat = setInterval(() => {
      if (renewing || lost || this.forced) return;
      renewing = true;
      void this.options.queue
        .renew(owned, this.leaseMs)
        .then((ok) => {
          if (!ok) lose();
        })
        .catch(lose)
        .finally(() => {
          renewing = false;
        });
    }, this.renewMs);
    controller.signal.addEventListener("abort", () => clearInterval(heartbeat), { once: true });
    const canWrite = () => !lost && !this.forced && !controller.signal.aborted;
    try {
      this.options.catalog.validate(job.kind, job.payloadVersion, job.payload);
      const handler = this.options.handlers.get(job.kind, job.payloadVersion);
      if (!handler) {
        await this.options.queue.fail(owned, { code: "handler_missing", retryable: false });
        return;
      }
      const context: HandlerContext = {
        organizationId: job.organizationId,
        job,
        fence: owned,
        signal: controller.signal,
        checkpoint: async () => {
          controller.signal.throwIfAborted();
          if (!(await handler.isCurrent(context))) {
            if (canWrite()) await this.options.queue.cancel(owned);
            controller.abort();
          }
          controller.signal.throwIfAborted();
          if (!(await this.options.queue.renew(owned, this.leaseMs))) lose();
          controller.signal.throwIfAborted();
        },
      };
      await context.checkpoint();
      release = await this.gate.acquire(job);
      if (!canWrite()) return;
      if (!release) {
        await this.options.queue.fail(owned, { code: "transient", retryable: true });
        return;
      }
      await handler.run(context);
      if (canWrite() && !(await this.options.queue.succeed(owned))) lose();
    } catch (error) {
      if (canWrite())
        await this.options.queue.fail(
          owned,
          error instanceof JobContractError
            ? { code: "invalid_payload", retryable: false }
            : safeFailure(error),
        );
    } finally {
      clearInterval(heartbeat);
      await release?.();
    }
  }
  stop(): Promise<{ forced: boolean }> {
    this.stoppingPromise ??= this.drain();
    return this.stoppingPromise;
  }
  private async drain(): Promise<{ forced: boolean }> {
    this.stopping = true;
    this.wake?.();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const deadline = new Promise<"timeout">((resolve) => {
      timer = setTimeout(() => resolve("timeout"), this.options.drainMs ?? 30000);
    });
    const drained = (async () => {
      await this.loop;
      await Promise.all([...this.active.keys()]);
      await this.cleanup().catch(() => {
        this.forced = true;
        this.event("forced_stop");
      });
      return "drained" as const;
    })();
    const result = await Promise.race([drained, deadline]);
    clearTimeout(timer);
    if (result === "timeout") {
      this.forced = true;
      for (const controller of this.active.values()) controller.abort();
      this.event("forced_stop");
      // Leave unresolved effects leased; expiry recovery decides whether replay is safe.
    }
    if (result === "timeout") void this.cleanup().catch(() => {});
    return { forced: this.forced };
  }
}
