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
   * Runs after the write committed. The fixture service logs and ignores what it throws,
   * except a {@link WriteObserverFailure}: then it undoes the write and rethrows (fail closed).
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

// A registered symbol, so the check also holds when a bundler loads this module twice.
const FAIL_CLOSED = Symbol.for("crm.WriteObserverFailure");

/**
 * Thrown by an observer whose work is a condition of the write (the approval request): the
 * record service rolls the write back instead of keeping a record the observer never saw.
 */
export class WriteObserverFailure extends Error {
  override name = "WriteObserverFailure";
  readonly [FAIL_CLOSED] = true;

  constructor(message: string, cause?: unknown) {
    super(message, { cause });
  }
}

export function isWriteObserverFailure(error: unknown): error is WriteObserverFailure {
  return typeof error === "object" && error !== null && FAIL_CLOSED in error;
}
