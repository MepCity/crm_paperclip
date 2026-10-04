import type { OrgContext } from "../tenancy/types";

export type ModuleApiName = string;
/** Opaque; callers never parse or construct record identifiers. */
export type RecordId = string;

/** Only data types listed in the Leads field specification. */
export type FieldDataType =
  | "text"
  | "textarea"
  | "email"
  | "phone"
  | "website"
  | "picklist"
  | "integer"
  | "currency"
  | "boolean"
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
};

/**
 * Text-like values, timestamps, images, long integers and single-module references
 * use strings. Integer, decimal and currency values use finite numbers. Checkbox
 * values use booleans; connected-module references include their module. Null is
 * an empty field. This domain representation is independent of transport/storage.
 */
export type FieldValue = string | number | boolean | ModuleRecordReference | null;

export interface PicklistOption {
  displayValue: string;
  storedValue: string;
}

export interface FieldDefinition {
  apiName: string;
  label: string;
  dataType: FieldDataType;
  required: boolean;
  readOnly: boolean;
  unique: boolean;
  maxLength?: number;
  picklist?: readonly PicklistOption[];
  lookup?: { module: ModuleApiName };
}

export interface LayoutSection {
  label: string;
  columnCount: number;
  fields: readonly string[];
}

export interface ModuleMetadata {
  apiName: ModuleApiName;
  singularLabel: string;
  pluralLabel: string;
  fields: readonly FieldDefinition[];
  layout: readonly LayoutSection[];
}

export interface RecordData {
  id: RecordId;
  /** Keys are field API names, including owner and creation/modification fields. */
  fields: Readonly<Record<string, FieldValue>>;
}

/** The only comparator observed in the list specification. */
export type Comparator = "is";

export type Criteria =
  | { field: string; comparator: Comparator; value: FieldValue | readonly FieldValue[] }
  | { groupOperator: "and" | "or"; group: readonly Criteria[] };

export interface SortSpec {
  field: string;
  order: "asc" | "desc";
}

export interface ListView {
  id: string;
  name: string;
  systemDefined: boolean;
  columns: readonly string[];
  criteria: Criteria | null;
  sort: SortSpec | null;
}

export interface ListQuery {
  viewId: string;
  /** One-based page number. */
  page: number;
  /** One of the six page sizes documented in the list specification. */
  perPage: number;
  sort?: SortSpec;
  filters?: Criteria;
  search?: string;
}

export interface ListResult {
  records: readonly RecordData[];
  page: number;
  perPage: number;
  moreRecords: boolean;
}

export type RecordInput = Readonly<Record<string, FieldValue>>;

export interface RecordService {
  getModule(module: ModuleApiName): Promise<ModuleMetadata>;
  listViews(module: ModuleApiName): Promise<readonly ListView[]>;
  getView(module: ModuleApiName, viewId: string): Promise<ListView>;
  list(module: ModuleApiName, query: ListQuery): Promise<ListResult>;
  count(
    module: ModuleApiName,
    query: Pick<ListQuery, "viewId" | "filters" | "search">,
  ): Promise<number>;
  get(module: ModuleApiName, id: RecordId): Promise<RecordData>;
  create(module: ModuleApiName, input: RecordInput): Promise<RecordData>;
  update(module: ModuleApiName, id: RecordId, input: RecordInput): Promise<RecordData>;
  delete(module: ModuleApiName, ids: readonly RecordId[]): Promise<void>;
}

export type RecordServiceFactory = (ctx: OrgContext) => RecordService;
