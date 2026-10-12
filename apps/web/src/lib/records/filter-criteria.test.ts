import { describe, expect, it } from "vitest";
import { combineCriteriaAnd, firstLetterCriteria, panelFiltersToCriteria } from "./filter-criteria";
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
    daysUnit?: "days" | "weeks" | "months";
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
    {
      operatorId: "on",
      value: "15.03.2024",
      expected: { comparator: "equal", value: "2024-03-15" },
    },
    {
      operatorId: "before",
      value: "01.12.2023",
      expected: { comparator: "less_than", value: "2023-12-01" },
    },
    {
      operatorId: "after",
      value: "01.12.2023",
      expected: { comparator: "greater_than", value: "2023-12-01" },
    },
    {
      operatorId: "between",
      value: ["01.01.2024", "31.01.2024"],
      expected: { comparator: "between", value: ["2024-01-01", "2024-01-31"] },
    },
    {
      operatorId: "not_between",
      value: ["01.01.2024", "31.01.2024"],
      expected: { comparator: "not_between", value: ["2024-01-01", "2024-01-31"] },
    },
    {
      operatorId: "previous",
      value: 2,
      expected: {
        comparator: "equal",
        value: { token: "RELATIVE", direction: "previous", count: 2, unit: "days" },
      },
    },
    {
      operatorId: "next",
      value: 1,
      daysUnit: "weeks",
      expected: {
        comparator: "equal",
        value: { token: "RELATIVE", direction: "next", count: 1, unit: "weeks" },
      },
    },
    {
      operatorId: "age_in",
      value: 4,
      daysUnit: "months",
      expected: {
        comparator: "less_equal",
        value: { token: "AGEINDAYS", offset: 4, unit: "months" },
      },
    },
    {
      operatorId: "due_in",
      value: 7,
      daysUnit: "weeks",
      expected: {
        comparator: "less_equal",
        value: { token: "DUEINDAYS", offset: 7, unit: "weeks" },
      },
    },
  ];

  for (const { operatorId, value, daysUnit, expected } of operatorCases) {
    it(`maps ${operatorId} to ${expected.comparator}`, () => {
      expect(
        panelFiltersToCriteria([{ field: "Created_Time", operatorId, value, daysUnit }]),
      ).toEqual({
        field: "Created_Time",
        comparator: expected.comparator,
        value: expected.value,
      });
    });
  }
});

describe("panelFiltersToCriteria date validation", () => {
  it("rejects invalid display dates at mapping time", () => {
    expect(() =>
      panelFiltersToCriteria([{ field: "Created_Time", operatorId: "on", value: "99.99.2024" }]),
    ).toThrow();
  });
});

it("preserves the Not Selected boolean state and integer range", () => {
  expect(
    panelFiltersToCriteria([{ field: "Email_Opt_Out", operatorId: "equal", value: false }]),
  ).toEqual({ field: "Email_Opt_Out", comparator: "equal", value: false });
  expect(
    panelFiltersToCriteria([{ field: "No_of_Employees", operatorId: "between", value: [2, 10] }]),
  ).toEqual({ field: "No_of_Employees", comparator: "between", value: [2, 10] });
});

describe("firstLetterCriteria", () => {
  it("adds no criterion for All", () => {
    expect(firstLetterCriteria("Full_Name", null)).toBeUndefined();
  });

  it("uses the text-family starts_with criterion on the link field", () => {
    expect(firstLetterCriteria("Full_Name", "S")).toEqual({
      field: "Full_Name",
      comparator: "starts_with",
      value: "S",
    });
  });
});

describe("combineCriteriaAnd", () => {
  it("returns undefined when nothing restricts the list", () => {
    expect(combineCriteriaAnd([])).toBeUndefined();
    expect(combineCriteriaAnd([undefined, undefined])).toBeUndefined();
  });

  it("returns the single present criterion unchanged", () => {
    const leaf = firstLetterCriteria("Full_Name", "A");
    expect(combineCriteriaAnd([undefined, leaf])).toEqual(leaf);
    expect(combineCriteriaAnd([leaf])).toEqual(leaf);
  });

  it("AND-combines a panel leaf with the letter", () => {
    const panel = panelFiltersToCriteria([
      { field: "Company", operatorId: "contains", value: "Example" },
    ]);
    expect(combineCriteriaAnd([panel, firstLetterCriteria("Full_Name", "L")])).toEqual({
      groupOperator: "and",
      group: [
        { field: "Company", comparator: "contains", value: "Example" },
        { field: "Full_Name", comparator: "starts_with", value: "L" },
      ],
    });
  });

  it("flattens a panel and-group instead of nesting it", () => {
    const panel = panelFiltersToCriteria([
      { field: "Company", operatorId: "contains", value: "Example" },
      { field: "Lead_Source", operatorId: "equal", value: ["Advertisement"] },
    ]);
    const combined = combineCriteriaAnd([panel, firstLetterCriteria("Full_Name", "S")]);
    expect(combined).toEqual({
      groupOperator: "and",
      group: [
        { field: "Company", comparator: "contains", value: "Example" },
        { field: "Lead_Source", comparator: "equal", value: ["Advertisement"] },
        { field: "Full_Name", comparator: "starts_with", value: "S" },
      ],
    });
  });

  it("keeps an or-group as one member of the and-group", () => {
    const or = {
      groupOperator: "or" as const,
      group: [
        { field: "Company", comparator: "contains" as const, value: "a" },
        { field: "Company", comparator: "contains" as const, value: "b" },
      ],
    };
    expect(combineCriteriaAnd([or, firstLetterCriteria("Full_Name", "Z")])).toEqual({
      groupOperator: "and",
      group: [or, { field: "Full_Name", comparator: "starts_with", value: "Z" }],
    });
  });
});
