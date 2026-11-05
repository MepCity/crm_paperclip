import type { Criteria, FieldValue } from "../records/contract";
import type { ProcessCondition } from "./types";

type Fields = Readonly<Record<string, FieldValue>>;

const text = (value: unknown): string =>
  value === null || value === undefined ? "" : String(value);
const isEmpty = (value: unknown): boolean =>
  value === null ||
  value === undefined ||
  value === "" ||
  (Array.isArray(value) && value.length === 0);

/** Lookup values arrive as `{ id, name }`; compare by id for ids and by name for text. */
function scalarOf(value: unknown): unknown {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const lookup = value as { id?: unknown; name?: unknown };
    return lookup.name ?? lookup.id ?? null;
  }
  return value;
}

function sameValue(actual: unknown, expected: unknown): boolean {
  if (actual && typeof actual === "object" && !Array.isArray(actual)) {
    const lookup = actual as { id?: unknown; name?: unknown };
    return text(lookup.id) === text(expected) || text(lookup.name) === text(expected);
  }
  if (Array.isArray(actual)) return actual.some((item) => sameValue(item, expected));
  if (typeof actual === "boolean" || typeof expected === "boolean")
    return String(actual) === String(expected);
  return text(actual).toLowerCase() === text(expected).toLowerCase();
}

function compareNumbers(actual: unknown, expected: unknown): number | null {
  const a = typeof actual === "number" ? actual : Number(text(actual));
  const b = typeof expected === "number" ? expected : Number(text(expected));
  if (text(actual) !== "" && text(expected) !== "" && Number.isFinite(a) && Number.isFinite(b))
    return a - b;
  // ISO dates and plain strings compare lexically.
  const x = text(actual);
  const y = text(expected);
  if (x === "" || y === "") return null;
  return x < y ? -1 : x > y ? 1 : 0;
}

function leaf(fields: Fields, node: Extract<Criteria, { field: string }>): boolean {
  const actual = fields[node.field];
  const expected = node.value;
  if (typeof expected === "object" && expected !== null && !Array.isArray(expected)) {
    // Date tokens are not evaluated by the approval engine; they never match.
    return false;
  }
  switch (node.comparator) {
    case "is_empty":
      return isEmpty(actual);
    case "is_not_empty":
      return !isEmpty(actual);
    case "equal":
      return Array.isArray(expected)
        ? expected.some((item) => sameValue(actual, item))
        : sameValue(actual, expected);
    case "not_equal":
      return Array.isArray(expected)
        ? !expected.some((item) => sameValue(actual, item))
        : !sameValue(actual, expected);
    case "contains":
      return text(scalarOf(actual)).toLowerCase().includes(text(expected).toLowerCase());
    case "not_contains":
      return !text(scalarOf(actual)).toLowerCase().includes(text(expected).toLowerCase());
    case "starts_with":
      return text(scalarOf(actual)).toLowerCase().startsWith(text(expected).toLowerCase());
    case "ends_with":
      return text(scalarOf(actual)).toLowerCase().endsWith(text(expected).toLowerCase());
    case "less_than":
    case "less_equal":
    case "greater_than":
    case "greater_equal": {
      const diff = compareNumbers(actual, expected);
      if (diff === null) return false;
      if (node.comparator === "less_than") return diff < 0;
      if (node.comparator === "less_equal") return diff <= 0;
      if (node.comparator === "greater_than") return diff > 0;
      return diff >= 0;
    }
    case "between":
    case "not_between": {
      if (!Array.isArray(expected) || expected.length !== 2) return false;
      const low = compareNumbers(actual, expected[0]);
      const high = compareNumbers(actual, expected[1]);
      if (low === null || high === null) return false;
      const inside = low >= 0 && high <= 0;
      return node.comparator === "between" ? inside : !inside;
    }
    default:
      return false;
  }
}

export function matchesCriteria(fields: Fields, criteria: Criteria): boolean {
  if ("groupOperator" in criteria) {
    const results = criteria.group.map((child) => matchesCriteria(fields, child));
    return criteria.groupOperator === "and" ? results.every(Boolean) : results.some(Boolean);
  }
  return leaf(fields, criteria);
}

export function matchesCondition(fields: Fields, condition: ProcessCondition): boolean {
  return condition.kind === "all_records" ? true : matchesCriteria(fields, condition.criteria);
}
