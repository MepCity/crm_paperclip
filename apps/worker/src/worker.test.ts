import { EventEmitter } from "node:events";
import {
  fence,
  InMemoryJobQueue,
  JobCatalog,
  JobExecutionError,
  type JobQueue,
} from "@crm/core/jobs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { bindSignals } from "./main";
import { HandlerRegistry, type JobHandler, Worker } from "./worker";

function required<T>(value: T | undefined): T {
  if (value === undefined) throw new Error("Expected a claimed job");
  return value;
}

const definition = {
  kind: "sync",
  version: 1,
  referenceKeys: ["mailboxId", "connectionGeneration"],
  retrySafe: true,
};
const org = { organizationId: "org-a" };
function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}
function setup(run: JobHandler["run"] = async () => {}, overrides: Partial<JobHandler> = {}) {
  const catalog = new JobCatalog([definition]);
  const queue = new InMemoryJobQueue(catalog, Date.now, () => 1);
  const handler: JobHandler = {
    kind: "sync",
    version: 1,
    isCurrent: async () => true,
    run,
    ...overrides,
  };
  const cleanup = vi.fn();
  const events = vi.fn();
  const worker = new Worker({
    queue,
    catalog,
    workerId: "worker-a",
    handlers: new HandlerRegistry([handler]),
    cleanup,
    onEvent: events,
  });
  const enqueue = (id: string, mailboxId = id) =>
    queue.enqueue(org, {
      kind: "sync",
      payloadVersion: 1,
      payload: { mailboxId, connectionGeneration: "generation-1" },
      idempotencyKey: id,
    });
  return { worker, queue, catalog, handler, cleanup, events, enqueue };
}
async function flush() {
  await vi.advanceTimersByTimeAsync(0);
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(10000);
});
afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
});

