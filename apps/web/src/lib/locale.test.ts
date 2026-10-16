import { formatDate, formatDateTime, formatNumber } from "@crm/core/format";
import { describe, expect, it } from "vitest";
import { DEFAULT_FORMAT, DEFAULT_LOCALE, DEFAULT_TIME_ZONE } from "./locale";

describe("DEFAULT_LOCALE", () => {
  it("exports the standard application locale en-US", () => {
    expect(DEFAULT_LOCALE).toBe("en-US");
    const locale = new Intl.Locale(DEFAULT_LOCALE);
    expect(locale.language).toBe("en");
    expect(locale.region).toBe("US");
  });

  it("is recognized as a supported BCP 47 language tag by Intl", () => {
    const supported = Intl.DateTimeFormat.supportedLocalesOf([DEFAULT_LOCALE]);
    expect(supported).toContain(DEFAULT_LOCALE);
  });
});

describe("DEFAULT_TIME_ZONE", () => {
  it("exports the Europe/Istanbul default time zone", () => {
    expect(DEFAULT_TIME_ZONE).toBe("Europe/Istanbul");
    const dtf = new Intl.DateTimeFormat(DEFAULT_LOCALE, { timeZone: DEFAULT_TIME_ZONE });
    expect(dtf.resolvedOptions().timeZone).toBe(DEFAULT_TIME_ZONE);
  });

  it("formats instants consistently without throwing RangeError", () => {
    const date = new Date("2026-06-01T12:00:00Z");
    expect(() => {
      new Intl.DateTimeFormat(DEFAULT_LOCALE, { timeZone: DEFAULT_TIME_ZONE }).format(date);
    }).not.toThrow();
  });
});

describe("DEFAULT_FORMAT", () => {
  it("combines the default locale and time zone into standard format options", () => {
    expect(DEFAULT_FORMAT).toEqual({
      locale: DEFAULT_LOCALE,
      timeZone: DEFAULT_TIME_ZONE,
    });
    expect(DEFAULT_FORMAT.locale).toBe(DEFAULT_LOCALE);
    expect(DEFAULT_FORMAT.timeZone).toBe(DEFAULT_TIME_ZONE);
  });

  it("formats dates, times, and numbers according to the default format", () => {
    const dateStr = formatDate("2026-03-01", DEFAULT_FORMAT);
    expect(dateStr).toBeTruthy();
    expect(typeof dateStr).toBe("string");

    const dateTimeStr = formatDateTime("2026-03-01T14:30:00Z", DEFAULT_FORMAT);
    expect(dateTimeStr).toBeTruthy();
    expect(typeof dateTimeStr).toBe("string");

    const numStr = formatNumber(12345.67, DEFAULT_FORMAT);
    expect(numStr).toContain("12,345.67");
  });

  it("handles null and undefined fallbacks gracefully when passed to formatters", () => {
    expect(formatDate(null, DEFAULT_FORMAT)).toBe("");
    expect(formatDate(undefined, DEFAULT_FORMAT)).toBe("");
    expect(formatDateTime(null, DEFAULT_FORMAT)).toBe("");
    expect(formatDateTime(undefined, DEFAULT_FORMAT)).toBe("");
    expect(formatNumber(null, DEFAULT_FORMAT)).toBe("");
    expect(formatNumber(undefined, DEFAULT_FORMAT)).toBe("");
  });
});
