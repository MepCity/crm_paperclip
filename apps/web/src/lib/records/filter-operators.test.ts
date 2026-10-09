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
    ],
  },
  datetime: {
    defaultOperator: "age_in",
    operators: [
      ["age_in", "age in", "days"],
      ["due_in", "due in", "days"],
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
      ["previous_year", "Previous Year", "none"],
      ["next_year", "Next Year", "none"],
      ["is_empty", "is empty", "none"],
      ["is_not_empty", "is not empty", "none"],
    ],
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
test("unobserved field types have no editor catalog", () => {
  expect(Object.keys(filterOperators)).toEqual([
    "text",
    "email",
    "phone",
    "picklist",
    "currency",
    "boolean",
    "ownerlookup",
    "datetime",
  ]);
});
