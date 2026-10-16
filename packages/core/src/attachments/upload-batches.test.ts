import { describe, expect, it } from "vitest";
import { FilePolicyError, type SelectionKind, selectionBudget } from "./file-policy";
import { createUploadBatchRegistry, type UploadBatchKey } from "./upload-batches";

const key: UploadBatchKey = {
  organizationId: "org-a",
  userId: "user-a",
  batchId: "abcdef01-2345-6789-abcd-0123456789ab",
  kind: "record",
};
const secondKey = { ...key, batchId: "12345678-2345-6789-abcd-0123456789ab" };

function fixture(options: { ttlMs?: number; maxBatches?: number } = {}) {
  let time = 0;
  return {
    registry: createUploadBatchRegistry({ ...options, now: () => time }),
    at(value: number) {
      time = value;
    },
  };
}

function fails(action: () => void, code: "malformed" | "too_large") {
  expect(action).toThrow(FilePolicyError);
  expect(action).toThrow(expect.objectContaining({ code }));
}

describe("upload batch registry", () => {
  it.each<SelectionKind>(["record", "note"])("accepts inclusive %s limits atomically", (kind) => {
    const { registry } = fixture();
    const batchKey = { ...key, kind };
    const budget = selectionBudget(kind);
    // An oversized first attempt must not create or lock a batch.
    fails(() => registry.reserve(batchKey, budget.maxBytes + 1), "too_large");
    expect(registry.liveCount()).toBe(0);
    registry.reserve(batchKey, budget.maxBytes - 1);
    fails(() => registry.reserve(batchKey, 2), "too_large");
    registry.reserve(batchKey, 1);
    for (let i = 2; i < budget.maxFiles; i++) registry.reserve(batchKey, 0);
    fails(() => registry.reserve(batchKey, 0), "too_large");
    fails(() => registry.reserve(batchKey, 1), "too_large");
    // A rejected call did not consume bytes or a file slot.
    registry.release(batchKey, 1);
    registry.reserve(batchKey, 1);
    expect(registry.liveCount()).toBe(1);
  });

  it("isolates organizations, users and batches without delimiter collisions", () => {
    const { registry } = fixture();
    registry.reserve(key, 100_000_000);
    for (const other of [
      { ...key, organizationId: "org-b" },
      { ...key, userId: "user-b" },
      secondKey,
      { ...key, organizationId: "a:b", userId: "c" },
      { ...key, organizationId: "a", userId: "b:c" },
    ]) {
      registry.reserve(other, 100_000_000);
    }
    expect(registry.liveCount()).toBe(6);
  });

  it("accepts uppercase UUIDs and fixes the kind until expiry, including after release", () => {
    const { registry, at } = fixture({ ttlMs: 10 });
    registry.reserve({ ...key, batchId: key.batchId.toUpperCase() }, 0);
    fails(() => registry.reserve({ ...key, kind: "note" }, 0), "malformed");
    fails(() => registry.release({ ...key, kind: "note" }, 0), "malformed");
    registry.release(key, 0);
    fails(() => registry.reserve({ ...key, kind: "note" }, 0), "malformed");
    registry.reserve(key, 100_000_000);
    at(10);
    registry.reserve({ ...key, kind: "note" }, 20_000_000);
    expect(registry.liveCount()).toBe(1);
  });

  it("uses a fixed default ten-minute window, expiring exactly at the boundary", () => {
    const { registry, at } = fixture();
    registry.reserve(key, 99_999_999);
    at(599_999);
    registry.reserve(key, 1);
    fails(() => registry.reserve(key, 1), "too_large");
    at(600_000);
    registry.reserve(key, 100_000_000);
    expect(registry.liveCount()).toBe(1);
  });

  it("sweeps expired entries on liveCount, reserve and release, without timers", () => {
    const { registry, at } = fixture({ ttlMs: 10, maxBatches: 1 });
    registry.reserve(key, 0);
    at(9);
    expect(registry.liveCount()).toBe(1);
    at(10);
    expect(registry.liveCount()).toBe(0);
    registry.reserve(key, 0);
    at(20);
    registry.reserve(secondKey, 0);
    expect(registry.liveCount()).toBe(1);
    at(30);
    registry.release(key, 0);
    expect(registry.liveCount()).toBe(0);
  });

  it("release restores one file and its bytes, floors both counters, and ignores unknown/expired keys", () => {
    const { registry, at } = fixture({ ttlMs: 10 });
    registry.release(key, 12);
    expect(registry.liveCount()).toBe(0);
    registry.reserve(key, 100_000_000);
    for (let i = 1; i < 10; i++) registry.reserve(key, 0);
    registry.release(key, 7);
    registry.reserve(key, 7);
    fails(() => registry.reserve(key, 0), "too_large");
    for (let i = 0; i < 12; i++) registry.release(key, 100_000_000);
    registry.reserve(key, 100_000_000);
    fails(() => registry.reserve(key, 1), "too_large");
    for (let i = 1; i < 10; i++) registry.reserve(key, 0);
    fails(() => registry.reserve(key, 0), "too_large");
    at(10);
    registry.release(key, 1);
    expect(registry.liveCount()).toBe(0);
  });

  it("bounds new batches while existing ones keep working; expiry frees capacity", () => {
    const { registry, at } = fixture({ maxBatches: 1, ttlMs: 10 });
    registry.reserve(key, 1);
    fails(() => registry.reserve(secondKey, 0), "too_large");
    registry.reserve(key, 99_999_999);
    expect(registry.liveCount()).toBe(1);
    at(10);
    registry.reserve(secondKey, 100_000_000);
    expect(registry.liveCount()).toBe(1);
  });

  it("defaults to at most 10,000 live batches", () => {
    const { registry } = fixture();
    for (let i = 0; i < 10_000; i++) registry.reserve({ ...key, userId: `user-${i}` }, 0);
    expect(registry.liveCount()).toBe(10_000);
    fails(() => registry.reserve({ ...key, userId: "overflow" }, 0), "too_large");
    registry.reserve({ ...key, userId: "user-0" }, 0);
  });

  it.each(["", "not-a-uuid", "abcdef01-2345-6789-abcd-0123456789ag", `${key.batchId}\n`])(
    "rejects malformed batch id %j without creating a batch",
    (batchId) => {
      const { registry } = fixture();
      fails(() => registry.reserve({ ...key, batchId }, 0), "malformed");
      fails(() => registry.release({ ...key, batchId }, 0), "malformed");
      expect(registry.liveCount()).toBe(0);
    },
  );

  it.each([-1, 0.5, Number.NaN, Number.POSITIVE_INFINITY, Number.MAX_SAFE_INTEGER + 1])(
    "rejects invalid size %s without affecting existing reservations",
    (size) => {
      const { registry } = fixture();
      registry.reserve(key, 100_000_000);
      fails(() => registry.reserve(key, size), "malformed");
      fails(() => registry.release(key, size), "malformed");
      fails(() => registry.reserve(key, 1), "too_large");
      expect(registry.liveCount()).toBe(1);
    },
  );
});
