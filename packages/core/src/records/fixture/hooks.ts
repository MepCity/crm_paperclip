import type { FieldValue, RecordData, RecordInput } from "../contract";

import type { Tag } from "../tags";

export interface FixtureModuleStore {
  tags?: Map<string, Tag>;
  tagLinks?: Map<string, Set<string>>;
  records: Map<string, RecordData>;
  nextId: bigint;
  attachmentCleanupIntents?: { attachmentId: string; storageKey: string | null }[];
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
