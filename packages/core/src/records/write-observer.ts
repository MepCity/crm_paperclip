import type { RecordData } from "./contract";

/** A committed user write on one record. */
export interface RecordWriteEvent {
  module: string;
  kind: "create" | "edit";
  record: RecordData;
  previous: RecordData | undefined;
  /** The record's display name at write time. */
  label: string;
}

/**
 * Cross-module hook on the record write path (ADR 0018 §5). One generic observer
 * serves every module; it is not a per-module hook.
 */
export interface RecordWriteObserver {
  /** Refuses a write that the record's lock forbids. Runs before the write. */
  assertEditable(input: {
    module: string;
    ids: readonly string[];
    operation: "update" | "delete";
  }): Promise<void>;
  /**
   * Runs after the write committed. Must not fail the caller's write: the fixture
   * service swallows and logs whatever it throws.
   */
  afterWrite(event: RecordWriteEvent): Promise<void>;
  /**
   * Runs after records are deleted.
   */
  afterDelete?(event: { module: string; ids: readonly string[] }): Promise<void>;
}

export function combineWriteObservers(
  ...observers: readonly (RecordWriteObserver | undefined)[]
): RecordWriteObserver {
  const active = observers.filter((o): o is RecordWriteObserver => Boolean(o));
  return {
    async assertEditable(input) {
      for (const o of active) {
        await o.assertEditable(input);
      }
    },
    async afterWrite(event) {
      for (const o of active) {
        await o.afterWrite(event);
      }
    },
    async afterDelete(event) {
      for (const o of active) {
        if (o.afterDelete) {
          await o.afterDelete(event);
        }
      }
    },
  };
}
