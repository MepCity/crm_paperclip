import { describe, expect, it } from "vitest";
import { panelFiltersToCriteria } from "./filter-criteria";
import type { FilterOperatorId } from "./filter-operators";

describe("panelFiltersToCriteria", () => {
  it("returns undefined for an empty list", () => {
    expect(panelFiltersToCriteria([])).toBeUndefined();
  });

  it("returns a single leaf for one row", () => {
    expect(
      panelFiltersToCriteria([{ field: "Company", operatorId: "contains", value: "  Acme  " }]),
    ).toEqual({
      field: "Company",
      comparator: "contains",
      value: "Acme",
    });
  });

  it("AND-combines multiple rows", () => {
    expect(
      panelFiltersToCriteria([
        { field: "Company", operatorId: "equal", value: "Acme" },
        { field: "Lead_Source", operatorId: "equal", value: ["Advertisement"] },
      ]),
    ).toEqual({
      groupOperator: "and",
      group: [
        { field: "Company", comparator: "equal", value: "Acme" },
        {
          field: "Lead_Source",
          comparator: "equal",
          value: ["Advertisement"],
        },
      ],
    });
  });

  const operatorCases: {
    operatorId: FilterOperatorId;
    value: string | number | [number, number] | string[] | true | null;
    expected: { comparator: string; value: unknown };
  }[] = [
    { operatorId: "equal", value: "x", expected: { comparator: "equal", value: "x" } },
    { operatorId: "not_equal", value: "x", expected: { comparator: "not_equal", value: "x" } },
    { operatorId: "contains", value: "x", expected: { comparator: "contains", value: "x" } },
    {
      operatorId: "not_contains",
      value: "x",
      expected: { comparator: "not_contains", value: "x" },
    },
    {
      operatorId: "starts_with",
      value: "x",
      expected: { comparator: "starts_with", value: "x" },
    },
    { operatorId: "ends_with", value: "x", expected: { comparator: "ends_with", value: "x" } },
    { operatorId: "is_empty", value: null, expected: { comparator: "is_empty", value: null } },
    {
      operatorId: "is_not_empty",
      value: null,
      expected: { comparator: "is_not_empty", value: null },
    },
    { operatorId: "less_than", value: 1, expected: { comparator: "less_than", value: 1 } },
    { operatorId: "less_equal", value: 1, expected: { comparator: "less_equal", value: 1 } },
    {
      operatorId: "greater_than",
      value: 1,
      expected: { comparator: "greater_than", value: 1 },
    },
    {
      operatorId: "greater_equal",
      value: 1,
      expected: { comparator: "greater_equal", value: 1 },
    },
    {
      operatorId: "between",
      value: [1, 2],
      expected: { comparator: "between", value: [1, 2] },
    },
    {
      operatorId: "not_between",
      value: [1, 2],
      expected: { comparator: "not_between", value: [1, 2] },
    },
    {
      operatorId: "age_in",
      value: 3,
      expected: { comparator: "less_equal", value: { token: "AGEINDAYS", offset: 3 } },
    },
    {
      operatorId: "due_in",
      value: 5,
      expected: { comparator: "less_equal", value: { token: "DUEINDAYS", offset: 5 } },
    },
    {
      operatorId: "today",
      value: null,
      expected: { comparator: "equal", value: { token: "TODAY" } },
    },
    {
      operatorId: "tomorrow",
      value: null,
      expected: { comparator: "equal", value: { token: "PERIOD", name: "TOMORROW" } },
    },
    {
      operatorId: "yesterday",
      value: null,
      expected: { comparator: "equal", value: { token: "PERIOD", name: "YESTERDAY" } },
    },
    {
      operatorId: "till_yesterday",
      value: null,
      expected: { comparator: "equal", value: { token: "PERIOD", name: "TILL_YESTERDAY" } },
    },
    {
      operatorId: "starting_tomorrow",
      value: null,
      expected: { comparator: "equal", value: { token: "PERIOD", name: "STARTING_TOMORROW" } },
    },
    {
      operatorId: "this_week",
      value: null,
      expected: { comparator: "equal", value: { token: "PERIOD", name: "THIS_WEEK" } },
    },
    {
      operatorId: "previous_week",
      value: null,
      expected: { comparator: "equal", value: { token: "PERIOD", name: "PREVIOUS_WEEK" } },
    },
    {
      operatorId: "this_month",
      value: null,
      expected: { comparator: "equal", value: { token: "PERIOD", name: "THIS_MONTH" } },
    },
    {
      operatorId: "previous_month",
      value: null,
      expected: { comparator: "equal", value: { token: "PERIOD", name: "PREVIOUS_MONTH" } },
    },
    {
      operatorId: "this_year",
      value: null,
      expected: { comparator: "equal", value: { token: "PERIOD", name: "THIS_YEAR" } },
    },
    {
      operatorId: "previous_year",
      value: null,
      expected: { comparator: "equal", value: { token: "PERIOD", name: "PREVIOUS_YEAR" } },
    },
    {
      operatorId: "next_year",
      value: null,
      expected: { comparator: "equal", value: { token: "PERIOD", name: "NEXT_YEAR" } },
    },
  ];

  for (const { operatorId, value, expected } of operatorCases) {
    it(`maps ${operatorId} to ${expected.comparator}`, () => {
      expect(panelFiltersToCriteria([{ field: "Created_Time", operatorId, value }])).toEqual({
        field: "Created_Time",
        comparator: expected.comparator,
        value: expected.value,
      });
    });
  }
});

it("preserves the Not Selected boolean state and integer range", () => {
  expect(
    panelFiltersToCriteria([{ field: "Email_Opt_Out", operatorId: "equal", value: false }]),
  ).toEqual({ field: "Email_Opt_Out", comparator: "equal", value: false });
  expect(
    panelFiltersToCriteria([{ field: "No_of_Employees", operatorId: "between", value: [2, 10] }]),
  ).toEqual({ field: "No_of_Employees", comparator: "between", value: [2, 10] });
});
