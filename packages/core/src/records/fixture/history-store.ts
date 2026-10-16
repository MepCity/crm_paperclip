import type { RecordHistoryEvent } from "../history";

import type { RecordHistoryStore } from "../history-store";

export function fixtureHistoryStore(events: Map<string, RecordHistoryEvent>): RecordHistoryStore {
  return {
    appendBatch(batch) {
      const staged = new Map(events);
      const keys = new Map(
        [...events.values()].map((event) => [`${event.operationId}:${event.ordinal}`, event]),
      );
      for (const event of batch) {
        const key = `${event.operationId}:${event.ordinal}`;
        const existing = staged.get(event.id) ?? keys.get(key);
        if (existing) {
          if (JSON.stringify(existing) !== JSON.stringify(event))
            throw new Error("Conflicting history event.");
          continue;
        }
        const snapshot = structuredClone(event);
        staged.set(event.id, snapshot);
        keys.set(key, snapshot);
      }
      // All validation/cloning precedes publication, including idempotent retries.
      for (const [id, event] of staged) events.set(id, event);
    },
    readPage(stream, highWater) {
      return [...events.values()]
        .filter(
          (event) =>
            event.stream.module === stream.module &&
            event.stream.recordId === stream.recordId &&
            event.sequence <= highWater,
        )
        .sort(
          (a, b) => b.sequence - a.sequence || b.ordinal - a.ordinal || b.id.localeCompare(a.id),
        );
    },
  };
}
