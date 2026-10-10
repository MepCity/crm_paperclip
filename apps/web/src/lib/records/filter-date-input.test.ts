import { describe, expect, it } from "vitest";
import { displayDateToIso, isValidDisplayDateRange } from "./filter-date-input";

describe("displayDateToIso", () => {
  it("accepts valid calendar dates", () => {
    expect(displayDateToIso("01.01.2024")).toBe("2024-01-01");
    expect(displayDateToIso("29.02.2024")).toBe("2024-02-29");
  });

  it("rejects invalid shapes and dates", () => {
    expect(displayDateToIso("")).toBeNull();
    expect(displayDateToIso("1.1.2024")).toBeNull();
    expect(displayDateToIso("32.01.2024")).toBeNull();
    expect(displayDateToIso("29.02.2023")).toBeNull();
    expect(displayDateToIso("not-a-date")).toBeNull();
  });
});

describe("isValidDisplayDateRange", () => {
  it("requires both ends valid and ordered", () => {
    expect(isValidDisplayDateRange("01.01.2024", "31.01.2024")).toBe(true);
    expect(isValidDisplayDateRange("31.01.2024", "01.01.2024")).toBe(false);
    expect(isValidDisplayDateRange("bad", "01.01.2024")).toBe(false);
  });
});
