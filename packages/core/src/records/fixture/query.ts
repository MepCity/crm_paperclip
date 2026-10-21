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
import { acceptsFieldValue, isValidDateOnly } from "./validation";

const DAY_MS = 86_400_000;
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
const TEXT_TYPES = new Set(["text", "textarea", "email", "phone", "website", "lookup"]);
const CRITERIA_UNITS = new Set(["days", "weeks", "months"]);
const fieldByName = new Map(leadsMetadata.fields.map((field) => [field.apiName, field]));

function dateOnlyStart(value: string): number {
  return Date.parse(`${value}T00:00:00.000Z`);
}

function addCalendarMonths(instant: Date, months: number): number {
  const year = instant.getUTCFullYear();
  const month = instant.getUTCMonth();
  const day = instant.getUTCDate();
  const targetMonth = month + months;
  const daysInTarget = new Date(Date.UTC(year, targetMonth + 1, 0)).getUTCDate();
  return Date.UTC(
    year,
    targetMonth,
    Math.min(day, daysInTarget),
    instant.getUTCHours(),
    instant.getUTCMinutes(),
    instant.getUTCSeconds(),
    instant.getUTCMilliseconds(),
  );
}

function subtractCalendarMonths(instant: Date, months: number): number {
  const year = instant.getUTCFullYear();
  const month = instant.getUTCMonth();
  const day = instant.getUTCDate();
  const targetMonth = month - months;
  const daysInTarget = new Date(Date.UTC(year, targetMonth + 1, 0)).getUTCDate();
  return Date.UTC(
    year,
    targetMonth,
    Math.min(day, daysInTarget),
    instant.getUTCHours(),
    instant.getUTCMinutes(),
    instant.getUTCSeconds(),
    instant.getUTCMilliseconds(),
  );
}

function addMonthsFromUtcMidnight(utcMs: number, months: number): number {
  const date = new Date(utcMs);
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const day = date.getUTCDate();
  const targetMonth = month + months;
  const daysInTarget = new Date(Date.UTC(year, targetMonth + 1, 0)).getUTCDate();
  return Date.UTC(year, targetMonth, Math.min(day, daysInTarget));
}

function subtractMonthsFromUtcMidnight(utcMs: number, months: number): number {
  const date = new Date(utcMs);
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const day = date.getUTCDate();
  const targetMonth = month - months;
  const daysInTarget = new Date(Date.UTC(year, targetMonth + 1, 0)).getUTCDate();
  return Date.UTC(year, targetMonth, Math.min(day, daysInTarget));
}

function unitStart(now: Date, unit: string): number {
  const dayStart = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  if (unit === "days") return dayStart;
  if (unit === "weeks") return dayStart - ((now.getUTCDay() + 6) % 7) * DAY_MS;
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1);
}

function nextUnitStart(now: Date, unit: string): number {
  const current = unitStart(now, unit);
  if (unit === "days") return current + DAY_MS;
  if (unit === "weeks") return current + 7 * DAY_MS;
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  return Date.UTC(year, month + 1, 1);
}

function relativeBounds(
  direction: "previous" | "next",
  count: number,
  unit: string,
  now: Date,
): readonly [number, number] {
  if (direction === "previous") {
    const end = unitStart(now, unit);
    if (unit === "days") return [end - count * DAY_MS, end];
    if (unit === "weeks") return [end - count * 7 * DAY_MS, end];
    return [subtractMonthsFromUtcMidnight(end, count), end];
  }
  const start = nextUnitStart(now, unit);
  if (unit === "days") return [start, start + count * DAY_MS];
  if (unit === "weeks") return [start, start + count * 7 * DAY_MS];
  return [start, addMonthsFromUtcMidnight(start, count)];
}

function isAgeOrDueToken(
  value: CriteriaToken,
): value is Extract<CriteriaToken, { token: "AGEINDAYS" | "DUEINDAYS" }> {
  return value.token === "AGEINDAYS" || value.token === "DUEINDAYS";
}

