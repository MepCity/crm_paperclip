import { ValidationError } from "../../errors";
import type { Criteria, FieldValue, RecordData, SortSpec } from "../contract";
import { leadsMetadata } from "./metadata";

const fieldNames = new Set(leadsMetadata.fields.map((field) => field.apiName));
export function validateCriteria(criteria: Criteria): void {
  if ("group" in criteria) {
    if (!["and", "or"].includes(criteria.groupOperator))
      throw new ValidationError({ filters: ["Unknown group operator."] });
    for (const child of criteria.group) validateCriteria(child);
  } else if (!fieldNames.has(criteria.field) || criteria.comparator !== "is") {
    throw new ValidationError({ filters: ["Unknown field or comparator."] });
  }
}
function equal(left: FieldValue, right: FieldValue): boolean {
  if (typeof left === "object" && left !== null && typeof right === "object" && right !== null) {
    return left.id === right.id && left.module === right.module;
  }
  return left === right;
}
export function matches(record: RecordData, criteria: Criteria): boolean {
  if ("group" in criteria) {
    return criteria.groupOperator === "and"
      ? criteria.group.every((child) => matches(record, child))
      : criteria.group.some((child) => matches(record, child));
  }
  const value = record.fields[criteria.field] ?? null;
  return Array.isArray(criteria.value)
    ? criteria.value.some((option: FieldValue) => equal(value, option))
    : equal(value, criteria.value as FieldValue);
}
export function matchesSearch(record: RecordData, search?: string): boolean {
  const needle = search?.trim().toLowerCase();
  if (!needle) return true;
  return ["Full_Name", "Company", "Email", "Phone"].some((field) => {
    const value = record.fields[field];
    return typeof value === "string" && value.toLowerCase().includes(needle);
  });
}
export function sortRecords(records: RecordData[], sort?: SortSpec | null): RecordData[] {
  if (!sort) return records;
  const field = leadsMetadata.fields.find((field) => field.apiName === sort.field);
  if (!field || !["asc", "desc"].includes(sort.order))
    throw new ValidationError({ sort: ["Unknown sort field or order."] });
  const normalize = (value: FieldValue): string | number | boolean | null => {
    if (value === null || value === "") return null;
    if (typeof value === "object") return value.id.toLowerCase();
    if (field.dataType === "datetime" && typeof value === "string") return Date.parse(value);
    return typeof value === "string" ? value.toLowerCase() : value;
  };
  // Stable Array.sort preserves the default order for equal values.
  return records.sort((a, b) => {
    const left = normalize(a.fields[sort.field] ?? null);
    const right = normalize(b.fields[sort.field] ?? null);
    if (left === null) return right === null ? 0 : 1;
    if (right === null) return -1;
    const comparison = left < right ? -1 : left > right ? 1 : 0;
    return sort.order === "asc" ? comparison : -comparison;
  });
}
