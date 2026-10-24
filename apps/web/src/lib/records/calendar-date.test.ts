import { describe, expect, it } from "vitest";
import {
  calendarShapeToDisplayDate,
  DATE_MASK_PLACEHOLDER,
  displayDateToCalendarShape,
  displayDateToModelShape,
  isCalendarDate,
} from "./calendar-date";

describe("displayDateToCalendarShape", () => {
  it("maps a complete entry onto the contract value", () => {
    expect(displayDateToCalendarShape("15.02.2026")).toBe("2026-02-15");
    expect(displayDateToCalendarShape("  01.01.2024  ")).toBe("2024-01-01");
  });

  it("keeps the shape of a day that never happened so validation can report it", () => {
    expect(displayDateToCalendarShape("30.02.2026")).toBe("2026-02-30");
    expect(displayDateToCalendarShape("31.04.2026")).toBe("2026-04-31");
  });

  it("yields nothing until the entry is a full day", () => {
    for (const value of [
      "",
      "   ",
      "1",
      "12.0",
      "1.2.2024",
      "12.02.26",
      "12/02/2026",
      "31.12.99999",
    ]) {
      expect(displayDateToCalendarShape(value)).toBeNull();
    }
  });
});

describe("displayDateToModelShape", () => {
  it("keeps a full day on the contract value", () => {
    expect(displayDateToModelShape("15.02.2026")).toBe("2026-02-15");
    expect(displayDateToModelShape("30.02.2026")).toBe("2026-02-30");
  });

  it("holds an unfinished entry as its typed text, not as the empty value", () => {
    for (const value of ["1", "15.", "15.02", "15.02.202", "1.2.2024"]) {
      expect(displayDateToModelShape(value)).toBe(value);
    }
  });

  it("is empty only when nothing is left in the entry", () => {
    expect(displayDateToModelShape("")).toBeNull();
    expect(displayDateToModelShape("   ")).toBeNull();
  });

  it("stays out of the contract shape so validation can reject it", () => {
    for (const value of ["1", "15.02.202", "1.2.2024"]) {
      expect(isCalendarDate(displayDateToModelShape(value) ?? "")).toBe(false);
    }
  });
});

describe("calendarShapeToDisplayDate", () => {
  it("writes a contract value with the mask", () => {
    expect(calendarShapeToDisplayDate("2026-02-15")).toBe("15.02.2026");
    expect(calendarShapeToDisplayDate("2026-02-30")).toBe("30.02.2026");
  });

  it("shows anything outside the contract shape as it came in", () => {
    expect(calendarShapeToDisplayDate("")).toBe("");
    expect(calendarShapeToDisplayDate("2026-2-15")).toBe("2026-2-15");
  });

  it("round-trips a real day through the mask", () => {
    expect(displayDateToCalendarShape(calendarShapeToDisplayDate("2024-02-29"))).toBe("2024-02-29");
  });
});

describe("isCalendarDate", () => {
  it("accepts real days including a leap day", () => {
    for (const value of ["2024-02-29", "2026-02-28", "2026-01-01", "2026-12-31"]) {
      expect(isCalendarDate(value)).toBe(true);
    }
  });

  it("rejects impossible days, months and shapes", () => {
    for (const value of [
      "2026-02-30",
      "2023-02-29",
      "2026-04-31",
      "2026-13-01",
      "2026-00-10",
      "2026-02-00",
      "2026-2-15",
      "0000-01-01",
      "15.02.2026",
    ]) {
      expect(isCalendarDate(value)).toBe(false);
    }
  });
});

it("publishes the observed mask as the placeholder", () => {
  expect(DATE_MASK_PLACEHOLDER).toBe("DD.MM.YYYY");
});