function validAgeDueToken(record: Record<string, unknown>): boolean {
  if (typeof record.offset !== "number" || !Number.isInteger(record.offset) || record.offset < 0)
    return false;
  const keys = Object.keys(record);
  if (keys.length === 2) return true;
  if (keys.length === 3 && typeof record.unit === "string" && CRITERIA_UNITS.has(record.unit))
    return true;
  return false;
}

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
  if (
    record.token === "CURRENTUSER" ||
    record.token === "CURRENTTIME" ||
    record.token === "TODAY" ||
    record.token === "NEXT7DAYS" ||
    record.token === "TODAYANDOVERDUE"
  )
    return keys.length === 1;
  if (record.token === "AGEINDAYS" || record.token === "DUEINDAYS") return validAgeDueToken(record);
  if (record.token === "RELATIVE")
    return (
      keys.length === 4 &&
      (record.direction === "previous" || record.direction === "next") &&
      typeof record.count === "number" &&
      Number.isInteger(record.count) &&
      record.count >= 1 &&
      typeof record.unit === "string" &&
      CRITERIA_UNITS.has(record.unit)
    );
  if (record.token === "PERIOD")
    return keys.length === 2 && typeof record.name === "string" && PERIODS.has(record.name);
  if (record.token === "CATEGORY") return keys.length === 2 && typeof record.name === "string";
  return false;
}