describe("worker lifecycle", () => {
  it("limits concurrency and drains owned leases on SIGTERM without further claims", async () => {
    const hold = deferred();
    const run = vi.fn(async () => hold.promise);
    const { worker, enqueue, queue, cleanup } = setup(run);
    const jobs = await Promise.all([enqueue("one"), enqueue("two"), enqueue("three")]);
    const signals = new EventEmitter();
    const exit = vi.fn();
    bindSignals(worker, signals, exit);
    worker.start();
    await flush();
    expect(worker.ready).toBe(true);
    expect(run).toHaveBeenCalledTimes(2);
    signals.emit("SIGTERM");
    signals.emit("SIGTERM");
    expect(worker.ready).toBe(false);
    await vi.advanceTimersByTimeAsync(20000);
    const states = await Promise.all(jobs.map((job) => queue.get(org, job.id)));
    expect(
      states
        .filter((job) => job?.status === "running")
        .every((job) => job?.leaseExpiresAt === 90000),
    ).toBe(true);
    hold.resolve();
    await flush();
    expect(exit).toHaveBeenCalledExactlyOnceWith(false);
    expect(cleanup).toHaveBeenCalledOnce();
    expect(signals.listenerCount("SIGTERM")).toBe(0);
    expect(signals.listenerCount("SIGINT")).toBe(0);
    const finished = await Promise.all(jobs.map((job) => queue.get(org, job.id)));
    expect(finished.filter((job) => job?.status === "queued")).toHaveLength(1);
    expect(run).toHaveBeenCalledTimes(2);
  });
  it("forces a hung handler after 30 seconds, aborts it and rejects late completion", async () => {
    const hold = deferred();
    let signal: AbortSignal | undefined;
    const { worker, enqueue, queue, cleanup, events } = setup(async (ctx) => {
      signal = ctx.signal;
      await hold.promise;
    });
    const job = await enqueue("one");
    worker.start();
    await flush();
    const stop = worker.stop();
    await vi.advanceTimersByTimeAsync(29999);
    expect(signal?.aborted).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    expect(await stop).toEqual({ forced: true });
    await flush();
    expect(signal?.aborted).toBe(true);
    expect(cleanup).toHaveBeenCalledOnce();
    expect(events).toHaveBeenCalledWith("forced_stop");
    hold.resolve();
    await flush();
    expect((await queue.get(org, job.id))?.status).toBe("running");
    await vi.advanceTimersByTimeAsync(60000);
    await queue.recoverExpired(100);
    expect((await queue.get(org, job.id))?.status).toBe("queued");
  });
  it("keeps forced shutdown bounded even when cleanup never resolves", async () => {
    const { queue, catalog } = setup();
    const cleanup = vi.fn(() => new Promise<void>(() => {}));
    const worker = new Worker({
      queue,
      catalog,
      workerId: "worker-a",
      handlers: new HandlerRegistry([]),
      cleanup,
    });
    worker.start();
    await flush();
    const stop = worker.stop();
    await vi.advanceTimersByTimeAsync(30000);
    expect(await stop).toEqual({ forced: true });
    expect(cleanup).toHaveBeenCalledOnce();
  });
  it("cancels a stale connection generation before calling the handler", async () => {
    const run = vi.fn();
    const { worker, enqueue, queue } = setup(run, { isCurrent: async () => false });
    const job = await enqueue("one");
    worker.start();
    await flush();
    await worker.stop();
    expect(run).not.toHaveBeenCalled();
    expect(await queue.get(org, job.id)).toMatchObject({
      status: "cancelled",
      lastErrorCode: "connection_cancelled",
    });
  });
  it("rechecks generation at checkpoints before another external effect", async () => {
    let current = true;
    const effect = vi.fn();
    const { worker, enqueue, queue } = setup(
      async (ctx) => {
        current = false;
        await ctx.checkpoint();
        effect();
      },
      { isCurrent: async () => current },
    );
    const job = await enqueue("one");
    worker.start();
    await flush();
    await worker.stop();
    expect(effect).not.toHaveBeenCalled();
    expect((await queue.get(org, job.id))?.status).toBe("cancelled");
  });
  it("derives tenant from row and preserves idempotent domain checkpoint replay after a crash", async () => {
    const committed = new Set<string>();
    let effects = 0;
    const { worker, enqueue, queue } = setup(async (ctx) => {
      expect(ctx.organizationId).toBe("org-a");
      await ctx.checkpoint();
      const key = `${ctx.organizationId}:${ctx.job.payload.mailboxId}:page-one`;
      if (!committed.has(key)) {
        committed.add(key);
        effects++;
      }
    });
    const job = await enqueue("one");
    // Simulate process death after a domain checkpoint but before acknowledgement.
    const [first] = await queue.claim({ workerId: "dead-worker", limit: 1, leaseMs: 1000 });
    committed.add("org-a:one:page-one");
    effects++;
    await vi.advanceTimersByTimeAsync(1000);
    await queue.recoverExpired(1);
    expect(await queue.succeed(fence(required(first)))).toBe(false);
    await vi.advanceTimersByTimeAsync(5000);
    worker.start();
    await flush();
    await worker.stop();
    expect(effects).toBe(1);
    expect(await queue.get(org, job.id)).toMatchObject({ status: "succeeded", attempts: 2 });
  });
  it("serializes a mailbox locally and releases its gate", async () => {
    const hold = deferred();
    const run = vi.fn(async () => hold.promise);
    const { worker, enqueue, queue } = setup(run);
    const first = await enqueue("one", "mailbox-a");
    const second = await enqueue("two", "mailbox-a");
    worker.start();
    await flush();
    expect(run).toHaveBeenCalledOnce();
    const states = await Promise.all([queue.get(org, first.id), queue.get(org, second.id)]);
    expect(states.filter((job) => job?.status === "queued")).toHaveLength(1);
    hold.resolve();
    await flush();
    await vi.advanceTimersByTimeAsync(5000);
    expect(run).toHaveBeenCalledTimes(2);
    await worker.stop();
    expect((await queue.get(org, second.id))?.status).toBe("succeeded");
  });
  it("aborts on lease renewal loss and never writes a stale result", async () => {
    const hold = deferred();
    let signal: AbortSignal | undefined;
    const { worker, enqueue, queue, events } = setup(async (ctx) => {
      signal = ctx.signal;
      await hold.promise;
    });
    const job = await enqueue("one");
    worker.start();
    await flush();
    vi.spyOn(queue, "renew").mockResolvedValue(false);
    await vi.advanceTimersByTimeAsync(20000);
    expect(signal?.aborted).toBe(true);
    hold.resolve();
    await flush();
    await worker.stop();
    expect(events).toHaveBeenCalledWith("ownership_lost");
    expect((await queue.get(org, job.id))?.status).toBe("running");
  });
  it("does not leak provider exceptions and respects a safe retry classification", async () => {
    const { worker, enqueue, queue } = setup(async () => {
      throw new Error("secret provider body");
    });
    const job = await enqueue("one");
    worker.start();
    await flush();
    await worker.stop();
    expect(await queue.get(org, job.id)).toMatchObject({
      status: "failed",
      lastErrorCode: "internal",
    });
    expect(JSON.stringify(await queue.get(org, job.id))).not.toContain("secret provider body");
    const retry = setup(async () => {
      throw new JobExecutionError({ code: "rate_limited", retryable: true, retryAfter: 100000 });
    });
    const retryJob = await retry.enqueue("one");
    retry.worker.start();
    await flush();
    await retry.worker.stop();
    expect(await retry.queue.get(org, retryJob.id)).toMatchObject({
      status: "queued",
      runAt: 100000,
    });
  });
  it("rejects hostile payloads returned by a fake adapter before handler dispatch", async () => {
    const { queue, catalog, enqueue } = setup();
    await enqueue("one");
    const claim = queue.claim.bind(queue);
    vi.spyOn(queue, "claim").mockImplementation(async (input) =>
      (await claim(input)).map((row) => ({
        ...row,
        payload: { ...row.payload, organizationId: "org-victim" },
      })),
    );
    const run = vi.fn();
    const worker = new Worker({
      queue,
      catalog,
      workerId: "worker-a",
      handlers: new HandlerRegistry([
        { kind: "sync", version: 1, isCurrent: async () => true, run },
      ]),
    });
    worker.start();
    await flush();
    await worker.stop();
    expect(run).not.toHaveBeenCalled();
  });
  it("polls again after queue outage and marks readiness unavailable safely", async () => {
    const { worker, queue, events } = setup();
    vi.spyOn(queue, "recoverExpired").mockRejectedValueOnce(new Error("private connection string"));
    worker.start();
    await flush();
    expect(worker.ready).toBe(false);
    expect(events).toHaveBeenCalledExactlyOnceWith("queue_unavailable");
    await vi.advanceTimersByTimeAsync(5000);
    expect(worker.ready).toBe(true);
    await worker.stop();
  });
  it("fails a known job visibly when no handler is registered", async () => {
    const { queue, catalog, enqueue } = setup();
    const job = await enqueue("one");
    const worker = new Worker({
      queue,
      catalog,
      workerId: "worker-a",
      handlers: new HandlerRegistry([]),
    });
    worker.start();
    await flush();
    await worker.stop();
    expect(await queue.get(org, job.id)).toMatchObject({
      status: "failed",
      lastErrorCode: "handler_missing",
    });
  });
  it("stops renewing and retries safely after a handler crash before its checkpoint", async () => {
    const { worker, enqueue, queue } = setup(async () => {
      throw new JobExecutionError({ code: "transient", retryable: true });
    });
    const job = await enqueue("one");
    worker.start();
    await flush();
    await worker.stop();
    expect(await queue.get(org, job.id)).toMatchObject({
      status: "queued",
      attempts: 1,
      runAt: 15000,
    });
    expect(vi.getTimerCount()).toBe(0);
  });
  it("imports without starting a worker or opening a connection", async () => {
    const timer = vi.spyOn(globalThis, "setTimeout");
    await import("./main");
    expect(timer).not.toHaveBeenCalled();
  });
  it("does not execute effects when stopping during an in-flight claim", async () => {
    const { queue, catalog, enqueue } = setup();
    await enqueue("one");
    const held = deferred();
    const claim = queue.claim.bind(queue);
    vi.spyOn(queue, "claim").mockImplementation(async (input) => {
      const jobs = await claim(input);
      await held.promise;
      return jobs;
    });
    const run = vi.fn();
    const worker = new Worker({
      queue: queue as JobQueue,
      catalog,
      workerId: "worker-a",
      handlers: new HandlerRegistry([
        { kind: "sync", version: 1, isCurrent: async () => true, run },
      ]),
    });
    worker.start();
    await flush();
    const stop = worker.stop();
    held.resolve();
    await flush();
    await stop;
    expect(run).not.toHaveBeenCalled();
  });
});
