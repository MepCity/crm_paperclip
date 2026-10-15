import { FilePolicyError, type SelectionKind, selectionBudget } from "./file-policy";

export interface UploadBatchKey {
  organizationId: string;
  userId: string;
  batchId: string;
  kind: SelectionKind;
}

interface Batch {
  kind: SelectionKind;
  expiresAt: number;
  files: number;
  bytes: number;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Process-local, in-memory budgets. Multi-instance deployments need a shared store (open question). */
export function createUploadBatchRegistry(
  options: { ttlMs?: number; maxBatches?: number; now?: () => number } = {},
) {
  const { ttlMs = 600_000, maxBatches = 10_000, now = Date.now } = options;
  const batches = new Map<string, Batch>();

  function sweep(): number {
    const time = now();
    for (const [id, batch] of batches) {
      if (time >= batch.expiresAt) batches.delete(id);
    }
    return time;
  }

  function identify(key: UploadBatchKey, size: number): string {
    if (
      key.batchId.length !== 36 ||
      !UUID.test(key.batchId) ||
      !Number.isSafeInteger(size) ||
      size < 0
    ) {
      throw new FilePolicyError("malformed", "Invalid upload batch or size");
    }
    return JSON.stringify([key.organizationId, key.userId, key.batchId.toLowerCase()]);
  }

  function checkKind(batch: Batch | undefined, key: UploadBatchKey): void {
    if (batch && batch.kind !== key.kind) {
      throw new FilePolicyError("malformed", "Upload batch kind cannot change");
    }
  }

  return {
    reserve(key: UploadBatchKey, size: number): void {
      const time = sweep();
      const id = identify(key, size);
      const batch = batches.get(id);
      checkKind(batch, key);
      const budget = selectionBudget(key.kind);
      const files = (batch?.files ?? 0) + 1;
      const bytes = (batch?.bytes ?? 0) + size;
      if (
        (!batch && batches.size >= maxBatches) ||
        files > budget.maxFiles ||
        bytes > budget.maxBytes
      ) {
        throw new FilePolicyError("too_large", "Upload batch exceeds the allowed budget");
      }
      batches.set(id, {
        kind: key.kind,
        expiresAt: batch?.expiresAt ?? time + ttlMs,
        files,
        bytes,
      });
    },
    release(key: UploadBatchKey, size: number): void {
      sweep();
      const id = identify(key, size);
      const batch = batches.get(id);
      checkKind(batch, key);
      if (!batch) return;
      batch.files = Math.max(0, batch.files - 1);
      batch.bytes = Math.max(0, batch.bytes - size);
    },
    liveCount(): number {
      sweep();
      return batches.size;
    },
  };
}
