import { describe, expect, it } from "vitest";
import { formatDate, formatDateTime, formatRelativeTime, formatTime } from "./index";

// 22:30 in UTC is already the next day in Istanbul and still the same day in Los Angeles.
const INSTANT = "2026-03-01T22:30:00Z";

const SECOND = 1_000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

// A fixed "now", because `formatRelativeTime` takes it as an argument instead of reading a clock.
const NOW = new Date("2026-03-01T12:00:00Z");

describe("formatDate", () => {
  it("keeps a calendar day on that day in every time zone", () => {
    const cases = [
      ["en-US", "UTC", "Mar 1, 2026"],
      ["en-US", "Europe/Istanbul", "Mar 1, 2026"],
      ["en-US", "America/Los_Angeles", "Mar 1, 2026"],
      ["tr-TR", "UTC", "1 Mar 2026"],
      ["tr-TR", "Europe/Istanbul", "1 Mar 2026"],
      ["tr-TR", "America/Los_Angeles", "1 Mar 2026"],
    ] as const;

    for (const [locale, timeZone, expected] of cases) {
      expect(formatDate("2026-03-01", { locale, timeZone })).toBe(expected);
    }
  });

  it("moves an instant to the day it falls on in the given time zone", () => {
    const cases = [
      ["en-US", "UTC", "Mar 1, 2026"],
      ["en-US", "Europe/Istanbul", "Mar 2, 2026"],
      ["en-US", "America/Los_Angeles", "Mar 1, 2026"],
      ["tr-TR", "UTC", "1 Mar 2026"],
      ["tr-TR", "Europe/Istanbul", "2 Mar 2026"],
      ["tr-TR", "America/Los_Angeles", "1 Mar 2026"],
    ] as const;

    for (const [locale, timeZone, expected] of cases) {
      expect(formatDate(INSTANT, { locale, timeZone })).toBe(expected);
      expect(formatDate(new Date(INSTANT), { locale, timeZone })).toBe(expected);
    }
  });

  it("returns an empty string for a missing value", () => {
    for (const locale of ["en-US", "tr-TR"]) {
      expect(formatDate(null, { locale, timeZone: "UTC" })).toBe("");
      expect(formatDate(undefined, { locale, timeZone: "UTC" })).toBe("");
    }
  });

  it("rejects a value that is not a date", () => {
    const values = [
      "not a date",
      "",
      // Impossible calendar days: `Date.UTC` would roll them over into the next month.
      "2026-02-30",
      "2026-13-01",
      // A timestamp without a zone would be read in the environment's own time zone.
      "2026-03-01T22:30:00",
      new Date("nope"),
    ];

    for (const locale of ["en-US", "tr-TR"]) {
      for (const value of values) {
        expect(() => formatDate(value, { locale, timeZone: "UTC" })).toThrow(RangeError);
      }
    }
  });
});

describe("formatDateTime", () => {
  it("renders the instant in the given time zone", () => {
    const cases = [
      ["en-US", "UTC", "Mar 1, 2026, 10:30 PM"],
      ["en-US", "Europe/Istanbul", "Mar 2, 2026, 1:30 AM"],
      ["en-US", "America/Los_Angeles", "Mar 1, 2026, 2:30 PM"],
      ["tr-TR", "UTC", "1 Mar 2026 22:30"],
      ["tr-TR", "Europe/Istanbul", "2 Mar 2026 01:30"],
      ["tr-TR", "America/Los_Angeles", "1 Mar 2026 14:30"],
    ] as const;

    for (const [locale, timeZone, expected] of cases) {
      expect(formatDateTime(INSTANT, { locale, timeZone })).toBe(expected);
      expect(formatDateTime(new Date(INSTANT), { locale, timeZone })).toBe(expected);
    }
  });

  it("reads a date without a time as midnight UTC", () => {
    expect(formatDateTime("2026-03-01", { locale: "en-US", timeZone: "Europe/Istanbul" })).toBe(
      "Mar 1, 2026, 3:00 AM",
    );
    expect(formatDateTime("2026-03-01", { locale: "tr-TR", timeZone: "Europe/Istanbul" })).toBe(
      "1 Mar 2026 03:00",
    );
  });

  it("follows the daylight saving change in America/Los_Angeles", () => {
    // On 8 March 2026 the clocks jump from 01:59 to 03:00, so the offset goes from -8 to -7.
    const cases = [
      ["en-US", "2026-03-08T09:30:00Z", "Mar 8, 2026, 1:30 AM"],
      ["en-US", "2026-03-08T10:30:00Z", "Mar 8, 2026, 3:30 AM"],
      ["tr-TR", "2026-03-08T09:30:00Z", "8 Mar 2026 01:30"],
      ["tr-TR", "2026-03-08T10:30:00Z", "8 Mar 2026 03:30"],
    ] as const;

    for (const [locale, value, expected] of cases) {
      expect(formatDateTime(value, { locale, timeZone: "America/Los_Angeles" })).toBe(expected);
    }
  });

  it("returns an empty string for a missing value", () => {
    for (const locale of ["en-US", "tr-TR"]) {
      expect(formatDateTime(null, { locale, timeZone: "UTC" })).toBe("");
      expect(formatDateTime(undefined, { locale, timeZone: "UTC" })).toBe("");
    }
  });

  it("rejects a value that is not a date", () => {
    for (const locale of ["en-US", "tr-TR"]) {
      for (const value of ["not a date", "2026-03-01 22:30:00", "03/01/2026", new Date("nope")]) {
        expect(() => formatDateTime(value, { locale, timeZone: "UTC" })).toThrow(RangeError);
      }
    }
  });
});

