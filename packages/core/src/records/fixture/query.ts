import { ValidationError } from "../../errors";
import type {
  Comparator,
  Criteria,
  CriteriaToken,
  CriteriaValue,
  FieldDefinition,
  FieldValue,
  RecordData,
  SortSpec,
} from "../contract";
import { leadsMetadata } from "./metadata";
import { categoryStoredValues } from "./picklists";
import { acceptsFieldValue } from "./validation";

const DAY_MS = 86_400_000;
const COMPARATORS = new Set<Comparator>(["equal", "contains", "not_contains", "less_equal"]);
const TEXT_TYPES = new Set(["text", "textarea", "email", "phone", "website"]);
const fieldByName = new Map(leadsMetadata.fields.map((field) => [field.apiName, field]));

export interface CriteriaRuntime {
  userId: string;
  now: Date;
}

export const DEFAULT_LIST_SORT: SortSpec = { field: "id", order: "desc" };

function isValueList(value: CriteriaValue): value is readonly FieldValue[] {
  return Array.isArray(value);
}

function isCriteriaToken(value: CriteriaValue): value is CriteriaToken {
  if (typeof value !== "object" || value === null || Array.isArray(value) || !("token" in value))
    return false;
  const record = value as unknown as Record<string, unknown>;
  const keys = Object.keys(record);
  if (record.token === "CURRENTUSER" || record.token === "TODAY") return keys.length === 1;
  if (record.token === "AGEINDAYS")
    return keys.length === 2 && typeof record.offset === "number" && Number.isFinite(record.offset);
  if (record.token === "CATEGORY") return keys.length === 2 && typeof record.name === "string";
  return false;
}

function comparatorFits(
  field: FieldDefinition,
  comparator: Comparator,
  value: CriteriaValue,
): boolean {
  if (comparator === "contains" || comparator === "not_contains")
    return TEXT_TYPES.has(field.dataType) && typeof value === "string";
  if (comparator === "less_equal")
    return field.dataType === "datetime" && isCriteriaToken(value) && value.token === "AGEINDAYS";
  if (isValueList(value)) return value.every((item) => acceptsFieldValue(field, item));
  if (isCriteriaToken(value)) {
    if (value.token === "CURRENTUSER") return field.dataType === "ownerlookup";
    if (value.token === "TODAY") return field.dataType === "datetime";
    if (value.token === "CATEGORY") return field.dataType === "picklist";
    return false;
  }
  return acceptsFieldValue(field, value);
}

export function validateCriteria(criteria: Criteria): void {
  if ("group" in criteria) {
    if (criteria.groupOperator !== "and" && criteria.groupOperator !== "or")
      throw new ValidationError({ filters: ["Unknown group operator."] });
    for (const child of criteria.group) validateCriteria(child);
    return;
  }
  const field = fieldByName.get(criteria.field);
  if (
    !field ||
    !COMPARATORS.has(criteria.comparator) ||
    !comparatorFits(field, criteria.comparator, criteria.value)
  )
    throw new ValidationError({ filters: ["Unknown field or comparator."] });
}

function equalValues(left: FieldValue, right: FieldValue): boolean {
  if (typeof left === "object" && left !== null && typeof right === "object" && right !== null)
    return left.id === right.id && left.module === right.module;
  return left === right;
}

function utcDay(value: FieldValue | Date): string | null {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value !== "string") return null;
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) return null;
  return new Date(parsed).toISOString().slice(0, 10);
}

function matchesEqual(
  field: string,
  value: FieldValue,
  expected: CriteriaValue,
  runtime: CriteriaRuntime,
): boolean {
  if (isValueList(expected)) return expected.some((option) => equalValues(value, option));
  if (isCriteriaToken(expected)) {
    if (expected.token === "CURRENTUSER") return value === runtime.userId;
    if (expected.token === "TODAY") return utcDay(value) === utcDay(runtime.now);
    if (expected.token === "CATEGORY")
      return categoryStoredValues(field, expected.name).some((stored) => value === stored);
    return false;
  }
  return equalValues(value, expected);
}

function matchesContains(value: FieldValue, expected: CriteriaValue): boolean {
  return (
    typeof value === "string" &&
    typeof expected === "string" &&
    value.toLowerCase().includes(expected.toLowerCase())
  );
}

function matchesAge(value: FieldValue, expected: CriteriaValue, runtime: CriteriaRuntime): boolean {
  if (!isCriteriaToken(expected) || expected.token !== "AGEINDAYS" || typeof value !== "string")
    return false;
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) return false;
  return Math.floor((runtime.now.getTime() - parsed) / DAY_MS) <= expected.offset;
}

export function matches(record: RecordData, criteria: Criteria, runtime: CriteriaRuntime): boolean {
  if ("group" in criteria) {
    return criteria.groupOperator === "and"
      ? criteria.group.every((child) => matches(record, child, runtime))
      : criteria.group.some((child) => matches(record, child, runtime));
  }
  // A leaf on a field absent from module metadata is published but does not constrain.
  if (!fieldByName.has(criteria.field)) return true;
  const value = record.fields[criteria.field] ?? null;
  switch (criteria.comparator) {
    case "equal":
      return matchesEqual(criteria.field, value, criteria.value, runtime);
    case "contains":
      return matchesContains(value, criteria.value);
    case "not_contains":
      return !matchesContains(value, criteria.value);
    case "less_equal":
      return matchesAge(value, criteria.value, runtime);
    default:
      return false;
  }
}

export function matchesSearch(record: RecordData, search?: string): boolean {
  const needle = search?.trim().toLowerCase();
  if (!needle) return true;
  return ["Full_Name", "Company", "Email", "Phone"].some((field) => {
    const value = record.fields[field];
    return typeof value === "string" && value.toLowerCase().includes(needle);
  });
}

function compareDecimal(left: string, right: string): number {
  const a = BigInt(left);
  const b = BigInt(right);
  return a < b ? -1 : a > b ? 1 : 0;
}

export function sortRecords(records: RecordData[], sort: SortSpec): RecordData[] {
  if (sort.order !== "asc" && sort.order !== "desc")
    throw new ValidationError({ sort: ["Unknown sort field or order."] });
  const direction = sort.order === "asc" ? 1 : -1;
  const copy = [...records];
  if (sort.field === "id") {
    copy.sort((a, b) => compareDecimal(a.id, b.id) * direction);
    return copy;
  }
  const field = fieldByName.get(sort.field);
  if (!field) throw new ValidationError({ sort: ["Unknown sort field or order."] });
  // Ties keep the default id-descending order. Array.sort is stable.
  copy.sort((a, b) => compareDecimal(b.id, a.id));
  const normalize = (value: FieldValue): string | number | boolean | null => {
    if (value === null || value === "") return null;
    if (typeof value === "object") return value.id.toLowerCase();
    if (field.dataType === "datetime" && typeof value === "string") return Date.parse(value);
    return typeof value === "string" ? value.toLowerCase() : value;
  };
  copy.sort((a, b) => {
    const left = normalize(a.fields[sort.field] ?? null);
    const right = normalize(b.fields[sort.field] ?? null);
    if (left === null) return right === null ? 0 : 1;
    if (right === null) return -1;
    const comparison = left < right ? -1 : left > right ? 1 : 0;
    return direction * comparison;
  });
  return copy;
}
