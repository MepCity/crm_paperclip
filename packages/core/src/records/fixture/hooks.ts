import type { FieldValue, RecordData, RecordInput } from "../contract";

export interface FixtureModuleStore {
  records: Map<string, RecordData>;
  nextId: bigint;
}

/** Internal fixture access shared by synchronous module lifecycle hooks. */
export interface FixtureHookContext {
  registeredModules: readonly string[];
  moduleStore: (module: string) => FixtureModuleStore;
}

export interface FixtureModuleHooks {
  applyRules?: (
    fields: Record<string, FieldValue>,
    input: RecordInput,
    previous: Readonly<Record<string, FieldValue>> | undefined,
    ctx: FixtureHookContext,
  ) => void;
  /** Required fields that may stay empty for this record's field values. */
  optionalFields?: (fields: Readonly<Record<string, FieldValue>>) => readonly string[];
  readRecord?: (record: RecordData, now: Date) => RecordData;
  afterWrite?: (
    record: RecordData,
    previous: RecordData | undefined,
    ctx: FixtureHookContext,
  ) => void;
  afterDelete?: (ids: readonly string[], ctx: FixtureHookContext) => void;
  /** Transfer children on staged stores, before generic lookup reassignment. */
  transferMergedRecords?: (
    ids: readonly string[],
    masterId: string,
    ctx: FixtureHookContext,
  ) => void;
  afterSeed?: (ctx: FixtureHookContext) => void;
  orderRows?: (rows: RecordData[]) => void;
  /** Delete these related rows when their parent is removed by a merge. */
  mergeRelatedRecords?: readonly { module: string; field: string }[];
}
