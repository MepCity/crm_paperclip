import { describe, expect, test } from "vitest";
import { addDays, dateOrdinal, monthDays, slotTime, wallMinute, weekDays } from "./calendar-date";

describe("calendar date arithmetic", () => {
  test("supports Sunday, Monday and Saturday week starts", () => {
    expect(weekDays("2026-03-11", 0)[0]).toBe("2026-03-08");
    expect(weekDays("2026-03-11", 1)[0]).toBe("2026-03-09");
    expect(weekDays("2026-03-11", 6)[0]).toBe("2026-03-07");
  });
  test("always returns six complete weeks, including leap day and adjacent months", () => {
    const days = monthDays("2024-02-15", 1);
    expect(days).toHaveLength(6);
    expect(days.every((week) => week.length === 7)).toBe(true);
    expect(days[0]?.[0]).toBe("2024-01-29");
    expect(days[5]?.[6]).toBe("2024-03-10");
    expect(days.flat()).toContain("2024-02-29");
    expect(new Set(days.flat()).size).toBe(42);
  });
  test.each(["America/New_York", "Europe/Berlin", "Europe/Istanbul"])(
    "preserves wall days through both DST weeks under %s",
    (zone) => {
      const previous = process.env.TZ;
      try {
        process.env.TZ = zone;
        for (const start of ["2026-03-07", "2026-10-24", "2026-10-31"]) {
          const days = Array.from({ length: 9 }, (_, index) => addDays(start, index));
          days.slice(1).forEach((day, index) => {
            expect(dateOrdinal(day) - dateOrdinal(days[index] ?? "")).toBe(1);
            expect(wallMinute(`${day}T09:00`) - wallMinute(`${days[index]}T09:00`)).toBe(1440);
          });
        }
      } finally {
        if (previous === undefined) delete process.env.TZ;
        else process.env.TZ = previous;
      }
    },
  );
  test("crosses year boundaries and supports early years", () => {
    expect(addDays("2025-12-31", 1)).toBe("2026-01-01");
    expect(addDays("2024-03-01", -1)).toBe("2024-02-29");
    expect(addDays("0099-12-31", 1)).toBe("0100-01-01");
    expect(slotTime("2026-10-22", 1430)).toBe("2026-10-22T23:50");
  });
  test("rejects invalid dates, times, offsets and week starts", () => {
    for (const day of ["2026-02-29", "2026-13-01", "10/22/2026"])
      expect(() => dateOrdinal(day)).toThrow(RangeError);
    for (const value of [
      "2026-10-22T24:00",
      "2026-10-22T09:60",
      "2026-10-22T09:00Z",
      "2026-10-22T09:00+03:00",
    ])
      expect(() => wallMinute(value)).toThrow(RangeError);
    expect(() => weekDays("2026-10-22", 7)).toThrow(RangeError);
    expect(() => addDays("2026-10-22", 0.5)).toThrow(RangeError);
  });
});
