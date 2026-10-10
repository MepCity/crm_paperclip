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
const CALENDAR_DAY = /^\d{4}-\d{2}-\d{2}$/;
const RELATIVE_UNITS = new Set(["DAYS", "WEEKS", "MONTHS"]);
const RELATIVE_DIRECTIONS = new Set(["PREVIOUS", "NEXT"]);
const COMPARATORS = new Set<Comparator>([
  "equal",
  "contains",
  "not_contains",
  "less_equal",
  "not_equal",
  "starts_with",
  "ends_with",
  "is_empty",
  "is_not_empty",
  "less_than",
  "greater_than",
  "greater_equal",
  "between",
  "not_between",
]);
const NUMBER_TYPES = new Set(["integer", "double", "currency"]);
const PERIODS = new Set([
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
  if (record.token === "AGEINDAYS" || record.token === "DUEINDAYS")
    return (
      keys.length === 2 &&
      typeof record.offset === "number" &&
      Number.isInteger(record.offset) &&
      record.offset >= 0
    );
  if (record.token === "PERIOD")
    return keys.length === 2 && typeof record.name === "string" && PERIODS.has(record.name);
  if (record.token === "RELATIVE_PERIOD")
    return (
      keys.length === 4 &&
      RELATIVE_DIRECTIONS.has(record.direction as string) &&
      RELATIVE_UNITS.has(record.unit as string) &&
      typeof record.count === "number" &&
      Number.isInteger(record.count) &&
      record.count >= 1 &&
      record.count <= 1000
    );
  if (record.token === "CATEGORY") return keys.length === 2 && typeof record.name === "string";
  return false;
}

function isCalendarDateString(value: unknown): boolean {
  if (typeof value !== "string" || !CALENDAR_DAY.test(value)) return false;
  const timestamp = Date.UTC(
    Number(value.slice(0, 4)),
    Number(value.slice(5, 7)) - 1,
    Number(value.slice(8, 10)),
  );
  return new Date(timestamp).toISOString().slice(0, 10) === value;
}

function isCalendarDateRange(value: CriteriaValue): boolean {
  if (!isValueList(value) || value.length !== 2) return false;
  const [lower, upper] = value;
  return (
    typeof lower === "string" &&
    typeof upper === "string" &&
    isCalendarDateString(lower) &&
    isCalendarDateString(upper) &&
    lower <= upper
  );
}

function calendarDayBounds(isoDate: string): readonly [number, number] | null {
  if (!isCalendarDateString(isoDate)) return null;
  const start = Date.UTC(
    Number(isoDate.slice(0, 4)),
    Number(isoDate.slice(5, 7)) - 1,
    Number(isoDate.slice(8, 10)),
  );
  return [start, start + DAY_MS];
}

function datetimeMillis(value: FieldValue): number | null {
  if (typeof value !== "string") return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function unitStart(unit: "DAYS" | "WEEKS" | "MONTHS", now: Date): number {
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  const dayStart = Date.UTC(year, month, now.getUTCDate());
  if (unit === "DAYS") return dayStart;
  if (unit === "WEEKS") return dayStart - ((now.getUTCDay() + 6) % 7) * DAY_MS;
  return Date.UTC(year, month, 1);
}

function addCalendarMonths(timestamp: number, months: number): number {
  const date = new Date(timestamp);
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, date.getUTCDate());
}

function shiftUnit(timestamp: number, unit: "DAYS" | "WEEKS" | "MONTHS", delta: number): number {
  if (unit === "DAYS") return timestamp + delta * DAY_MS;
  if (unit === "WEEKS") return timestamp + delta * 7 * DAY_MS;
  return addCalendarMonths(timestamp, delta);
}

function relativePeriodBounds(
  expected: Extract<CriteriaToken, { token: "RELATIVE_PERIOD" }>,
  now: Date,
): readonly [number, number] | null {
  const u0 = unitStart(expected.unit, now);
  if (expected.direction === "PREVIOUS") {
    return [shiftUnit(u0, expected.unit, -expected.count), u0];
  }
  return [shiftUnit(u0, expected.unit, 1), shiftUnit(u0, expected.unit, expected.count + 1)];
}

function comparatorFits(
  field: FieldDefinition,
  comparator: Comparator,
  value: CriteriaValue,
): boolean {
  if (comparator === "is_empty" || comparator === "is_not_empty") return value === null;
  if (["contains", "not_contains", "starts_with", "ends_with"].includes(comparator))
    return TEXT_TYPES.has(field.dataType) && typeof value === "string";
  if (field.dataType === "datetime") {
    if (comparator === "less_equal") {
      return isCriteriaToken(value) && (value.token === "AGEINDAYS" || value.token === "DUEINDAYS");
    }
    if (comparator === "equal") {
      if (isCalendarDateString(value)) return true;
      return (
        isCriteriaToken(value) &&
        (value.token === "TODAY" || value.token === "PERIOD" || value.token === "RELATIVE_PERIOD")
      );
    }
    if (comparator === "less_than" || comparator === "greater_than") {
      return isCalendarDateString(value);
    }
    if (comparator === "between" || comparator === "not_between") {
      return isCalendarDateRange(value);
    }
    return false;
  }
  if (NUMBER_TYPES.has(field.dataType)) {
    const number = (item: FieldValue) => typeof item === "number" && acceptsFieldValue(field, item);
    if (comparator === "between" || comparator === "not_between")
      return (
        isValueList(value) &&
        value.length === 2 &&
        value.every(number) &&
        (value[0] as number) <= (value[1] as number)
      );
    return (
      ["equal", "not_equal", "less_than", "less_equal", "greater_than", "greater_equal"].includes(
        comparator,
      ) &&
      typeof value === "number" &&
      number(value)
    );
  }
  if (comparator !== "equal" && comparator !== "not_equal") return false;
  if (TEXT_TYPES.has(field.dataType))
    return typeof value === "string" || (comparator === "equal" && value === null);
  if (field.dataType === "picklist" || field.dataType === "ownerlookup") {
    if (isValueList(value))
      return value.length > 0 && value.every((item) => typeof item === "string");
    // Retain existing scalar equality and saved-view tokens.
    if (comparator !== "equal") return false;
    if (isCriteriaToken(value))
      return field.dataType === "picklist"
        ? value.token === "CATEGORY"
        : value.token === "CURRENTUSER";
    return typeof value === "string" || value === null;
  }
  if (field.dataType === "boolean") return comparator === "equal" && typeof value === "boolean";
  // Existing scalar equality (not panel operators) remains available for IDs/references.
  return (
    comparator === "equal" &&
    !isValueList(value) &&
    !isCriteriaToken(value) &&
    acceptsFieldValue(field, value as FieldValue)
  );
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

function periodBounds(expected: CriteriaToken, now: Date): readonly [number, number] | null {
  const start = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  if (expected.token === "TODAY") return [start, start + DAY_MS];
  if (expected.token !== "PERIOD") return null;
  const week = start - ((now.getUTCDay() + 6) % 7) * DAY_MS;
  switch (expected.name) {
    case "TOMORROW":
      return [start + DAY_MS, start + 2 * DAY_MS];
    case "YESTERDAY":
      return [start - DAY_MS, start];
    case "TILL_YESTERDAY":
      return [-Infinity, start];
    case "STARTING_TOMORROW":
      return [start + DAY_MS, Infinity];
    case "THIS_WEEK":
      return [week, week + 7 * DAY_MS];
    case "PREVIOUS_WEEK":
      return [week - 7 * DAY_MS, week];
    case "THIS_MONTH":
      return [Date.UTC(year, month, 1), Date.UTC(year, month + 1, 1)];
    case "PREVIOUS_MONTH":
      return [Date.UTC(year, month - 1, 1), Date.UTC(year, month, 1)];
    case "THIS_YEAR":
      return [Date.UTC(year, 0, 1), Date.UTC(year + 1, 0, 1)];
    case "PREVIOUS_YEAR":
      return [Date.UTC(year - 1, 0, 1), Date.UTC(year, 0, 1)];
    case "NEXT_YEAR":
      return [Date.UTC(year + 1, 0, 1), Date.UTC(year + 2, 0, 1)];
  }
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
    if (expected.token === "TODAY" || expected.token === "PERIOD") {
      const bounds = periodBounds(expected, runtime.now);
      const parsed = datetimeMillis(value);
      return bounds !== null && parsed !== null && parsed >= bounds[0] && parsed < bounds[1];
    }
    if (expected.token === "RELATIVE_PERIOD") {
      const bounds = relativePeriodBounds(expected, runtime.now);
      const parsed = datetimeMillis(value);
      return bounds !== null && parsed !== null && parsed >= bounds[0] && parsed < bounds[1];
    }
    if (expected.token === "CATEGORY")
      return categoryStoredValues(field, expected.name).some((stored) => value === stored);
    return false;
  }
  if (typeof expected === "string") {
    if (isCalendarDateString(expected)) {
      const bounds = calendarDayBounds(expected);
      const parsed = datetimeMillis(value);
      return bounds !== null && parsed !== null && parsed >= bounds[0] && parsed < bounds[1];
    }
    if (TEXT_TYPES.has(fieldByName.get(field)?.dataType ?? "") && typeof value === "string")
      return value.toLowerCase() === expected.toLowerCase();
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
  if (
    !isCriteriaToken(expected) ||
    (expected.token !== "AGEINDAYS" && expected.token !== "DUEINDAYS") ||
    typeof value !== "string"
  )
    return false;
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) return false;
  if (expected.token === "DUEINDAYS")
    return (
      parsed > runtime.now.getTime() && parsed <= runtime.now.getTime() + expected.offset * DAY_MS
    );
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
    case "not_equal":
      return !matchesEqual(criteria.field, value, criteria.value, runtime);
    case "is_empty":
      return value === null || value === "";
    case "is_not_empty":
      return value !== null && value !== "";
    case "starts_with":
    case "ends_with":
      return (
        typeof value === "string" &&
        typeof criteria.value === "string" &&
        (criteria.comparator === "starts_with"
          ? value.toLowerCase().startsWith(criteria.value.toLowerCase())
          : value.toLowerCase().endsWith(criteria.value.toLowerCase()))
      );
    case "less_than":
      if (typeof criteria.value === "string" && isCalendarDateString(criteria.value)) {
        const bounds = calendarDayBounds(criteria.value);
        const parsed = datetimeMillis(value);
        return bounds !== null && parsed !== null && parsed < bounds[0];
      }
      return (
        typeof value === "number" && typeof criteria.value === "number" && value < criteria.value
      );
    case "greater_than":
      if (typeof criteria.value === "string" && isCalendarDateString(criteria.value)) {
        const bounds = calendarDayBounds(criteria.value);
        const parsed = datetimeMillis(value);
        return bounds !== null && parsed !== null && parsed >= bounds[1];
      }
      return (
        typeof value === "number" && typeof criteria.value === "number" && value > criteria.value
      );
    case "greater_equal":
      return (
        typeof value === "number" && typeof criteria.value === "number" && value >= criteria.value
      );
    case "between":
    case "not_between": {
      if (isValueList(criteria.value) && typeof criteria.value[0] === "string") {
        const lower = calendarDayBounds(criteria.value[0] as string);
        const upper = calendarDayBounds(criteria.value[1] as string);
        const parsed = datetimeMillis(value);
        if (!lower || !upper || parsed === null) return false;
        const inside = parsed >= lower[0] && parsed < upper[1];
        return criteria.comparator === "between" ? inside : !inside;
      }
      if (typeof value !== "number" || !isValueList(criteria.value)) return false;
      const inside =
        value >= (criteria.value[0] as number) && value <= (criteria.value[1] as number);
      return criteria.comparator === "between" ? inside : !inside;
    }
    case "contains":
      return matchesContains(value, criteria.value);
    case "not_contains":
      return !matchesContains(value, criteria.value);
    case "less_equal":
      return typeof criteria.value === "number"
        ? typeof value === "number" && value <= criteria.value
        : matchesAge(value, criteria.value, runtime);
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
