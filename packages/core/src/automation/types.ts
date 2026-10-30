import type { Criteria, FieldValue, ModuleApiName, RecordId } from "../records/contract";
import type { OrgContext } from "../tenancy/types";

// Read-only automation contract from ADR 0013 section 1. No write methods exist.
export type RuleId = string;
export type Revision = string;
export type FieldId = string;
export type ActionId = string;
export type Instant = string;
export type RecordRef = Readonly<{ module: ModuleApiName; id: RecordId }>;
export type Condition =
  | Readonly<{ kind: "all_records" }>
  | Readonly<{ kind: "criteria"; criteria: Criteria }>;
export type Trigger =
  | Readonly<{ kind: "record"; on: "create" | "edit" | "create_or_edit" | "delete" }>
  | Readonly<{ kind: "field_change"; fields: readonly FieldId[] }>
  | Readonly<{ kind: "date"; field: FieldId; timezone: string }>;
export type ActionKind =
  | "notification"
  | "activity"
  | "field_update"
  | "webhook"
  | "function"
  | "record_create"
  | "conversion";
export type Action = Readonly<{ id: ActionId; kind: ActionKind; definitionRef: string }>;
export type Timing =
  | Readonly<{ kind: "event_relative"; offsetSeconds: number }>
  | Readonly<{ kind: "field_relative"; field: FieldId; offsetSeconds: number; timezone: string }>;
export type Branch = Readonly<{
  id: string;
  position: number;
  condition: Condition;
  immediate: readonly Action[];
  scheduled: readonly Readonly<{ id: string; timing: Timing; actions: readonly Action[] }>[];
}>;
export type RuleBase = Readonly<{
  id: RuleId;
  revision: Revision;
  module: ModuleApiName;
  name: string;
  description: string;
  enabled: boolean;
  position: number;
}>;
export type WorkflowRule = RuleBase &
  Readonly<{ kind: "workflow"; trigger: Trigger; branches: readonly Branch[] }>;
export type RecipientSet =
  | Readonly<{ kind: "users" | "roles" | "groups"; refs: readonly string[] }>
  | Readonly<{ kind: "user_conditions"; definitionRef: string }>;
export type AssignmentEntry = Readonly<{
  id: string;
  position: number;
  condition: Condition;
  recipients: RecipientSet;
  distribution: "single" | "round_robin";
  availability: "unresolved" | "ignore" | "require_available";
}>;
export type AssignmentRule = RuleBase &
  Readonly<{
    kind: "assignment";
    entries: readonly AssignmentEntry[];
    fallback: RecipientSet | null;
  }>;
export type AutomationRule = WorkflowRule | AssignmentRule;
export type ReadFailure = Readonly<{
  code: "forbidden" | "not_found" | "unavailable" | "invalid_query";
}>;
export type ReadResult<T> =
  | Readonly<{ ok: true; value: T }>
  | Readonly<{ ok: false; error: ReadFailure }>;
export type RuleSummary = Pick<
  AutomationRule,
  "id" | "revision" | "module" | "name" | "description" | "enabled" | "position" | "kind"
>;
export type RulePage = Readonly<{ items: readonly RuleSummary[]; nextCursor: string | null }>;

export interface AutomationPort {
  list(
    ctx: OrgContext,
    query: Readonly<{
      kind: AutomationRule["kind"];
      module?: ModuleApiName;
      cursor?: string;
      limit: number;
    }>,
  ): Promise<ReadResult<RulePage>>;
  get(
    ctx: OrgContext,
    query: Readonly<{ kind: AutomationRule["kind"]; id: RuleId }>,
  ): Promise<ReadResult<AutomationRule>>;
}

export interface AutomationFieldReader {
  read(
    ctx: OrgContext,
    record: RecordRef,
    fields: readonly FieldId[],
    expectedRecordVersion: string,
    schemaRevision: Revision,
  ): Promise<ReadonlyMap<FieldId, FieldValue>>;
}
