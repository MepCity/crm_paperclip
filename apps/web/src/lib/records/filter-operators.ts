/** Observed operators; unobserved controls are deliberately absent. */
export type FilterValueControl =
  | "text"
  | "number"
  | "range"
  | "choices"
  | "users"
  | "role_search"
  | "state"
  | "days"
  | "date"
  | "date_range"
  | "connected_to"
  | "address_nearby"
  | "tag"
  | "none";

export type FilterOperatorId =
  | "equal"
  | "not_equal"
  | "contains"
  | "not_contains"
  | "starts_with"
  | "ends_with"
  | "is_empty"
  | "is_not_empty"
  | "less_than"
  | "less_equal"
  | "greater_than"
  | "greater_equal"
  | "between"
  | "not_between"
  | "age_in"
  | "due_in"
  | "previous"
  | "next"
  | "on"
  | "before"
  | "after"
  | "today"
  | "tomorrow"
  | "till_yesterday"
  | "starting_tomorrow"
  | "yesterday"
  | "this_week"
  | "this_month"
  | "previous_week"
  | "previous_month"
  | "this_year"
  | "current_fy"
  | "current_fq"
  | "previous_year"
  | "previous_fy"
  | "previous_fq"
  | "next_year"
  | "next_fy"
  | "next_fq"
  | "belongs_to_role"
  | "not_belongs_to_role"
  | "belongs_to_group"
  | "is_nearby";

/** Operators with observed editors that are not yet mapped to port criteria (MEP-222 / Platform contract). */
export const operatorsWithoutCriteriaSupport = new Set<FilterOperatorId>([
  "previous",
  "next",
  "on",
  "before",
  "after",
  "current_fy",
  "current_fq",
  "previous_fy",
  "previous_fq",
  "next_fy",
  "next_fq",
  "belongs_to_role",
  "not_belongs_to_role",
  "belongs_to_group",
  "is_nearby",
]);

export interface FilterOperator {
  id: FilterOperatorId;
  label: string;
  control: FilterValueControl;
}
export interface FilterOperatorDefinition {
  operators: readonly FilterOperator[];
  defaultOperator: FilterOperatorId;
}
const empty: readonly FilterOperator[] = [
  { id: "is_empty", label: "is empty", control: "none" },
  { id: "is_not_empty", label: "is not empty", control: "none" },
];
const text: readonly FilterOperator[] = [
  { id: "equal", label: "is", control: "text" },
  { id: "not_equal", label: "isn't", control: "text" },
  { id: "contains", label: "contains", control: "text" },
  { id: "not_contains", label: "doesn't contain", control: "text" },
  { id: "starts_with", label: "starts with", control: "text" },
  { id: "ends_with", label: "ends with", control: "text" },
  ...empty,
];
function choices(control: "choices" | "users"): readonly FilterOperator[] {
  return [
    { id: "equal", label: "is", control },
    { id: "not_equal", label: "is not", control },
    ...empty,
  ];
}
const catalog = {
  text: { operators: text, defaultOperator: "contains" },
  email: { operators: text, defaultOperator: "equal" },
  phone: { operators: text, defaultOperator: "equal" },
  website: { operators: text, defaultOperator: "contains" },
  picklist: { operators: choices("choices"), defaultOperator: "equal" },
  currency: {
    operators: [
      { id: "equal", label: "=", control: "number" },
      { id: "not_equal", label: "!=", control: "number" },
      { id: "less_than", label: "<", control: "number" },
      { id: "less_equal", label: "<=", control: "number" },
      { id: "greater_than", label: ">", control: "number" },
      { id: "greater_equal", label: ">=", control: "number" },
      { id: "between", label: "between", control: "range" },
      { id: "not_between", label: "not between", control: "range" },
      ...empty,
    ],
    defaultOperator: "equal",
  },
  boolean: {
    operators: [{ id: "equal", label: "is", control: "state" }],
    defaultOperator: "equal",
  },
  ownerlookup: {
    operators: [
      { id: "equal", label: "is", control: "users" },
      { id: "not_equal", label: "is not", control: "users" },
      ...empty,
      { id: "belongs_to_role", label: "belongs to Role", control: "role_search" },
      { id: "not_belongs_to_role", label: "does not belong to Role", control: "role_search" },
      { id: "belongs_to_group", label: "belongs to Group", control: "role_search" },
    ],
    defaultOperator: "equal",
  },
  datetime: {
    operators: [
      { id: "age_in", label: "age in", control: "days" },
      { id: "due_in", label: "due in", control: "days" },
      { id: "previous", label: "Previous", control: "days" },
      { id: "next", label: "Next", control: "days" },
      { id: "on", label: "On", control: "date" },
      { id: "before", label: "before", control: "date" },
      { id: "not_between", label: "not between", control: "date_range" },
      { id: "after", label: "after", control: "date" },
      { id: "between", label: "between", control: "date_range" },
      { id: "today", label: "Today", control: "none" },
      { id: "tomorrow", label: "Tomorrow", control: "none" },
      { id: "till_yesterday", label: "Till Yesterday", control: "none" },
      { id: "starting_tomorrow", label: "Starting tomorrow", control: "none" },
      { id: "yesterday", label: "Yesterday", control: "none" },
      { id: "this_week", label: "This Week", control: "none" },
      { id: "this_month", label: "This Month", control: "none" },
      { id: "previous_week", label: "Previous Week", control: "none" },
      { id: "previous_month", label: "Previous Month", control: "none" },
      { id: "this_year", label: "This Year", control: "none" },
      { id: "current_fy", label: "Current FY", control: "none" },
      { id: "current_fq", label: "Current FQ", control: "none" },
      { id: "previous_year", label: "Previous Year", control: "none" },
      { id: "previous_fy", label: "Previous FY", control: "none" },
      { id: "previous_fq", label: "Previous FQ", control: "none" },
      { id: "next_year", label: "Next Year", control: "none" },
      { id: "next_fy", label: "Next FY", control: "none" },
      { id: "next_fq", label: "Next FQ", control: "none" },
      ...empty,
    ],
    defaultOperator: "age_in",
  },
  tag: {
    operators: [
      { id: "equal", label: "is", control: "tag" },
      { id: "not_equal", label: "is not", control: "tag" },
      ...empty,
    ],
    defaultOperator: "equal",
  },
  multilookup: {
    operators: text.map((operator) =>
      operator.control === "text" ? { ...operator, control: "connected_to" as const } : operator,
    ),
    defaultOperator: "equal",
  },
  compound_address: {
    operators: [{ id: "is_nearby", label: "is nearby", control: "address_nearby" }],
    defaultOperator: "is_nearby",
  },
} as const satisfies Record<string, FilterOperatorDefinition>;
export const numericFilterOperators: FilterOperatorDefinition = catalog.currency;
export const filterOperators = { ...catalog, integer: numericFilterOperators };
export type FilterFieldType = keyof typeof filterOperators;

/** Field types with observed editors but no Apply criteria contract yet. */
export const filterFieldTypesWithApplyBlocked = new Set<FilterFieldType>([
  "tag",
  "multilookup",
  "compound_address",
]);

export type AppliedFilterValue =
  | string
  | number
  | [number, number]
  | string[]
  | [string, string]
  | boolean
  | null;
export type DateUnit = "days" | "weeks" | "months";
export interface AppliedFilter {
  itemId: string;
  operatorId: FilterOperatorId;
  value: AppliedFilterValue;
}
