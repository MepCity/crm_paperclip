import { describe, expect, it } from "vitest";
import {
  type ExpandRecurrenceInput,
  expandRecurrence,
  UnsupportedRecurrenceError,
} from "./recurrence";

describe("expandRecurrence", () => {
  describe("günlük INTERVAL (Daily with INTERVAL)", () => {
    it("generates daily occurrences with default INTERVAL=1", () => {
      const result = expandRecurrence({
        rrule: "FREQ=DAILY",
        start: "2026-06-01T09:00",
        windowStart: "2026-06-01T00:00",
        windowEnd: "2026-06-05T00:00",
      });
      expect(result).toEqual([
        "2026-06-01T09:00",
        "2026-06-02T09:00",
        "2026-06-03T09:00",
        "2026-06-04T09:00",
      ]);
    });

    it("generates daily occurrences stepping by INTERVAL=3", () => {
      const result = expandRecurrence({
        rrule: "FREQ=DAILY;INTERVAL=3",
        start: "2026-06-01T09:00",
        windowStart: "2026-06-01T00:00",
        windowEnd: "2026-06-12T00:00",
      });
      expect(result).toEqual([
        "2026-06-01T09:00",
        "2026-06-04T09:00",
        "2026-06-07T09:00",
        "2026-06-10T09:00",
      ]);
    });

    it("correctly handles month transitions", () => {
      const result = expandRecurrence({
        rrule: "FREQ=DAILY;INTERVAL=1",
        start: "2026-01-30T10:00",
        windowStart: "2026-01-30T00:00",
        windowEnd: "2026-02-03T00:00",
      });
      expect(result).toEqual([
        "2026-01-30T10:00",
        "2026-01-31T10:00",
        "2026-02-01T10:00",
        "2026-02-02T10:00",
      ]);
    });
  });

  describe("haftalık çok gün + INTERVAL=2 (Weekly multiple days + INTERVAL=2)", () => {
    it("expands weekly occurrences on MO, WE, FR stepping every 2 weeks", () => {
      // 2026-10-19 is Monday
      const result = expandRecurrence({
        rrule: "FREQ=WEEKLY;INTERVAL=2;BYDAY=MO,WE,FR",
        start: "2026-10-19T10:00",
        windowStart: "2026-10-19T00:00",
        windowEnd: "2026-11-09T00:00",
      });
      expect(result).toEqual([
        // Week 1 (Oct 19)
        "2026-10-19T10:00",
        "2026-10-21T10:00",
        "2026-10-23T10:00",
        // Week 2 (Oct 26) skipped due to INTERVAL=2
        // Week 3 (Nov 02)
        "2026-11-02T10:00",
        "2026-11-04T10:00",
        "2026-11-06T10:00",
      ]);
    });

    it("skips days earlier than start in the first week", () => {
      // 2026-10-21 is Wednesday
      const result = expandRecurrence({
        rrule: "FREQ=WEEKLY;INTERVAL=2;BYDAY=MO,WE",
        start: "2026-10-21T10:00",
        windowStart: "2026-10-19T00:00",
        windowEnd: "2026-11-08T00:00",
      });
      // Oct 19 (Monday) is before start, so skipped
      expect(result).toEqual([
        "2026-10-21T10:00",
        // Oct 26 week skipped
        "2026-11-02T10:00",
        "2026-11-04T10:00",
      ]);
    });

    it("respects WKST=SU", () => {
      // 2026-10-18 is Sunday
      const result = expandRecurrence({
        rrule: "FREQ=WEEKLY;INTERVAL=2;BYDAY=SU,WE;WKST=SU",
        start: "2026-10-18T10:00",
        windowStart: "2026-10-18T00:00",
        windowEnd: "2026-11-08T00:00",
      });
      expect(result).toEqual([
        "2026-10-18T10:00",
        "2026-10-21T10:00",
        // Next workweek (Oct 25-31) skipped
        "2026-11-01T10:00",
        "2026-11-04T10:00",
      ]);
    });

    it("preserves ascending order regardless of BYDAY parameter order", () => {
      const result = expandRecurrence({
        rrule: "FREQ=WEEKLY;BYDAY=FR,MO,WE",
        start: "2026-10-19T09:00",
        windowStart: "2026-10-19T00:00",
        windowEnd: "2026-10-26T00:00",
      });
      expect(result).toEqual(["2026-10-19T09:00", "2026-10-21T09:00", "2026-10-23T09:00"]);
    });
  });

  describe("aylık -1FR ve 2TU (Monthly -1FR and 2TU)", () => {
    it("expands 2TU to the 2nd Tuesday of each month", () => {
      const result = expandRecurrence({
        rrule: "FREQ=MONTHLY;BYDAY=2TU",
        start: "2026-10-01T14:30",
        windowStart: "2026-10-01T00:00",
        windowEnd: "2027-01-01T00:00",
      });
      expect(result).toEqual([
        "2026-10-13T14:30", // 2nd Tuesday in Oct 2026
        "2026-11-10T14:30", // 2nd Tuesday in Nov 2026
        "2026-12-08T14:30", // 2nd Tuesday in Dec 2026
      ]);
    });

    it("expands -1FR to the last Friday of each month", () => {
      const result = expandRecurrence({
        rrule: "FREQ=MONTHLY;BYDAY=-1FR",
        start: "2026-10-01T16:00",
        windowStart: "2026-10-01T00:00",
        windowEnd: "2027-01-01T00:00",
      });
      expect(result).toEqual([
        "2026-10-30T16:00", // Last Friday in Oct 2026 (Oct 30)
        "2026-11-27T16:00", // Last Friday in Nov 2026 (Nov 27)
        "2026-12-25T16:00", // Last Friday in Dec 2026 (Dec 25)
      ]);
    });

    it("skips month when the 5th weekday does not exist", () => {
      // Oct 2026 has only 4 Tuesdays (Oct 6, 13, 20, 27)
      // Nov 2026 has only 4 Tuesdays (Nov 3, 10, 17, 24)
      // Dec 2026 has 5 Tuesdays (Dec 1, 8, 15, 22, 29)
      const result = expandRecurrence({
        rrule: "FREQ=MONTHLY;BYDAY=5TU",
        start: "2026-10-01T10:00",
        windowStart: "2026-10-01T00:00",
        windowEnd: "2027-01-01T00:00",
      });
      expect(result).toEqual(["2026-12-29T10:00"]);
    });
  });

  describe("BYMONTHDAY=31", () => {
    it("skips months without 31 days without shifting", () => {
      const result = expandRecurrence({
        rrule: "FREQ=MONTHLY;BYMONTHDAY=31",
        start: "2026-01-31T11:00",
        windowStart: "2026-01-01T00:00",
        windowEnd: "2026-07-01T00:00",
      });
      expect(result).toEqual([
        "2026-01-31T11:00",
        // Feb (28) skipped
        "2026-03-31T11:00",
        // Apr (30) skipped
        "2026-05-31T11:00",
        // Jun (30) skipped
      ]);
    });

    it("handles BYMONTHDAY=-1 (last day of each month)", () => {
      const result = expandRecurrence({
        rrule: "FREQ=MONTHLY;BYMONTHDAY=-1",
        start: "2026-01-31T11:00",
        windowStart: "2026-01-01T00:00",
        windowEnd: "2026-05-01T00:00",
      });
      expect(result).toEqual([
        "2026-01-31T11:00",
        "2026-02-28T11:00",
        "2026-03-31T11:00",
        "2026-04-30T11:00",
      ]);
    });
  });

  describe("yıllık 29 Şubat (Yearly Feb 29)", () => {
    it("occurs only in leap years when start is Feb 29", () => {
      const result = expandRecurrence({
        rrule: "FREQ=YEARLY;INTERVAL=1",
        start: "2024-02-29T12:00",
        windowStart: "2024-01-01T00:00",
        windowEnd: "2033-01-01T00:00",
      });
      expect(result).toEqual([
        "2024-02-29T12:00",
        // 2025, 2026, 2027 non-leap: skipped
        "2028-02-29T12:00",
        // 2029, 2030, 2031 non-leap: skipped
        "2032-02-29T12:00",
      ]);
    });

    it("recurs annually on normal dates", () => {
      const result = expandRecurrence({
        rrule: "FREQ=YEARLY;INTERVAL=2",
        start: "2024-05-15T10:00",
        windowStart: "2024-01-01T00:00",
        windowEnd: "2030-01-01T00:00",
      });
      expect(result).toEqual(["2024-05-15T10:00", "2026-05-15T10:00", "2028-05-15T10:00"]);
    });
  });

  describe("COUNT'un pencereden önce tüketilmesi (COUNT exhausted before window)", () => {
    it("returns empty when all COUNT occurrences fall before windowStart", () => {
      const result = expandRecurrence({
        rrule: "FREQ=DAILY;COUNT=3",
        start: "2026-01-01T09:00",
        windowStart: "2026-01-10T00:00",
        windowEnd: "2026-01-20T00:00",
      });
      expect(result).toEqual([]);
    });

    it("counts occurrences before window against the total COUNT limit", () => {
      const result = expandRecurrence({
        rrule: "FREQ=DAILY;COUNT=5",
        start: "2026-01-01T09:00",
        windowStart: "2026-01-03T00:00",
        windowEnd: "2026-01-10T00:00",
      });
      // Jan 1 and Jan 2 are counted before window; Jan 3, 4, 5 are in window; total = 5
      expect(result).toEqual(["2026-01-03T09:00", "2026-01-04T09:00", "2026-01-05T09:00"]);
    });
  });

  describe("UNTIL dahil (UNTIL inclusive)", () => {
    it("includes occurrence on the UNTIL date with date-only format", () => {
      const result = expandRecurrence({
        rrule: "FREQ=DAILY;UNTIL=20260105",
        start: "2026-01-01T10:00",
        windowStart: "2026-01-01T00:00",
        windowEnd: "2026-01-10T00:00",
      });
      expect(result).toEqual([
        "2026-01-01T10:00",
        "2026-01-02T10:00",
        "2026-01-03T10:00",
        "2026-01-04T10:00",
        "2026-01-05T10:00",
      ]);
    });

    it("includes occurrence matching exact UNTIL timestamp", () => {
      const result = expandRecurrence({
        rrule: "FREQ=DAILY;UNTIL=20260105T100000Z",
        start: "2026-01-01T10:00",
        windowStart: "2026-01-01T00:00",
        windowEnd: "2026-01-10T00:00",
      });
      expect(result).toEqual([
        "2026-01-01T10:00",
        "2026-01-02T10:00",
        "2026-01-03T10:00",
        "2026-01-04T10:00",
        "2026-01-05T10:00",
      ]);
    });

    it("excludes occurrence when UNTIL time on that day is earlier than start time", () => {
      const result = expandRecurrence({
        rrule: "FREQ=DAILY;UNTIL=20260105T093000Z",
        start: "2026-01-01T10:00",
        windowStart: "2026-01-01T00:00",
        windowEnd: "2026-01-10T00:00",
      });
      expect(result).toEqual([
        "2026-01-01T10:00",
        "2026-01-02T10:00",
        "2026-01-03T10:00",
        "2026-01-04T10:00",
      ]);
    });
  });

  describe("EXDATE", () => {
    it("omits occurrences that match exdates without shifting or extending count", () => {
      const result = expandRecurrence({
        rrule: "FREQ=DAILY;COUNT=5",
        start: "2026-01-01T10:00",
        windowStart: "2026-01-01T00:00",
        windowEnd: "2026-01-10T00:00",
        exdates: ["2026-01-02T10:00", "2026-01-04T10:00"],
      });
      expect(result).toEqual(["2026-01-01T10:00", "2026-01-03T10:00", "2026-01-05T10:00"]);
    });
  });

  describe("maxOccurrences kesmesi (maxOccurrences truncation)", () => {
    it("defaults to 500 max occurrences", () => {
      const result = expandRecurrence({
        rrule: "FREQ=DAILY",
        start: "2026-01-01T00:00",
        windowStart: "2026-01-01T00:00",
        windowEnd: "2029-01-01T00:00", // ~1095 days
      });
      expect(result).toHaveLength(500);
      expect(result[0]).toBe("2026-01-01T00:00");
    });

    it("truncates at custom maxOccurrences", () => {
      const result = expandRecurrence({
        rrule: "FREQ=DAILY",
        start: "2026-01-01T00:00",
        windowStart: "2026-01-01T00:00",
        windowEnd: "2026-01-31T00:00",
        maxOccurrences: 5,
      });
      expect(result).toHaveLength(5);
      expect(result).toEqual([
        "2026-01-01T00:00",
        "2026-01-02T00:00",
        "2026-01-03T00:00",
        "2026-01-04T00:00",
        "2026-01-05T00:00",
      ]);
    });
  });

  describe("desteklenmeyen parça hataları (Unsupported parts errors)", () => {
    const baseInput: ExpandRecurrenceInput = {
      rrule: "",
      start: "2026-10-01T10:00",
      windowStart: "2026-10-01T00:00",
      windowEnd: "2026-11-01T00:00",
    };

    it("throws on unsupported FREQ=HOURLY", () => {
      expect(() => expandRecurrence({ ...baseInput, rrule: "FREQ=HOURLY" })).toThrow(
        UnsupportedRecurrenceError,
      );
    });

    it("throws on unsupported BYSETPOS", () => {
      expect(() => expandRecurrence({ ...baseInput, rrule: "FREQ=DAILY;BYSETPOS=1" })).toThrow(
        UnsupportedRecurrenceError,
      );
    });

    it("throws on unsupported BYHOUR", () => {
      expect(() => expandRecurrence({ ...baseInput, rrule: "FREQ=DAILY;BYHOUR=10" })).toThrow(
        UnsupportedRecurrenceError,
      );
    });

    it("throws on unsupported BYMONTH", () => {
      expect(() => expandRecurrence({ ...baseInput, rrule: "FREQ=DAILY;BYMONTH=5" })).toThrow(
        UnsupportedRecurrenceError,
      );
    });

    it("throws on multiple BYDAY in MONTHLY", () => {
      expect(() => expandRecurrence({ ...baseInput, rrule: "FREQ=MONTHLY;BYDAY=MO,TU" })).toThrow(
        UnsupportedRecurrenceError,
      );
    });

    it("throws on MONTHLY BYDAY without ordinal", () => {
      expect(() => expandRecurrence({ ...baseInput, rrule: "FREQ=MONTHLY;BYDAY=TU" })).toThrow(
        UnsupportedRecurrenceError,
      );
    });

    it("throws on MONTHLY BYDAY with invalid ordinal", () => {
      expect(() => expandRecurrence({ ...baseInput, rrule: "FREQ=MONTHLY;BYDAY=6TU" })).toThrow(
        UnsupportedRecurrenceError,
      );
    });

    it("throws on invalid BYMONTHDAY", () => {
      expect(() => expandRecurrence({ ...baseInput, rrule: "FREQ=MONTHLY;BYMONTHDAY=32" })).toThrow(
        UnsupportedRecurrenceError,
      );
      expect(() => expandRecurrence({ ...baseInput, rrule: "FREQ=MONTHLY;BYMONTHDAY=0" })).toThrow(
        UnsupportedRecurrenceError,
      );
      expect(() => expandRecurrence({ ...baseInput, rrule: "FREQ=MONTHLY;BYMONTHDAY=-2" })).toThrow(
        UnsupportedRecurrenceError,
      );
    });

    it("throws on both BYDAY and BYMONTHDAY in MONTHLY", () => {
      expect(() =>
        expandRecurrence({
          ...baseInput,
          rrule: "FREQ=MONTHLY;BYDAY=1MO;BYMONTHDAY=15",
        }),
      ).toThrow(UnsupportedRecurrenceError);
    });

    it("throws on BYDAY with DAILY or YEARLY", () => {
      expect(() => expandRecurrence({ ...baseInput, rrule: "FREQ=DAILY;BYDAY=MO" })).toThrow(
        UnsupportedRecurrenceError,
      );
      expect(() => expandRecurrence({ ...baseInput, rrule: "FREQ=YEARLY;BYDAY=MO" })).toThrow(
        UnsupportedRecurrenceError,
      );
    });

    it("throws on both COUNT and UNTIL", () => {
      expect(() =>
        expandRecurrence({
          ...baseInput,
          rrule: "FREQ=DAILY;COUNT=5;UNTIL=20261231",
        }),
      ).toThrow(UnsupportedRecurrenceError);
    });

    it("throws on invalid WKST", () => {
      expect(() =>
        expandRecurrence({
          ...baseInput,
          rrule: "FREQ=WEEKLY;WKST=FOO",
        }),
      ).toThrow(UnsupportedRecurrenceError);
    });
  });

  describe("bozuk girdi (Malformed input)", () => {
    const baseInput: ExpandRecurrenceInput = {
      rrule: "FREQ=DAILY",
      start: "2026-10-01T10:00",
      windowStart: "2026-10-01T00:00",
      windowEnd: "2026-11-01T00:00",
    };

    it("throws on empty rrule", () => {
      expect(() => expandRecurrence({ ...baseInput, rrule: "" })).toThrow(
        UnsupportedRecurrenceError,
      );
      expect(() => expandRecurrence({ ...baseInput, rrule: "   " })).toThrow(
        UnsupportedRecurrenceError,
      );
    });

    it("throws on missing FREQ", () => {
      expect(() => expandRecurrence({ ...baseInput, rrule: "INTERVAL=2" })).toThrow(
        UnsupportedRecurrenceError,
      );
    });

    it("throws on token missing '='", () => {
      expect(() => expandRecurrence({ ...baseInput, rrule: "FREQ=DAILY;INVALIDTOKEN" })).toThrow(
        UnsupportedRecurrenceError,
      );
    });

    it("throws on invalid INTERVAL", () => {
      expect(() => expandRecurrence({ ...baseInput, rrule: "FREQ=DAILY;INTERVAL=0" })).toThrow(
        UnsupportedRecurrenceError,
      );
      expect(() => expandRecurrence({ ...baseInput, rrule: "FREQ=DAILY;INTERVAL=-1" })).toThrow(
        UnsupportedRecurrenceError,
      );
      expect(() => expandRecurrence({ ...baseInput, rrule: "FREQ=DAILY;INTERVAL=abc" })).toThrow(
        UnsupportedRecurrenceError,
      );
    });

    it("throws on invalid COUNT", () => {
      expect(() => expandRecurrence({ ...baseInput, rrule: "FREQ=DAILY;COUNT=0" })).toThrow(
        UnsupportedRecurrenceError,
      );
      expect(() => expandRecurrence({ ...baseInput, rrule: "FREQ=DAILY;COUNT=-2" })).toThrow(
        UnsupportedRecurrenceError,
      );
      expect(() => expandRecurrence({ ...baseInput, rrule: "FREQ=DAILY;COUNT=xyz" })).toThrow(
        UnsupportedRecurrenceError,
      );
    });

    it("throws on invalid UNTIL format or invalid date", () => {
      expect(() => expandRecurrence({ ...baseInput, rrule: "FREQ=DAILY;UNTIL=invalid" })).toThrow(
        UnsupportedRecurrenceError,
      );
      expect(() =>
        expandRecurrence({
          ...baseInput,
          rrule: "FREQ=DAILY;UNTIL=20260230",
        }),
      ).toThrow(UnsupportedRecurrenceError);
    });

    it("throws on invalid start wall time", () => {
      expect(() => expandRecurrence({ ...baseInput, start: "invalid-date" })).toThrow(
        UnsupportedRecurrenceError,
      );
      expect(() => expandRecurrence({ ...baseInput, start: "2026-02-30T10:00" })).toThrow(
        UnsupportedRecurrenceError,
      );
    });

    it("throws on invalid window dates", () => {
      expect(() => expandRecurrence({ ...baseInput, windowStart: "invalid" })).toThrow(
        UnsupportedRecurrenceError,
      );
      expect(() => expandRecurrence({ ...baseInput, windowEnd: "2026-13-01T10:00" })).toThrow(
        UnsupportedRecurrenceError,
      );
      expect(() =>
        expandRecurrence({
          ...baseInput,
          windowStart: "2026-10-10T00:00",
          windowEnd: "2026-10-01T00:00",
        }),
      ).toThrow(UnsupportedRecurrenceError);
    });

    it("throws on invalid exdate", () => {
      expect(() => expandRecurrence({ ...baseInput, exdates: ["not-a-date"] })).toThrow(
        UnsupportedRecurrenceError,
      );
    });

    it("handles RRULE: prefix gracefully", () => {
      const result = expandRecurrence({
        ...baseInput,
        rrule: "RRULE:FREQ=DAILY;COUNT=2",
        start: "2026-10-01T10:00",
        windowStart: "2026-10-01T00:00",
        windowEnd: "2026-10-05T00:00",
      });
      expect(result).toEqual(["2026-10-01T10:00", "2026-10-02T10:00"]);
    });
  });
});
