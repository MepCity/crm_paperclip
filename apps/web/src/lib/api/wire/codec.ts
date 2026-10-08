import { ValidationError } from "@crm/core/errors";
import type {
  Comparator,
  Criteria,
  CriteriaPeriod,
  CriteriaValue,
  FieldDefinition,
  FieldValue,
  ListResult,
  ListView,
  ModuleMetadata,
  RecordData,
  RecordInput,
} from "@crm/core/records";
import type {
  WireCriteria,
  WireCriteriaValue,
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
    if (!field) throw new Error(`Record field is absent from metadata: ${name}`);
    Object.defineProperty(result, name, {
      value: encodeValue(field, value, members),
      enumerable: true,
      writable: true,
    });
  }
  return result;
}
export function encodeInput(
  input: RecordInput,
  metadata: ModuleMetadata,
): Record<string, WireValue> {
  const result: Record<string, WireValue> = Object.create(null);
  for (const [name, value] of Object.entries(input)) {
    const field = metadata.fields.find((candidate) => candidate.apiName === name);
    if (!field) invalid(name, "Unknown field.");
    if (field.dataType === "ownerlookup" && value !== null && typeof value !== "string")
      invalid(name, "Expected a user ID.");
    result[name] = encodeValue(field, value, []);
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
    mass_update: field.massUpdate,
    unique: field.unique ? { enforced: true } : {},
    view_type: {
      view: field.views.view,
      create: field.views.create,
      edit: field.views.edit,
      quick_create: field.views.quickCreate,
    },
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
    massUpdate: field.mass_update,
    unique: field.unique.enforced === true,
    views: {
      view: field.view_type.view,
      create: field.view_type.create,
      edit: field.view_type.edit,
      quickCreate: field.view_type.quick_create,
    },
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
    business_card_fields: metadata.businessCardFields.map((api_name) => ({ api_name })),
  };
}
export function encodeLayout(metadata: ModuleMetadata): WireLayout {
  return {
    sections: metadata.layout.map((section) => ({
      display_label: section.label,
      column_count: section.columnCount,
      columns: section.columns.map((column) => [...column]),
      fields: section.fields.map((name) => {
        const field = metadata.fields.find((candidate) => candidate.apiName === name);
        if (!field) throw new Error(`Layout field is absent from metadata: ${name}`);
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
    businessCardFields: module.business_card_fields.map((field) => field.api_name),
    fields: fields.map(decodeField),
    layout: layout.sections.map((section) => ({
      label: section.display_label,
      columnCount: section.column_count,
      columns: section.columns.map((column) => [...column]),
      fields: section.fields.map((field) => field.api_name),
    })),
  };
}
const criteriaPeriods = new Set<CriteriaPeriod>([
  "TOMORROW",
  "YESTERDAY",
  "TILL_YESTERDAY",
  "STARTING_TOMORROW",
  "THIS_WEEK",
  "PREVIOUS_WEEK",
  "THIS_MONTH",
  "PREVIOUS_MONTH",
  "THIS_YEAR",
  "PREVIOUS_YEAR",
  "NEXT_YEAR",
]);
function encodeCriteriaValue(value: CriteriaValue): WireCriteriaValue {
  if (typeof value === "object" && value !== null && "token" in value) {
    const expectedKeys = value.token === "CURRENTUSER" || value.token === "TODAY" ? 1 : 2;
    if (Object.keys(value).length !== expectedKeys)
      return invalid("filters", "Invalid token shape.");
    switch (value.token) {
      case "CURRENTUSER":
        return { name: `\${CURRENTUSER}` };
      case "TODAY":
        return `\${TODAY}`;
      case "AGEINDAYS":
        if (!Number.isInteger(value.offset) || value.offset < 0)
          return invalid("filters", "Invalid day offset.");
        return `\${AGEINDAYS}+${value.offset}`;
      case "CATEGORY":
        if (typeof value.name !== "string") return invalid("filters", "Invalid category token.");
        return `\${CATEGORY.${value.name}}`;
      case "DUEINDAYS":
        if (!Number.isInteger(value.offset) || value.offset < 0)
          return invalid("filters", "Invalid day offset.");
        return `\${DUEINDAYS}+${value.offset}`;
      case "PERIOD":
        if (!criteriaPeriods.has(value.name)) return invalid("filters", "Unknown period.");
        return `\${PERIOD.${value.name}}`;
      default:
        return invalid("filters", "Unknown token.");
    }
  }
  return structuredClone(value);
}
function decodeCriteriaValue(value: unknown): CriteriaValue {
  if (typeof value === "string") {
    if (value === `\${TODAY}`) return { token: "TODAY" };
    const age = /^\$\{AGEINDAYS\}([+-]\d+(?:\.\d+)?(?:e[+-]?\d+)?)$/.exec(value);
    if (age?.[0] === value && Number.isFinite(Number(age[1])))
      return { token: "AGEINDAYS", offset: Number(age[1]) };
    const category = /^\$\{CATEGORY\.([^{}\r\n]+)\}$/.exec(value);
    if (category?.[0] === value) return { token: "CATEGORY", name: category[1] as string };
    const due = /^\$\{DUEINDAYS\}\+(\d+(?:e[+]?\d+)?)$/.exec(value);
    if (due?.[0] === value && Number.isInteger(Number(due[1])) && Number(due[1]) >= 0)
      return { token: "DUEINDAYS", offset: Number(due[1]) };
    const period = /^\$\{PERIOD\.([^{}]+)\}$/.exec(value);
    if (period && criteriaPeriods.has(period[1] as CriteriaPeriod))
      return { token: "PERIOD", name: period[1] as CriteriaPeriod };
    if (value.startsWith(`\${PERIOD.`) || value.startsWith(`\${DUEINDAYS}`))
      return invalid("filters", "Unknown token.");
    if (
      /^\$\{[^{}]+\}$/.test(value) &&
      !value.startsWith(`\${CATEGORY.`) &&
      value !== `\${AGEINDAYS}` &&
      value !== `\${CURRENTUSER}`
    )
      return invalid("filters", "Unknown token.");
    return value;
  }
  if (Array.isArray(value)) return value.map((entry) => readFieldValue(entry, "filters"));
  if (
    typeof value === "object" &&
    value !== null &&
    Object.keys(value).length === 1 &&
    "name" in value &&
    value.name === `\${CURRENTUSER}`
  )
    return { token: "CURRENTUSER" };
  return readFieldValue(value, "filters");
}
function comparator(value: unknown): Comparator {
  if (
    value === "equal" ||
    value === "contains" ||
    value === "not_contains" ||
    value === "less_equal" ||
    value === "not_equal" ||
    value === "starts_with" ||
    value === "ends_with" ||
    value === "is_empty" ||
    value === "is_not_empty" ||
    value === "less_than" ||
    value === "greater_than" ||
    value === "greater_equal" ||
    value === "between" ||
    value === "not_between"
  )
    return value;
  return invalid("filters", "Unknown comparator.");
}
const wireGroupOperator = (operator: "and" | "or"): "AND" | "OR" =>
  operator === "and" ? "AND" : "OR";
export function encodeCriteria(criteria: Criteria): WireCriteria {
  if ("group" in criteria)
    return {
      group_operator: wireGroupOperator(criteria.groupOperator),
      group: criteria.group.map(encodeCriteria),
    };
  return {
    field: { api_name: criteria.field },
    comparator: comparator(criteria.comparator),
    value: encodeCriteriaValue(criteria.value),
  };
}
export function decodeCriteria(value: unknown, depth = 0): Criteria {
  if (depth > 32) invalid("filters", "Criteria are too deeply nested.");
  const criteria = object(value, "filters");
  if ("group" in criteria) {
    const operator = criteria.group_operator;
    if (!Array.isArray(criteria.group) || (operator !== "AND" && operator !== "OR"))
      invalid("filters");
    return {
      groupOperator: operator === "AND" ? "and" : "or",
      group: criteria.group.map((child) => decodeCriteria(child, depth + 1)),
    };
  }
  const field = object(criteria.field, "filters");
  if (typeof field.api_name !== "string") invalid("filters");
  return {
    field: field.api_name,
    comparator: comparator(criteria.comparator),
    value: decodeCriteriaValue(criteria.value),
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
  page: Pick<ListResult, "page" | "perPage" | "moreRecords" | "sort">,
  count: number,
): WireInfo {
  return {
    per_page: page.perPage,
    count,
    page: page.page,
    sort_by: page.sort.field,
    sort_order: page.sort.order,
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
    sort: { field: info.sort_by, order: info.sort_order },
  };
}

export function encodeWriteResult(
  ids: readonly string[],
  message: string,
): import("./types").WireWriteResult {
  return {
    data: ids.map((id) => ({ code: "SUCCESS", details: { id }, message, status: "success" })),
  };
}

export function encodeRecordWriteResult(
  record: RecordData,
  metadata: ModuleMetadata,
  members: readonly WireMember[],
  message: string,
): import("./types").WireWriteResult {
  const row = encodeRecord(record, metadata, members);
  const result = encodeWriteResult([record.id], message);
  const entry = result.data[0];
  if (!entry) throw new Error("Missing write result.");
  for (const name of ["Modified_Time", "Modified_By", "Created_Time", "Created_By"]) {
    const value = row[name];
    if (value !== undefined) entry.details[name] = value;
  }
  return result;
}
