import { describe, expect, it } from "vitest";
import {
  DOTTED_DAY_FIRST_FORMAT,
  FormatSettingError,
  formatCurrency,
  formatDate,
  formatDateTime,
  formatNumber,
  formatNumericDate,
  formatOptionsFromOrganization,
  formatPercent,
  formatTime,
} from "./index";

const base = { locale: "en-US", timeZone: "UTC" };
const org = (over: Record<string, unknown> = {}) =>
  formatOptionsFromOrganization({ ...DOTTED_DAY_FIRST_FORMAT, ...over });

describe("defaults stay unchanged without explicit settings", () => {
  it("renders the plain Intl output", () => {
    expect(formatCurrency(150000, "TRY", base)).toBe("TRY 150,000.00");
    expect(formatDate("2026-09-01", base)).toBe("Sep 1, 2026");
    expect(formatNumber(1234.5, base)).toBe("1,234.5");
  });
});

describe("DOTTED_DAY_FIRST_FORMAT", () => {
  const options = org();
  it("matches the reference money and date shapes", () => {
    expect(formatCurrency(250000, "TRY", options)).toBe("TL 250.000,00");
    expect(formatDate("2026-06-30", options)).toBe("30.06.2026");
    expect(formatNumericDate("2026-06-30", options)).toBe("30.06.2026");
  });
  it("handles negative, zero, large and rounded amounts", () => {
    expect(formatCurrency(-1234.5, "TRY", options)).toBe("-TL 1.234,50");
    expect(formatCurrency(0, "TRY", options)).toBe("TL 0,00");
    expect(formatCurrency(1234567890.126, "TRY", options)).toBe("TL 1.234.567.890,13");
    expect(formatNumber(1234.5, options)).toBe("1.234,5");
    expect(formatPercent(0.125, options)).toBe("12,5%");
  });
  it("leaves other currencies on their Intl symbol", () => {
    expect(formatCurrency(5, "USD", options)).toBe("$5,00");
  });
});

describe("date patterns", () => {
  const when = "2026-06-30T15:05:00Z";
  it.each([
    ["dd.MM.yyyy", "30.06.2026"],
    ["MM/dd/yyyy", "06/30/2026"],
    ["yyyy-MM-dd", "2026-06-30"],
  ])("renders %s", (pattern, expected) => {
    const options = org({ datePattern: pattern });
    expect(formatDate("2026-06-30", options)).toBe(expected);
    expect(formatDate(new Date(when), options)).toBe(expected);
    expect(formatDateTime(when, options)).toBe(`${expected} 3:05 PM`);
  });
  it("supports the 24-hour clock", () => {
    const options = org({ clock: 24 });
    expect(formatDateTime(when, options)).toBe("30.06.2026 15:05");
    expect(formatTime(when, options)).toBe("15:05");
    expect(formatTime("2026-06-30T00:05:00Z", options)).toBe("00:05");
  });
  it("applies the time zone to the day", () => {
    const options = org({ timeZone: "Europe/Istanbul" });
    expect(formatDate("2026-06-30T22:30:00Z", options)).toBe("01.07.2026");
  });
});

describe("separators", () => {
  it.each([
    [",", ".", "1,234,567.89"],
    [".", ",", "1.234.567,89"],
    [".", ",", "1.234.567,89"],
  ])("group %j decimal %j", (a, b, expected) => {
    // Pairs are written group-first in the table: (group, decimal).
    const options = org({ groupSeparator: a, decimalSeparator: b, currencySymbols: undefined });
    expect(formatNumber(1234567.89, options)).toBe(expected);
  });
});

describe("invalid settings throw typed errors", () => {
  it.each(["dd.MM", "dd.dd.yyyy", "dd-MM-yyyy hh", "abc", "ddMMyyyy x1"])(
    "rejects pattern %s",
    (datePattern) => {
      expect(() => org({ datePattern })).toThrow(FormatSettingError);
    },
  );
  it("rejects equal or empty separators", () => {
    expect(() => org({ decimalSeparator: ",", groupSeparator: "," })).toThrow(FormatSettingError);
    expect(() => org({ decimalSeparator: "" })).toThrow(FormatSettingError);
  });
  it("rejects a bad pattern passed straight to a formatter", () => {
    expect(() => formatDate("2026-06-30", { ...base, datePattern: "yyyy" })).toThrow(
      FormatSettingError,
    );
  });
});
