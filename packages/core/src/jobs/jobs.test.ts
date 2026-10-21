import { describe, expect, it } from "vitest";
import {
  fence,
  InMemoryJobQueue,
  JobCatalog,
  JobExecutionError,
  retryDelay,
  safeFailure,
} from "./index";

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
const input = {
  kind: "sync",
  payloadVersion: 1,
  payload: { mailboxId: "mailbox-a", connectionGeneration: "generation-1" },
  idempotencyKey: "sync-1",
};
const org = { organizationId: "org-a" };
function setup(retrySafe = true, random = () => 1) {
  let now = 10000;
  const catalog = new JobCatalog([{ ...definition, retrySafe }]);
  const queue = new InMemoryJobQueue(catalog, () => now, random);
  return {
    queue,
    setNow: (value: number) => {
      now = value;
    },
    claim: () => queue.claim({ workerId: "worker-a", limit: 2, leaseMs: 60000 }),
  };
}

describe("in-memory JobQueue contract", () => {
  it.each([
    { ...input, kind: "unknown" },
    { ...input, payloadVersion: 2 },
    { ...input, payloadVersion: "1" as unknown as number },
    { ...input, payload: { ...input.payload, organizationId: "org-victim" } },
    { ...input, payload: { ...input.payload, body: "private content" } },
    { ...input, payload: { mailboxId: "mailbox-a" } },
    { ...input, payload: { ...input.payload, mailboxId: { id: "nested" } } },
    { ...input, payload: { ...input.payload, mailboxId: "x".repeat(4097) } },
    { ...input, payload: { ...input.payload, mailboxId: "person@example.invalid" } },
  ])("rejects strict payload/version violations safely", async (bad) => {
    const { queue } = setup();
    await expect(queue.enqueue(org, bad)).rejects.toThrow("invalid_payload");
  });
  it("deduplicates across terminal states without resetting original intent", async () => {
    const { queue, claim, setNow } = setup();
    const original = await queue.enqueue(org, input);
    const [job] = await claim();
    await queue.succeed(fence(required(job)));
    setNow(20000);
    const duplicate = await queue.enqueue(org, input);
    expect(duplicate).toMatchObject({
      id: original.id,
      status: "succeeded",
      attempts: 1,
      runAt: 10000,
    });
    await expect(
      queue.enqueue(org, { ...input, payload: { ...input.payload, mailboxId: "different" } }),
    ).rejects.toThrow("enqueue_conflict");
    await expect(queue.enqueue(org, { ...input, runAt: 50000 })).rejects.toThrow(
      "enqueue_conflict",
    );
  });
  it("uses tenant envelope, isolates keys and reads, and returns detached snapshots", async () => {
    const { queue, claim } = setup();
    const a = await queue.enqueue(org, input);
    const b = await queue.enqueue({ organizationId: "org-b" }, input);
    expect(a.id).not.toBe(b.id);
    expect(await queue.get(org, b.id)).toBeUndefined();
    a.status = "failed";
    expect((await claim()).map((job) => [job.organizationId, job.status])).toEqual(
      expect.arrayContaining([
        ["org-a", "running"],
        ["org-b", "running"],
      ]),
    );
  });
  it("claims due jobs only and never hands the same lease to competing workers", async () => {
    const { queue, setNow } = setup();
    await queue.enqueue(org, { ...input, runAt: 12000 });
    const request = { workerId: "worker-a", limit: 2, leaseMs: 1000 };
    expect(await queue.claim(request)).toEqual([]);
    setNow(12000);
    const claims = await Promise.all([
      queue.claim(request),
      queue.claim({ ...request, workerId: "worker-b" }),
    ]);
    expect(claims.flat()).toHaveLength(1);
  });
  it("bounds tenant concurrency so another tenant can claim", async () => {
    const { queue } = setup();
    await queue.enqueue(org, input);
    await queue.enqueue(org, { ...input, idempotencyKey: "sync-2" });
    await queue.enqueue({ organizationId: "org-b" }, input);
    const jobs = await queue.claim({
      workerId: "worker-a",
      limit: 2,
      leaseMs: 1000,
      maxRunningPerOrganization: 1,
    });
    expect(new Set(jobs.map((job) => job.organizationId)).size).toBe(2);
  });
  it("rejects expired/foreign fences and reclaims with a fresh token after backoff", async () => {
    const { queue, claim, setNow } = setup();
    await queue.enqueue(org, input);
    const [job] = await claim();
    const old = fence(required(job));
    expect(await queue.succeed({ ...old, organizationId: "org-b" })).toBe(false);
    expect(await queue.renew({ ...old, lockedBy: "worker-b" }, 1000)).toBe(false);
    setNow(70000);
    expect(await queue.succeed(old)).toBe(false);
    expect(await queue.renew(old, 1000)).toBe(false);
    expect(await queue.recoverExpired(1)).toBe(1);
    expect(await claim()).toEqual([]);
    setNow(75000);
    const [fresh] = await claim();
    expect(fresh?.leaseToken).not.toBe(old.leaseToken);
    expect(fresh?.attempts).toBe(2);
    expect(await queue.fail(old, { code: "transient", retryable: true })).toBe(false);
    expect(await queue.cancel(old)).toBe(false);
    expect(await queue.succeed(fence(required(fresh)))).toBe(true);
  });
  it("renews the lease and clears all lease fields at completion", async () => {
    const { queue, claim, setNow } = setup();
    await queue.enqueue(org, input);
    const [job] = await claim();
    setNow(69000);
    expect(await queue.renew(fence(required(job)), 60000)).toBe(true);
    setNow(71000);
    expect(await queue.recoverExpired(1)).toBe(0);
    await queue.succeed(fence(required(job)));
    expect(await queue.get(org, required(job).id)).toMatchObject({
      status: "succeeded",
      lockedBy: null,
      leaseToken: null,
      leaseExpiresAt: null,
      finishedAt: 71000,
    });
  });
  it("honors Retry-After and stops at max attempts", async () => {
    const { queue, claim, setNow } = setup();
    await queue.enqueue(org, { ...input, maxAttempts: 2 });
    const [first] = await claim();
    await queue.fail(fence(required(first)), {
      code: "rate_limited",
      retryable: true,
      retryAfter: 100000,
    });
    setNow(99999);
    expect(await claim()).toEqual([]);
    setNow(100000);
    const [last] = await claim();
    await queue.fail(fence(required(last)), { code: "transient", retryable: true });
    expect(await queue.get(org, required(first).id)).toMatchObject({
      status: "failed",
      attempts: 2,
      finishedAt: 100000,
    });
  });
  it("counts crashes toward max attempts and holds uncertain effects without replay", async () => {
    for (const retrySafe of [true, false]) {
      const { queue, claim, setNow } = setup(retrySafe);
      await queue.enqueue(org, { ...input, maxAttempts: 1 });
      const [job] = await claim();
      setNow(70000);
      await queue.recoverExpired(100);
      expect(await queue.get(org, required(job).id)).toMatchObject({
        status: "failed",
        lastErrorCode: retrySafe ? "lease_expired" : "delivery_unknown",
      });
      expect(await claim()).toEqual([]);
    }
  });
  it("holds unsafe crash recovery even with attempts remaining", async () => {
    const { queue, claim, setNow } = setup(false);
    await queue.enqueue(org, input);
    const [job] = await claim();
    setNow(70000);
    await queue.recoverExpired(1);
    expect(await queue.get(org, required(job).id)).toMatchObject({
      status: "failed",
      attempts: 1,
      lastErrorCode: "delivery_unknown",
    });
  });
  it("stores safe errors only and stops permanent failures", async () => {
    const { queue, claim } = setup();
    await queue.enqueue(org, input);
    const [job] = await claim();
    const failure = safeFailure(new Error("private provider body and credential"));
    await queue.fail(fence(required(job)), failure);
    expect(JSON.stringify(await queue.get(org, required(job).id))).not.toContain(
      "private provider",
    );
    expect(failure).toEqual({ code: "internal", retryable: false });
    expect(
      safeFailure(new JobExecutionError({ code: "authorization_revoked", retryable: false })),
    ).toEqual({ code: "authorization_revoked", retryable: false });
  });
  it("validates bounds and fences cancellation", async () => {
    const { queue, claim } = setup();
    await expect(queue.enqueue(org, { ...input, maxAttempts: 0 })).rejects.toThrow("invalid_input");
    await expect(queue.enqueue(org, { ...input, runAt: Number.NaN })).rejects.toThrow(
      "invalid_input",
    );
    await expect(queue.claim({ workerId: "worker-a", limit: 0, leaseMs: 1 })).rejects.toThrow(
      "invalid_input",
    );
    await queue.enqueue(org, input);
    const [job] = await claim();
    expect(await queue.cancel(fence(required(job)))).toBe(true);
    expect(await queue.succeed(fence(required(job)))).toBe(false);
    expect(await queue.get(org, required(job).id)).toMatchObject({
      status: "cancelled",
      lastErrorCode: "connection_cancelled",
    });
  });
});

describe("safe failure classification", () => {
  it.each([
    "invalid_payload",
    "resource_missing",
    "authorization_revoked",
    "permanent",
    "delivery_unknown",
  ] as const)("never automatically retries %s", (code) => {
    expect(safeFailure(new JobExecutionError({ code, retryable: true })).retryable).toBe(false);
  });
});

describe("full jitter", () => {
  it.each([1, 2, 5, 10, 100])("keeps attempt %i within exponential/capped bounds", (attempt) => {
    const cap = Math.min(900000, 5000 * 2 ** (attempt - 1));
    expect(retryDelay(attempt, () => 0)).toBe(0);
    expect(retryDelay(attempt, () => 1)).toBe(cap);
    expect(retryDelay(attempt, () => 0.5)).toBe(Math.floor(cap / 2));
  });
});