describe("formatTime", () => {
  it("renders the time of day in the given time zone", () => {
    const cases = [
      ["en-US", "UTC", "10:30 PM"],
      ["en-US", "Europe/Istanbul", "1:30 AM"],
      ["en-US", "America/Los_Angeles", "2:30 PM"],
      ["tr-TR", "UTC", "22:30"],
      ["tr-TR", "Europe/Istanbul", "01:30"],
      ["tr-TR", "America/Los_Angeles", "14:30"],
    ] as const;

    for (const [locale, timeZone, expected] of cases) {
      expect(formatTime(INSTANT, { locale, timeZone })).toBe(expected);
      expect(formatTime(new Date(INSTANT), { locale, timeZone })).toBe(expected);
    }
  });

  it("returns an empty string for a missing value", () => {
    for (const locale of ["en-US", "tr-TR"]) {
      expect(formatTime(null, { locale, timeZone: "UTC" })).toBe("");
      expect(formatTime(undefined, { locale, timeZone: "UTC" })).toBe("");
    }
  });

  it("rejects a value that is not a date", () => {
    for (const locale of ["en-US", "tr-TR"]) {
      for (const value of ["not a date", "2026-03-01T22:30:00", new Date("nope")]) {
        expect(() => formatTime(value, { locale, timeZone: "UTC" })).toThrow(RangeError);
      }
    }
  });
});

describe("formatRelativeTime", () => {
  it("names the distance in the largest whole unit", () => {
    const cases = [
      [-30 * SECOND, "30 seconds ago", "30 saniye önce"],
      [30 * SECOND, "in 30 seconds", "30 saniye sonra"],
      [-MINUTE, "1 minute ago", "1 dakika önce"],
      [5 * MINUTE, "in 5 minutes", "5 dakika sonra"],
      [-(59 * MINUTE + 59 * SECOND), "59 minutes ago", "59 dakika önce"],
      [-HOUR, "1 hour ago", "1 saat önce"],
      [3 * HOUR, "in 3 hours", "3 saat sonra"],
      [-(23 * HOUR + 59 * MINUTE), "23 hours ago", "23 saat önce"],
      [-DAY, "yesterday", "dün"],
      [DAY, "tomorrow", "yarın"],
      [-2 * DAY, "2 days ago", "evvelsi gün"],
      [2 * DAY, "in 2 days", "öbür gün"],
      [-29 * DAY, "29 days ago", "29 gün önce"],
      [-31 * DAY, "last month", "geçen ay"],
      [31 * DAY, "next month", "gelecek ay"],
      [-155 * DAY, "5 months ago", "5 ay önce"],
      [-335 * DAY, "11 months ago", "11 ay önce"],
      [-366 * DAY, "last year", "geçen yıl"],
      [366 * DAY, "next year", "gelecek yıl"],
      [-731 * DAY, "2 years ago", "2 yıl önce"],
      [731 * DAY, "in 2 years", "2 yıl sonra"],
    ] as const;

    for (const [difference, enUs, trTr] of cases) {
      const value = new Date(NOW.getTime() + difference);
      expect(formatRelativeTime(value, NOW, { locale: "en-US", timeZone: "UTC" })).toBe(enUs);
      expect(formatRelativeTime(value, NOW, { locale: "tr-TR", timeZone: "UTC" })).toBe(trTr);
    }
  });

  it("calls a difference under a second now", () => {
    const cases = [
      ["en-US", "now"],
      ["tr-TR", "şimdi"],
    ] as const;

    for (const [locale, expected] of cases) {
      expect(formatRelativeTime(NOW, NOW, { locale, timeZone: "UTC" })).toBe(expected);
      expect(
        formatRelativeTime(new Date(NOW.getTime() - 500), NOW, { locale, timeZone: "UTC" }),
      ).toBe(expected);
    }
  });

  it("measures from the `now` argument and takes a timestamp string", () => {
    expect(
      formatRelativeTime("2026-03-01T11:00:00Z", NOW, { locale: "en-US", timeZone: "UTC" }),
    ).toBe("1 hour ago");
    expect(
      formatRelativeTime("2026-03-01T13:00:00Z", NOW, { locale: "tr-TR", timeZone: "UTC" }),
    ).toBe("1 saat sonra");
  });

  it("gives the same answer in every time zone", () => {
    const value = new Date(NOW.getTime() - 3 * DAY);

    for (const timeZone of ["UTC", "Europe/Istanbul", "America/Los_Angeles"]) {
      expect(formatRelativeTime(value, NOW, { locale: "en-US", timeZone })).toBe("3 days ago");
      expect(formatRelativeTime(value, NOW, { locale: "tr-TR", timeZone })).toBe("3 gün önce");
    }
  });

  it("rejects a value or a `now` that is not a date", () => {
    const options = { locale: "en-US", timeZone: "UTC" };
    expect(() => formatRelativeTime("not a date", NOW, options)).toThrow(RangeError);
    expect(() => formatRelativeTime(NOW, new Date("nope"), options)).toThrow(RangeError);
    expect(() => formatRelativeTime("2026-03-01T11:00:00", NOW, options)).toThrow(RangeError);
  });
});
