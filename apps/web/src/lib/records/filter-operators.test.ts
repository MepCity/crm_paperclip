import { expect, test } from "vitest";
import { filterOperators } from "./filter-operators";

// Independently transcribed from MEP-198 and list-views.md > Filter operators by field type.
const text = [
  ["equal", "is", "text"],
  ["not_equal", "isn't", "text"],
  ["contains", "contains", "text"],
  ["not_contains", "doesn't contain", "text"],
  ["starts_with", "starts with", "text"],
  ["ends_with", "ends with", "text"],
  ["is_empty", "is empty", "none"],
  ["is_not_empty", "is not empty", "none"],
];
const expectations = {
  text: { defaultOperator: "contains", operators: text },
  email: { defaultOperator: "equal", operators: text },
  phone: { defaultOperator: "equal", operators: text },
  website: { defaultOperator: "contains", operators: text },
  picklist: {
    defaultOperator: "equal",
    operators: [
      ["equal", "is", "choices"],
      ["not_equal", "is not", "choices"],
      ["is_empty", "is empty", "none"],
      ["is_not_empty", "is not empty", "none"],
    ],
  },
  currency: {
    defaultOperator: "equal",
    operators: [
      ["equal", "=", "number"],
      ["not_equal", "!=", "number"],
      ["less_than", "<", "number"],
      ["less_equal", "<=", "number"],
      ["greater_than", ">", "number"],
      ["greater_equal", ">=", "number"],
      ["between", "between", "range"],
      ["not_between", "not between", "range"],
      ["is_empty", "is empty", "none"],
      ["is_not_empty", "is not empty", "none"],
    ],
  },
  boolean: { defaultOperator: "equal", operators: [["equal", "is", "state"]] },
  ownerlookup: {
    defaultOperator: "equal",
    operators: [
      ["equal", "is", "users"],
      ["not_equal", "is not", "users"],
      ["is_empty", "is empty", "none"],
      ["is_not_empty", "is not empty", "none"],
      ["belongs_to_role", "belongs to Role", "role_search"],
      ["not_belongs_to_role", "does not belong to Role", "role_search"],
      ["belongs_to_group", "belongs to Group", "role_search"],
    ],
  },
  datetime: {
    defaultOperator: "age_in",
    operators: [
      ["age_in", "age in", "days"],
      ["due_in", "due in", "days"],
      ["previous", "Previous", "days"],
      ["next", "Next", "days"],
      ["on", "On", "date"],
      ["before", "before", "date"],
      ["not_between", "not between", "date_range"],
      ["after", "after", "date"],
      ["between", "between", "date_range"],
      ["today", "Today", "none"],
      ["tomorrow", "Tomorrow", "none"],
      ["till_yesterday", "Till Yesterday", "none"],
      ["starting_tomorrow", "Starting tomorrow", "none"],
      ["yesterday", "Yesterday", "none"],
      ["this_week", "This Week", "none"],
      ["this_month", "This Month", "none"],
      ["previous_week", "Previous Week", "none"],
      ["previous_month", "Previous Month", "none"],
      ["this_year", "This Year", "none"],
      ["current_fy", "Current FY", "none"],
      ["current_fq", "Current FQ", "none"],
      ["previous_year", "Previous Year", "none"],
      ["previous_fy", "Previous FY", "none"],
      ["previous_fq", "Previous FQ", "none"],
      ["next_year", "Next Year", "none"],
      ["next_fy", "Next FY", "none"],
      ["next_fq", "Next FQ", "none"],
      ["is_empty", "is empty", "none"],
      ["is_not_empty", "is not empty", "none"],
    ],
  },
  tag: {
    defaultOperator: "equal",
    operators: [
      ["equal", "is", "tag"],
      ["not_equal", "is not", "tag"],
      ["is_empty", "is empty", "none"],
      ["is_not_empty", "is not empty", "none"],
    ],
  },
  multilookup: {
    defaultOperator: "equal",
    operators: text.map((row) => (row[2] === "text" ? [row[0], row[1], "connected_to"] : row)),
  },
  compound_address: {
    defaultOperator: "is_nearby",
    operators: [["is_nearby", "is nearby", "address_nearby"]],
  },
};
for (const [type, expected] of Object.entries(expectations)) {
  test(`${type}: exact order, labels, IDs, default and value control`, () => {
    const actual = filterOperators[type as keyof typeof filterOperators];
    expect(actual.defaultOperator).toBe(expected.defaultOperator);
    expect(
      actual.operators.map((operator) => [operator.id, operator.label, operator.control]),
    ).toEqual(expected.operators);
  });
}
test("integer reuses the observed numeric operators without a currency prefix", () => {
  expect(filterOperators.integer).toEqual(filterOperators.currency);
});
test("unobserved field types have no editor catalog", () => {
  expect(Object.keys(filterOperators)).toEqual([
    "text",
    "email",
    "phone",
    "website",
    "picklist",
    "currency",
    "boolean",
    "ownerlookup",
    "datetime",
    "tag",
    "multilookup",
    "compound_address",
    "integer",
  ]);
});
