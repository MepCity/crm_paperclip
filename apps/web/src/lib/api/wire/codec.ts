import { ValidationError } from "@crm/core/errors";
import type {
  Criteria,
  FieldDefinition,
  FieldValue,
  ListResult,
  ListView,
  ModuleMetadata,
  RecordData,
  RecordInput,
  SortSpec,
} from "@crm/core/records";
import type {
  WireCriteria,
  WireField,
  WireInfo,
  WireLayout,
  WireMember,
  WireModule,
  WireRecord,
  WireValue,
  WireView,
} from "./types";

export function invalid(key: string, message = "Invalid value."): never {
  throw new ValidationError({ [key]: [message] });
}
export function object(value: unknown, key: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) invalid(key);
  return value as Record<string, unknown>;
}
function readFieldValue(value: unknown, key: string): FieldValue {
  if (value === null || typeof value === "string" || typeof value === "boolean") return value;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const ref = object(value, key);
  if (typeof ref.module === "string" && typeof ref.id === "string")
    return { module: ref.module, id: ref.id };
  return invalid(key);
}
function encodeValue(
  field: FieldDefinition,
  value: FieldValue,
  members: readonly WireMember[],
): WireValue {
  if (value === null) return null;
  if (field.dataType === "ownerlookup" && typeof value === "string") {
    const member = members.find((candidate) => candidate.userId === value);
    return member ? { id: value, name: member.name, email: member.email } : { id: value };
  }
  if (field.dataType === "lookup" && typeof value === "string") return { id: value };
  return structuredClone(value);
}
function decodeValue(field: FieldDefinition, value: unknown): FieldValue {
  if (value === null) return null;
  if (["ownerlookup", "lookup"].includes(field.dataType)) {
    const ref = object(value, field.apiName);
    return typeof ref.id === "string" ? ref.id : invalid(field.apiName);
  }
  return readFieldValue(value, field.apiName);
}

export function encodeRecord(
  record: RecordData,
  metadata: ModuleMetadata,
  members: readonly WireMember[] = [],
): WireRecord {
  const result: WireRecord = { id: record.id };
  for (const [name, value] of Object.entries(record.fields)) {
    if (name === "id") continue;
    const field = metadata.fields.find((candidate) => candidate.apiName === name);
    if (!field) invalid(name);
    Object.defineProperty(result, name, {
      value: encodeValue(field, value, members),
      enumerable: true,
      writable: true,
    });
  }
  return result;
}
export function decodeInput(row: unknown, metadata: ModuleMetadata): RecordInput {
  const source = object(row, "data");
  const result: Record<string, FieldValue> = Object.create(null);
  for (const [name, value] of Object.entries(source)) {
    const field = metadata.fields.find((candidate) => candidate.apiName === name);
    if (!field) invalid(name, "Unknown field.");
    result[name] = decodeValue(field, value);
  }
  return result;
}
export function decodeRecord(row: WireRecord, metadata: ModuleMetadata): RecordData {
  if (typeof row.id !== "string") invalid("id");
  return { id: row.id, fields: decodeInput(row, metadata) };
}

