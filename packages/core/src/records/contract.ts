import type { OrgContext } from "../tenancy/types";

export type ModuleApiName = string;
/** Opaque; callers never parse or construct record identifiers. */
export type RecordId = string;

/** Data types supported by the module record contract. */
export type FieldDataType =
  | "ALARM"
  | "RRULE"
  | "text"
  | "textarea"
  | "email"
  | "phone"
  | "website"
  | "picklist"
  | "integer"
  | "currency"
  | "boolean"
  | "date"
  | "datetime"
  | "double"
  | "bigint"
  | "lookup"
  | "ownerlookup"
  | "profileimage"
  | "multi_module_lookup";

/** A reference to a record in one of the connected modules. */
export type ModuleRecordReference = {
  module: ModuleApiName;
  id: RecordId;
  name?: string;
};

/**
 * Text-like values, calendar dates (YYYY-MM-DD), timestamps, images, long integers
 * and owner IDs use strings. Numeric values use finite numbers; checkboxes use
 * booleans. Lookup references include their module, ID and optional display name. Null is
 * an empty field. ALARM/RRULE carry opaque plain JSON objects; their dataType
 * distinguishes them from references. This representation is transport-independent.
 */
export type JsonValue = string | number | boolean | null | JsonObject | JsonValue[];
export type JsonObject = { [key: string]: JsonValue };
export type FieldValue = string | number | boolean | ModuleRecordReference | JsonObject | null;

export type StageCategory = "Open" | "Closed Won" | "Closed Lost";

export interface PicklistStageMeta {
  probability: number;
  forecastCategory: string;
  category: StageCategory;
}

export interface PicklistOption {
  displayValue: string;
  storedValue: string;
  stage?: PicklistStageMeta;
}

export interface FieldViewFlags {
  view: boolean;
  create: boolean;
  edit: boolean;
  quickCreate: boolean;
}

export interface FieldDefinition {
  massUpdate: boolean;
  views: FieldViewFlags;
  apiName: string;
  label: string;
  dataType: FieldDataType;
  required: boolean;
  readOnly: boolean;
  unique: boolean;
  maxLength?: number;
  picklist?: readonly PicklistOption[];
  lookup?: { module: ModuleApiName; modules?: readonly ModuleApiName[] };
}

export interface LayoutSection {
  label: string;
  columnCount: number;
  columns: readonly (readonly string[])[];
  fields: readonly string[];
}

export interface ModuleMetadata {
  apiName: ModuleApiName;
  singularLabel: string;
  pluralLabel: string;
  businessCardFields: readonly string[];
  fields: readonly FieldDefinition[];
  layout: readonly LayoutSection[];
}

export interface RecordData {
  id: RecordId;
  /** Keys are field API names, including owner and creation/modification fields. */
  fields: Readonly<Record<string, FieldValue>>;
}

/** Saved-view wire literals plus interim filter-panel comparators. */
export type Comparator =
  | "equal"
  | "contains"
  | "not_contains"
  | "less_equal"
  | "not_equal"
  | "starts_with"
  | "ends_with"
  | "is_empty"
  | "is_not_empty"
  | "less_than"
  | "greater_than"
  | "greater_equal"
  | "between"
  | "not_between";

/** Interim age/due and relative panel units (UTC calendar rules). */
export type CriteriaUnit = "days" | "weeks" | "months";

/** Interim UTC calendar periods; TODAY retains its existing standalone token. */
export type CriteriaPeriod =
  | "TOMORROW"
  | "YESTERDAY"
  | "TILL_YESTERDAY"
  | "STARTING_TOMORROW"
  | "THIS_WEEK"
  | "PREVIOUS_WEEK"
  | "THIS_MONTH"
  | "PREVIOUS_MONTH"
  | "THIS_YEAR"
  | "PREVIOUS_YEAR"
  | "NEXT_YEAR";

/** A `${…}` value of a view definition; the adapter resolves it when the query runs. */
export type CriteriaToken =
  | { token: "CURRENTUSER" }
  | { token: "TODAY" }
  | { token: "NEXT7DAYS" }
  | { token: "TODAYANDOVERDUE" }
  | { token: "AGEINDAYS"; offset: number; unit?: CriteriaUnit }
  | { token: "CATEGORY"; name: string }
  | { token: "DUEINDAYS"; offset: number; unit?: CriteriaUnit }
  | {
      token: "RELATIVE";
      direction: "previous" | "next";
      count: number;
      unit: CriteriaUnit;
    }
  | { token: "PERIOD"; name: CriteriaPeriod };

export type CriteriaValue = FieldValue | readonly FieldValue[] | CriteriaToken;

export type Criteria =
  | { field: string; comparator: Comparator; value: CriteriaValue }
  | { groupOperator: "and" | "or"; group: readonly Criteria[] };

export interface SortSpec {
  field: string;
  order: "asc" | "desc";
}

export interface ListView {
  id: string;
  name: string;
  systemDefined: boolean;
  isDefault: boolean;
  columns: readonly string[];
  criteria: Criteria | null;
  sort: SortSpec | null;
}

