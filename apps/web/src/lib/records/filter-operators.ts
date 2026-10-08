/** Observed operators; unobserved controls are deliberately absent. */
export type FilterValueControl =
  | "text"
  | "number"
  | "range"
  | "choices"
  | "users"
  | "state"
  | "days"
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
  | "previous_year"
  | "next_year";
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
export const filterOperators = {
  text: { operators: text, defaultOperator: "contains" },
  email: { operators: text, defaultOperator: "equal" },
  phone: { operators: text, defaultOperator: "equal" },
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
  ownerlookup: { operators: choices("users"), defaultOperator: "equal" },
  datetime: {
    operators: [
      { id: "age_in", label: "age in", control: "days" },
      { id: "due_in", label: "due in", control: "days" },
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
      { id: "previous_year", label: "Previous Year", control: "none" },
      { id: "next_year", label: "Next Year", control: "none" },
      ...empty,
    ],
    defaultOperator: "age_in",
  },
} as const satisfies Record<string, FilterOperatorDefinition>;
export type FilterFieldType = keyof typeof filterOperators;
export type AppliedFilterValue = string | number | [number, number] | string[] | true | null;
export interface AppliedFilter {
  itemId: string;
  operatorId: FilterOperatorId;
  value: AppliedFilterValue;
}