export function encodeField(field: FieldDefinition): WireField {
  return {
    api_name: field.apiName,
    field_label: field.label,
    data_type: field.dataType,
    system_mandatory: field.required,
    read_only: field.readOnly,
    unique: field.unique ? { enforced: true } : {},
    ...(field.maxLength === undefined ? {} : { length: field.maxLength }),
    ...(field.picklist === undefined
      ? {}
      : {
          pick_list_values: field.picklist.map((option) => ({
            display_value: option.displayValue,
            actual_value: option.storedValue,
          })),
        }),
    ...(field.lookup === undefined
      ? {}
      : { lookup: { module: { api_name: field.lookup.module } } }),
  };
}
export function decodeField(field: WireField): FieldDefinition {
  return {
    apiName: field.api_name,
    label: field.field_label,
    dataType: field.data_type,
    required: field.system_mandatory,
    readOnly: field.read_only,
    unique: field.unique.enforced === true,
    ...(field.length === undefined ? {} : { maxLength: field.length }),
    ...(field.pick_list_values === undefined
      ? {}
      : {
          picklist: field.pick_list_values.map((option) => ({
            displayValue: option.display_value,
            storedValue: option.actual_value,
          })),
        }),
    ...(field.lookup === undefined ? {} : { lookup: { module: field.lookup.module.api_name } }),
  };
}
export function encodeModule(metadata: ModuleMetadata): WireModule {
  return {
    api_name: metadata.apiName,
    singular_label: metadata.singularLabel,
    plural_label: metadata.pluralLabel,
  };
}
export function encodeLayout(metadata: ModuleMetadata): WireLayout {
  return {
    sections: metadata.layout.map((section) => ({
      display_label: section.label,
      column_count: section.columnCount,
      fields: section.fields.map((name) => {
        const field = metadata.fields.find((candidate) => candidate.apiName === name);
        if (!field) invalid(name);
        return encodeField(field);
      }),
    })),
  };
}
export function decodeModule(
  module: WireModule,
  fields: readonly WireField[],
  layout: WireLayout,
): ModuleMetadata {
  return {
    apiName: module.api_name,
    singularLabel: module.singular_label,
    pluralLabel: module.plural_label,
    fields: fields.map(decodeField),
    layout: layout.sections.map((section) => ({
      label: section.display_label,
      columnCount: section.column_count,
      fields: section.fields.map((field) => field.api_name),
    })),
  };
}
export function encodeCriteria(criteria: Criteria): WireCriteria {
  if ("group" in criteria)
    return { group_operator: criteria.groupOperator, group: criteria.group.map(encodeCriteria) };
  return {
    field: { api_name: criteria.field },
    comparator: "equal",
    value: structuredClone(criteria.value),
  };
}
export function decodeCriteria(value: unknown, depth = 0): Criteria {
  if (depth > 32) invalid("filters", "Criteria are too deeply nested.");
  const criteria = object(value, "filters");
  if ("group" in criteria) {
    if (!Array.isArray(criteria.group) || !["and", "or"].includes(String(criteria.group_operator)))
      invalid("filters");
    return {
      groupOperator: criteria.group_operator as "and" | "or",
      group: criteria.group.map((child) => decodeCriteria(child, depth + 1)),
    };
  }
  const field = object(criteria.field, "filters");
  if (typeof field.api_name !== "string" || criteria.comparator !== "equal") invalid("filters");
  return {
    field: field.api_name,
    comparator: "is",
    value: Array.isArray(criteria.value)
      ? criteria.value.map((entry) => readFieldValue(entry, "filters"))
      : readFieldValue(criteria.value, "filters"),
  };
}
export function encodeView(view: ListView): WireView {
  return {
    id: view.id,
    name: view.name,
    system_defined: view.systemDefined,
    default: view.isDefault,
    fields: view.columns.map((api_name) => ({ api_name })),
    criteria: view.criteria ? encodeCriteria(view.criteria) : null,
    sort_by: view.sort?.field ?? null,
    sort_order: view.sort?.order ?? null,
  };
}
export function decodeView(view: WireView): ListView {
  return {
    id: view.id,
    name: view.name,
    systemDefined: view.system_defined,
    isDefault: view.default,
    columns: view.fields.map((field) => field.api_name),
    criteria: view.criteria ? decodeCriteria(view.criteria) : null,
    sort:
      view.sort_by === null || view.sort_order === null
        ? null
        : { field: view.sort_by, order: view.sort_order },
  };
}
export function encodeInfo(
  page: Pick<ListResult, "page" | "perPage" | "moreRecords">,
  count: number,
  sort: SortSpec = { field: "id", order: "desc" },
): WireInfo {
  return {
    per_page: page.perPage,
    count,
    page: page.page,
    sort_by: sort.field,
    sort_order: sort.order,
    more_records: page.moreRecords,
  };
}
export function decodeList(
  data: readonly WireRecord[],
  info: WireInfo,
  metadata: ModuleMetadata,
): ListResult {
  return {
    records: data.map((row) => decodeRecord(row, metadata)),
    page: info.page,
    perPage: info.per_page,
    moreRecords: info.more_records,
  };
}