export type ActivityKind = "task" | "meeting" | "call";
export type ActivityDueRange = "today" | "tomorrow" | "next_7_days" | "today_overdue";
export type ActivityFilterValue =
  | { choice: "without_open_activity" | "overdue" | "without_any_activity" | "activity_done" }
  | { choice: "activity_due"; range: ActivityDueRange };
export interface ActivitySummary {
  kind: ActivityKind;
  activityId: RecordId;
  date: string | null;
}

export interface ListQuery {
  viewId: string;
  /** One-based page number. */
  page: number;
  /** One of the six page sizes documented in the list specification. */
  perPage: number;
  /** Field projection; id is always included. Omitted returns all fields. */
  fields?: readonly string[];
  sort?: SortSpec;
  filters?: Criteria;
  search?: string;
  activityFilter?: ActivityFilterValue;
  includeActivitySummary?: boolean;
}

export type SummaryQuery = Pick<ListQuery, "viewId" | "filters" | "search" | "activityFilter"> & {
  groupBy: string;
  sum?: string;
};

export interface GroupSummary {
  value: string | null;
  count: number;
  sum: number | null;
}

export interface ListResult {
  activitySummaries?: Readonly<Record<RecordId, ActivitySummary>>;
  records: readonly RecordData[];
  page: number;
  perPage: number;
  moreRecords: boolean;
  /** The order the adapter applied: query sort, else view sort, else the default. */
  sort: SortSpec;
}

export type RecordInput = Readonly<Record<string, FieldValue>>;

export interface SearchQuery {
  text: string;
  /** Only the record name field; tags arrive with Module 6. */
  scope?: "all" | "nameOrTags";
  /** Omitted means every registered module. */
  modules?: readonly ModuleApiName[];
  filters?: Criteria;
  sort?: SortSpec;
  /** One-based, applied to each module group. */
  page?: number;
  perPage?: number;
  fields?: readonly string[];
}
export interface SearchGroup {
  module: ModuleApiName;
  total: number;
  records: readonly RecordData[];
}
export interface MergeInput {
  masterId: RecordId;
  /** One or two other records of the same module. */
  duplicateIds: readonly RecordId[];
  /** Omitted fields retain the master's values. */
  values: RecordInput;
}
export interface DuplicateGroup {
  records: readonly RecordData[];
  /** Fields whose non-empty values differ in the group. */
  conflictFields: readonly string[];
}
export interface DeduplicateResult {
  mergedGroups: number;
  removedRecords: number;
  conflicts: readonly DuplicateGroup[];
}

/** The organization's home currency. `symbol` is configured display text, never derived from a locale. */
export interface CurrencyDefinition {
  /** ISO 4217 code; the argument `formatCurrency` expects. */
  isoCode: string;
  symbol: string;
  name: string;
  /** True when the symbol is written before the amount. */
  prefixSymbol: boolean;
}

/**
 * update, massUpdate, changeOwner and delete reject Locked__s === true with
 * RecordLockedError. Batch operations validate all targets before writing;
 * a locked target leaves every target unchanged.
 */
export interface RecordService {
  search(query: SearchQuery): Promise<readonly SearchGroup[]>;
  findDuplicateGroups(
    module: ModuleApiName,
    fields: readonly string[],
  ): Promise<readonly DuplicateGroup[]>;
  merge(module: ModuleApiName, input: MergeInput): Promise<RecordData>;
  deduplicate(module: ModuleApiName, fields: readonly string[]): Promise<DeduplicateResult>;
  getHomeCurrency(): Promise<CurrencyDefinition>;
  getModule(module: ModuleApiName): Promise<ModuleMetadata>;
  listViews(module: ModuleApiName): Promise<readonly ListView[]>;
  getView(module: ModuleApiName, viewId: string): Promise<ListView>;
  list(module: ModuleApiName, query: ListQuery): Promise<ListResult>;
  count(
    module: ModuleApiName,
    query: Pick<ListQuery, "viewId" | "filters" | "search" | "activityFilter">,
  ): Promise<number>;
  summarize(module: ModuleApiName, query: SummaryQuery): Promise<readonly GroupSummary[]>;
  get(module: ModuleApiName, id: RecordId): Promise<RecordData>;
  create(module: ModuleApiName, input: RecordInput): Promise<RecordData>;
  update(module: ModuleApiName, id: RecordId, input: RecordInput): Promise<RecordData>;
  massUpdate(module: ModuleApiName, ids: readonly RecordId[], input: RecordInput): Promise<void>;
  changeOwner(module: ModuleApiName, ids: readonly RecordId[], ownerId: string): Promise<void>;
  delete(module: ModuleApiName, ids: readonly RecordId[]): Promise<void>;
}

export type RecordServiceFactory = (ctx: OrgContext) => RecordService;

/** All allowed targets; a single-target field retains its existing default. */
export function lookupTargetModules(field: FieldDefinition): readonly ModuleApiName[] {
  return field.lookup?.modules ?? (field.lookup ? [field.lookup.module] : []);
}