function comparatorFits(
  field: FieldDefinition,
  comparator: Comparator,
  value: CriteriaValue,
): boolean {
  if (field.apiName === "Tag" && field.acceptsJsonArray) {
    if (comparator === "is_empty" || comparator === "is_not_empty") return value === null;
    return (
      (comparator === "equal" || comparator === "not_equal") &&
      (typeof value === "string"
        ? value.length > 0
        : isValueList(value) &&
          value.length > 0 &&
          value.every((id) => typeof id === "string" && id.length > 0))
    );
  }
  if (field.acceptsJsonArray || field.dataType === "ALARM" || field.dataType === "RRULE")
    return false;
  if (isCriteriaToken(value) && value.token === "CURRENTTIME")
    return (
      field.dataType === "datetime" &&
      ["less_than", "less_equal", "greater_than", "greater_equal"].includes(comparator)
    );
  if (
    field.dataType === "lookup" &&
    (comparator === "equal" || comparator === "not_equal") &&
    typeof value === "object" &&
    value !== null
  )
    return acceptsFieldValue(field, value as FieldValue);
  if (comparator === "is_empty" || comparator === "is_not_empty") return value === null;
  if (["contains", "not_contains", "starts_with", "ends_with"].includes(comparator))
    return TEXT_TYPES.has(field.dataType) && typeof value === "string";
  if (field.dataType === "multi_module_lookup") return false;
  if (["date", "datetime"].includes(field.dataType)) {
    if (comparator === "less_equal") {
      return (
        isCriteriaToken(value) &&
        (isAgeOrDueToken(value) || value.token === "NEXT7DAYS" || value.token === "TODAYANDOVERDUE")
      );
    }
    if (comparator === "equal") {
      if (isCriteriaToken(value)) {
        return value.token === "TODAY" || value.token === "PERIOD" || value.token === "RELATIVE";
      }
      return typeof value === "string" && isValidDateOnly(value);
    }
    if (comparator === "less_than" || comparator === "greater_than") {
      return typeof value === "string" && isValidDateOnly(value);
    }
    if (comparator === "between" || comparator === "not_between") {
      return (
        isValueList(value) &&
        value.length === 2 &&
        typeof value[0] === "string" &&
        typeof value[1] === "string" &&
        isValidDateOnly(value[0]) &&
        isValidDateOnly(value[1]) &&
        value[0] <= value[1]
      );
    }
    return false;
  }
  // bigint columns store digit strings; the filter panel sends plain numbers for them while
  // existing string equality keeps working.
  if (
    NUMBER_TYPES.has(field.dataType) ||
    (field.dataType === "bigint" && (typeof value === "number" || isValueList(value)))
  ) {
    // bigint columns store digit strings; criteria carry plain numbers like the other number fields.
    const number = (item: FieldValue) =>
      typeof item === "number" &&
      (field.dataType === "bigint" ? Number.isSafeInteger(item) : acceptsFieldValue(field, item));
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
    if (comparator !== "equal")
      return field.dataType === "picklist" && (typeof value === "string" || value === null);
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

export function validateCriteria(
  criteria: Criteria,
  fields: ReadonlyMap<string, FieldDefinition> = fieldByName,
): void {
  if ("group" in criteria) {
    if (criteria.groupOperator !== "and" && criteria.groupOperator !== "or")
      throw new ValidationError({ filters: ["Unknown group operator."] });
    for (const child of criteria.group) validateCriteria(child, fields);
    return;
  }
  const field = fields.get(criteria.field);
  if (
    !field ||
    !COMPARATORS.has(criteria.comparator) ||
    !comparatorFits(field, criteria.comparator, criteria.value)
  )
    throw new ValidationError({ filters: ["Unknown field or comparator."] });
}

function equalValues(left: FieldValue, right: FieldValue): boolean {
  if (
    typeof left === "object" &&
    left !== null &&
    typeof right === "object" &&
    right !== null &&
    "id" in left &&
    "id" in right
  )
    return left.id === right.id && left.module === right.module;
  return left === right;
}

function periodBounds(expected: CriteriaToken, now: Date): readonly [number, number] | null {
  const start = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  if (expected.token === "NEXT7DAYS") return [-Infinity, start + 8 * DAY_MS];
  if (expected.token === "TODAYANDOVERDUE") return [-Infinity, start + DAY_MS];
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
  fields: ReadonlyMap<string, FieldDefinition>,
): boolean {
  if (isValueList(expected)) return expected.some((option) => equalValues(value, option));
  if (isCriteriaToken(expected)) {
    if (expected.token === "CURRENTUSER") return value === runtime.userId;
    if (
      expected.token === "TODAY" ||
      expected.token === "PERIOD" ||
      expected.token === "NEXT7DAYS" ||
      expected.token === "TODAYANDOVERDUE"
    ) {
      const bounds = periodBounds(expected, runtime.now);
      const parsed = typeof value === "string" ? Date.parse(value) : NaN;
      return bounds !== null && parsed >= bounds[0] && parsed < bounds[1];
    }
    if (expected.token === "RELATIVE") {
      const bounds = relativeBounds(expected.direction, expected.count, expected.unit, runtime.now);
      const parsed = typeof value === "string" ? Date.parse(value) : NaN;
      return Number.isFinite(parsed) && parsed >= bounds[0] && parsed < bounds[1];
    }
    if (expected.token === "CATEGORY")
      return categoryStoredValues(field, expected.name).some((stored) => value === stored);
    return false;
  }
  const fieldDef = fields.get(field);
  if (["date", "datetime"].includes(fieldDef?.dataType ?? "") && typeof expected === "string") {
    const parsed = typeof value === "string" ? Date.parse(value) : NaN;
    if (!Number.isFinite(parsed)) return false;
    const start = dateOnlyStart(expected);
    return parsed >= start && parsed < start + DAY_MS;
  }
  if (
    TEXT_TYPES.has(fieldDef?.dataType ?? "") &&
    typeof value === "string" &&
    typeof expected === "string"
  )
    return value.toLowerCase() === expected.toLowerCase();
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
    isCriteriaToken(expected) &&
    (expected.token === "NEXT7DAYS" || expected.token === "TODAYANDOVERDUE")
  ) {
    const bounds = periodBounds(expected, runtime.now);
    const parsed = typeof value === "string" ? Date.parse(value) : NaN;
    return bounds !== null && parsed >= bounds[0] && parsed < bounds[1];
  }
  if (
    !isCriteriaToken(expected) ||
    (expected.token !== "AGEINDAYS" && expected.token !== "DUEINDAYS") ||
    typeof value !== "string"
  )
    return false;
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) return false;
  const unit = expected.unit ?? "days";
  const nowMs = runtime.now.getTime();
  if (expected.token === "DUEINDAYS") {
    if (parsed <= nowMs) return false;
    if (unit === "days") return parsed <= nowMs + expected.offset * DAY_MS;
    if (unit === "weeks") return parsed <= nowMs + expected.offset * 7 * DAY_MS;
    return parsed <= addCalendarMonths(runtime.now, expected.offset);
  }
  if (unit === "days") return Math.floor((nowMs - parsed) / DAY_MS) <= expected.offset;
  if (unit === "weeks") return Math.floor((nowMs - parsed) / DAY_MS) <= expected.offset * 7;
  return parsed >= subtractCalendarMonths(runtime.now, expected.offset);
}

