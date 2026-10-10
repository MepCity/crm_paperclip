import { describe, expect, it } from "vitest";
import { ValidationError } from "../../errors";
import type { Criteria, FieldValue, RecordData } from "../contract";
import { matches, validateCriteria } from "./query";

const runtime = { now: new Date("2026-01-05T12:00:00.000Z"), userId: "test-owner" };
const record = (field: string, value: FieldValue): RecordData => ({
  id: "1",
  fields: { [field]: value },
});

describe("panel predicate boundaries", () => {
  it.each([
    ["First_Name", "Alpha"],
    ["Email", "a@example.test"],
    ["Phone", "123"],
    ["Lead_Status", "Contacted"],
    ["Annual_Revenue", 0],
    ["No_of_Employees", 0],
    ["Latitude", 0],
    ["Email_Opt_Out", false],
    ["Owner", "test-owner"],
    ["Created_Time", "2026-01-05T00:00:00.000Z"],
  ] as const)(
    "%s emptiness distinguishes null/empty/missing from populated values",
    (field, populated) => {
      for (const comparator of ["is_empty", "is_not_empty"] as const) {
        const criterion: Criteria = { field, comparator, value: null };
        validateCriteria(criterion);
        for (const empty of [null, ""])
          expect(matches(record(field, empty), criterion, runtime)).toBe(comparator === "is_empty");
        expect(matches({ id: "1", fields: {} }, criterion, runtime)).toBe(
          comparator === "is_empty",
        );
        expect(matches(record(field, populated), criterion, runtime)).toBe(
          comparator === "is_not_empty",
        );
      }
    },
  );
  it("negative owner and picklist membership matches empty values but preserves case", () => {
    for (const [field, expected] of [
      ["Owner", "test-owner"],
      ["Lead_Status", "Contacted"],
    ]) {
      const criterion: Criteria = {
        field: field as string,
        comparator: "not_equal",
        value: [expected as string],
      };
      validateCriteria(criterion);
      expect(matches(record(field as string, null), criterion, runtime)).toBe(true);
      expect(matches(record(field as string, ""), criterion, runtime)).toBe(true);
      expect(matches(record(field as string, expected as string), criterion, runtime)).toBe(false);
      expect(
        matches(record(field as string, (expected as string).toUpperCase()), criterion, runtime),
      ).toBe(true);
    }
  });
  it("only numeric != matches an empty numeric value", () => {
    for (const comparator of [
      "equal",
      "not_equal",
      "less_than",
      "less_equal",
      "greater_than",
      "greater_equal",
      "between",
      "not_between",
    ] as const) {
      const criterion: Criteria = {
        field: "Annual_Revenue",
        comparator,
        value: comparator === "between" || comparator === "not_between" ? [10, 20] : 10,
      };
      validateCriteria(criterion);
      for (const empty of [null, ""])
        expect(matches(record("Annual_Revenue", empty), criterion, runtime)).toBe(
          comparator === "not_equal",
        );
    }
  });
  it("range endpoints are inclusive and negative/decimal numbers compare numerically", () => {
    const criterion: Criteria = {
      field: "Annual_Revenue",
      comparator: "between",
      value: [-2.5, 0],
    };
    validateCriteria(criterion);
    expect(
      [-2.5001, -2.5, -1, 0, 0.0001].map((value) =>
        matches(record("Annual_Revenue", value), criterion, runtime),
      ),
    ).toEqual([false, true, true, true, false]);
    for (const value of [NaN, Infinity, -Infinity])
      expect(() =>
        validateCriteria({ field: "Annual_Revenue", comparator: "equal", value }),
      ).toThrow(ValidationError);
  });
  it("calendar date strings match only datetime fields, not text that looks like a date", () => {
    const isoTimestamp = "2026-01-05T10:00:00.000Z";
    const calendarDay = "2026-01-05";
    expect(
      matches(
        record("Company", isoTimestamp),
        {
          field: "Company",
          comparator: "equal",
          value: calendarDay,
        },
        runtime,
      ),
    ).toBe(false);
    expect(
      matches(
        record("Company", isoTimestamp),
        {
          field: "Company",
          comparator: "not_equal",
          value: calendarDay,
        },
        runtime,
      ),
    ).toBe(true);
    expect(
      matches(
        record("Company", calendarDay),
        {
          field: "Company",
          comparator: "equal",
          value: calendarDay,
        },
        runtime,
      ),
    ).toBe(true);
  });
  it("periods re-evaluate Sunday to Monday and preserve leap-day month boundaries", () => {
    const week: Criteria = {
      field: "Created_Time",
      comparator: "equal",
      value: { token: "PERIOD", name: "THIS_WEEK" },
    };
    const sunday = record("Created_Time", "2026-01-04T23:59:59.999Z");
    expect(matches(sunday, week, { ...runtime, now: new Date("2026-01-04T23:59:59.999Z") })).toBe(
      true,
    );
    expect(matches(sunday, week, { ...runtime, now: new Date("2026-01-05T00:00:00.000Z") })).toBe(
      false,
    );
    const month: Criteria = {
      field: "Created_Time",
      comparator: "equal",
      value: { token: "PERIOD", name: "PREVIOUS_MONTH" },
    };
    const march = { ...runtime, now: new Date("2024-03-01T00:00:00.000Z") };
    expect(matches(record("Created_Time", "2024-02-29T23:59:59.999Z"), month, march)).toBe(true);
    expect(matches(record("Created_Time", "2024-03-01T00:00:00.000Z"), month, march)).toBe(false);
  });
});
