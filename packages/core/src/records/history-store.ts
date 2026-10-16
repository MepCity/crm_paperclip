import type { RecordHistoryEvent } from "./history";

/** Tenant-bound internal transaction participant; the composition root supplies authorized tenant scope. Never exposed through the read service. */
export interface RecordHistoryStore {
  appendBatch(events: readonly RecordHistoryEvent[]): void;
  readPage(
    stream: { module: string; recordId: string },
    highWater: number,
  ): readonly RecordHistoryEvent[];
}