export function matches(
  record: RecordData,
  criteria: Criteria,
  runtime: CriteriaRuntime,
  fields: ReadonlyMap<string, FieldDefinition> = fieldByName,
): boolean {
  if ("group" in criteria) {
    return criteria.groupOperator === "and"
      ? criteria.group.every((child) => matches(record, child, runtime, fields))
      : criteria.group.some((child) => matches(record, child, runtime, fields));
  }
  // A leaf on a field absent from module metadata is published but does not constrain.
  if (!fields.has(criteria.field)) return true;
  const raw = record.fields[criteria.field] ?? null;
  if (criteria.field === "Tag" && fields.get("Tag")?.acceptsJsonArray) {
    const tags = Array.isArray(raw) ? raw : [];
    if (criteria.comparator === "is_empty") return tags.length === 0;
    if (criteria.comparator === "is_not_empty") return tags.length > 0;
    const ids = Array.isArray(criteria.value) ? criteria.value : [criteria.value];
    const any = tags.some(
      (tag) => tag && typeof tag === "object" && "id" in tag && ids.includes(tag.id),
    );
    return criteria.comparator === "equal" ? any : criteria.comparator === "not_equal" && !any;
  }
  if (isCriteriaToken(criteria.value) && criteria.value.token === "CURRENTTIME") {
    const parsed = typeof raw === "string" ? Date.parse(raw) : NaN;
    if (!Number.isFinite(parsed)) return false;
    const instant = runtime.now.getTime();
    switch (criteria.comparator) {
      case "less_than":
        return parsed < instant;
      case "less_equal":
        return parsed <= instant;
      case "greater_than":
        return parsed > instant;
      case "greater_equal":
        return parsed >= instant;
      default:
        return false;
    }
  }
  // Equality by opaque ID serves related lists; other text values still match names.
  if (
    fields.get(criteria.field)?.dataType === "lookup" &&
    (criteria.comparator === "equal" || criteria.comparator === "not_equal") &&
    typeof criteria.value === "string" &&
    typeof raw === "object" &&
    raw !== null &&
    "id" in raw &&
    raw.id === criteria.value
  )
    return criteria.comparator === "equal";
  if (
    fields.get(criteria.field)?.dataType === "lookup" &&
    typeof criteria.value === "object" &&
    criteria.value !== null &&
    !Array.isArray(criteria.value) &&
    (criteria.comparator === "equal" || criteria.comparator === "not_equal")
  ) {
    const equal = equalValues(raw, criteria.value as FieldValue);
    return criteria.comparator === "equal" ? equal : !equal;
  }
  const value =
    fields.get(criteria.field)?.dataType === "lookup" &&
    typeof raw === "object" &&
    raw !== null &&
    "id" in raw
      ? typeof raw.name === "string"
        ? raw.name
        : null
      : fields.get(criteria.field)?.dataType === "bigint" &&
          typeof raw === "string" &&
          typeof criteria.value !== "string" &&
          /^-?\d+$/.test(raw)
        ? Number(raw)
        : raw;
  const dayRuntime =
    fields.get(criteria.field)?.dataType === "date"
      ? {
          ...runtime,
          now: new Date(
            Date.UTC(
              runtime.now.getUTCFullYear(),
              runtime.now.getUTCMonth(),
              runtime.now.getUTCDate(),
            ),
          ),
        }
      : runtime;
  switch (criteria.comparator) {
    case "equal":
      return matchesEqual(criteria.field, value, criteria.value, dayRuntime, fields);
    case "not_equal":
      return !matchesEqual(criteria.field, value, criteria.value, dayRuntime, fields);
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
    case "less_than": {
      const fieldDef = fields.get(criteria.field);
      if (
        ["date", "datetime"].includes(fieldDef?.dataType ?? "") &&
        typeof criteria.value === "string"
      ) {
        const parsed = typeof value === "string" ? Date.parse(value) : NaN;
        if (!Number.isFinite(parsed)) return false;
        return parsed < dateOnlyStart(criteria.value);
      }
      return (
        typeof value === "number" && typeof criteria.value === "number" && value < criteria.value
      );
    }
    case "greater_than": {
      const fieldDef = fields.get(criteria.field);
      if (
        ["date", "datetime"].includes(fieldDef?.dataType ?? "") &&
        typeof criteria.value === "string"
      ) {
        const parsed = typeof value === "string" ? Date.parse(value) : NaN;
        if (!Number.isFinite(parsed)) return false;
        return parsed >= dateOnlyStart(criteria.value) + DAY_MS;
      }
      return (
        typeof value === "number" && typeof criteria.value === "number" && value > criteria.value
      );
    }
    case "greater_equal":
      return (
        typeof value === "number" && typeof criteria.value === "number" && value >= criteria.value
      );
    case "between":
    case "not_between": {
      const fieldDef = fields.get(criteria.field);
      if (["date", "datetime"].includes(fieldDef?.dataType ?? "") && isValueList(criteria.value)) {
        const parsed = typeof value === "string" ? Date.parse(value) : NaN;
        if (!Number.isFinite(parsed)) return false;
        const low = dateOnlyStart(criteria.value[0] as string);
        const high = dateOnlyStart(criteria.value[1] as string) + DAY_MS;
        const inside = parsed >= low && parsed < high;
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
        : matchesAge(value, criteria.value, dayRuntime);
    default:
      return false;
  }
}

export function matchesSearch(
  record: RecordData,
  search?: string,
  fields: readonly string[] = ["Full_Name", "Company", "Email", "Phone"],
): boolean {
  const needle = search?.trim().toLowerCase();
  if (!needle) return true;
  return fields.some((field) => {
    const value = record.fields[field];
    return typeof value === "string" && value.toLowerCase().includes(needle);
  });
}

function compareDecimal(left: string, right: string): number {
  const a = BigInt(left);
  const b = BigInt(right);
  return a < b ? -1 : a > b ? 1 : 0;
}

export function sortRecords(
  records: RecordData[],
  sort: SortSpec,
  fields: ReadonlyMap<string, FieldDefinition> = fieldByName,
): RecordData[] {
  if (sort.order !== "asc" && sort.order !== "desc")
    throw new ValidationError({ sort: ["Unknown sort field or order."] });
  const direction = sort.order === "asc" ? 1 : -1;
  const copy = [...records];
  if (sort.field === "id") {
    copy.sort((a, b) => compareDecimal(a.id, b.id) * direction);
    return copy;
  }
  const field = fields.get(sort.field);
  if (!field || field.acceptsJsonArray || field.dataType === "ALARM" || field.dataType === "RRULE")
    throw new ValidationError({ sort: ["Unknown sort field or order."] });
  // Ties keep the default id-descending order. Array.sort is stable.
  copy.sort((a, b) => compareDecimal(b.id, a.id));
  const normalize = (value: FieldValue): string | number | boolean | null => {
    if (value === null || value === "") return null;
    if (typeof value === "object") {
      if (!("id" in value)) return null;
      return field.dataType === "lookup"
        ? typeof value.name === "string"
          ? value.name.toLowerCase() || null
          : null
        : typeof value.id === "string"
          ? value.id.toLowerCase()
          : null;
    }
    if (["date", "datetime"].includes(field.dataType) && typeof value === "string")
      return Date.parse(value);
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
