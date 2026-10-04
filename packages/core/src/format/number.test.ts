import { describe, expect, it } from "vitest";
import { formatCurrency, formatNumber, formatPercent } from "./index";

// The time zone is part of every option set but has no effect on a number.
const TIME_ZONE = "UTC";

// `Intl` separates an unknown currency code from the amount with a no-break space (U+00A0).
const NBSP = "\u00a0";

describe("formatNumber", () => {
  it("formats a number for the locale", () => {
    const cases = [
      [1234.5, {}, "1,234.5", "1.234,5"],
      [0, {}, "0", "0"],
      [-1234.5, {}, "-1,234.5", "-1.234,5"],
      [1234567, {}, "1,234,567", "1.234.567"],
      [1000000000, {}, "1,000,000,000", "1.000.000.000"],
      [1234.5678, {}, "1,234.568", "1.234,568"],
      [1234.5, { minimumFractionDigits: 2 }, "1,234.50", "1.234,50"],
      [0, { minimumFractionDigits: 2 }, "0.00", "0,00"],
      [1234.567, { maximumFractionDigits: 2 }, "1,234.57", "1.234,57"],
      [1234.5, { minimumFractionDigits: 0, maximumFractionDigits: 0 }, "1,235", "1.235"],
    ] as const;

    for (const [value, digits, enUs, trTr] of cases) {
      expect(formatNumber(value, { locale: "en-US", timeZone: TIME_ZONE, ...digits })).toBe(enUs);
      expect(formatNumber(value, { locale: "tr-TR", timeZone: TIME_ZONE, ...digits })).toBe(trTr);
    }
  });

  it("returns an empty string for a missing value", () => {
    for (const locale of ["en-US", "tr-TR"]) {
      expect(formatNumber(null, { locale, timeZone: TIME_ZONE })).toBe("");
      expect(formatNumber(undefined, { locale, timeZone: TIME_ZONE })).toBe("");
    }
  });

  it("rejects a number that is not finite", () => {
    for (const locale of ["en-US", "tr-TR"]) {
      for (const value of [Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
        expect(() => formatNumber(value, { locale, timeZone: TIME_ZONE })).toThrow(RangeError);
      }
    }
  });
});

describe("formatCurrency", () => {
  it("takes the fraction digits and the grouping from the currency and the locale", () => {
    const cases = [
      [1234.5, "USD", "$1,234.50", "$1.234,50"],
      [0, "USD", "$0.00", "$0,00"],
      [-1234.5, "USD", "-$1,234.50", "-$1.234,50"],
      [1234567.89, "USD", "$1,234,567.89", "$1.234.567,89"],
      [1234.5, "TRY", `TRY${NBSP}1,234.50`, "₺1.234,50"],
      [0, "TRY", `TRY${NBSP}0.00`, "₺0,00"],
      [-1234.5, "TRY", `-TRY${NBSP}1,234.50`, "-₺1.234,50"],
      [1234567.89, "TRY", `TRY${NBSP}1,234,567.89`, "₺1.234.567,89"],
      // The yen has no minor unit, so the amount is rounded to whole yen.
      [1234, "JPY", "¥1,234", "¥1.234"],
      [0, "JPY", "¥0", "¥0"],
      [-1234.5, "JPY", "-¥1,235", "-¥1.235"],
      [1234567.89, "JPY", "¥1,234,568", "¥1.234.568"],
    ] as const;

    for (const [value, currency, enUs, trTr] of cases) {
      expect(formatCurrency(value, currency, { locale: "en-US", timeZone: TIME_ZONE })).toBe(enUs);
      expect(formatCurrency(value, currency, { locale: "tr-TR", timeZone: TIME_ZONE })).toBe(trTr);
    }
  });

  it("returns an empty string for a missing value", () => {
    for (const locale of ["en-US", "tr-TR"]) {
      expect(formatCurrency(null, "USD", { locale, timeZone: TIME_ZONE })).toBe("");
      expect(formatCurrency(undefined, "USD", { locale, timeZone: TIME_ZONE })).toBe("");
    }
  });

  it("rejects a number that is not finite and a currency code that is not one", () => {
    for (const locale of ["en-US", "tr-TR"]) {
      expect(() => formatCurrency(Number.NaN, "USD", { locale, timeZone: TIME_ZONE })).toThrow(
        RangeError,
      );
      expect(() => formatCurrency(1234.5, "DOLLAR", { locale, timeZone: TIME_ZONE })).toThrow(
        RangeError,
      );
    }
  });
});

describe("formatPercent", () => {
  it("formats a ratio as a percentage", () => {
    const cases = [
      [0.125, {}, "12.5%", "%12,5"],
      [0.12345, {}, "12.3%", "%12,3"],
      [1, {}, "100%", "%100"],
      [0, {}, "0%", "%0"],
      [-0.05, {}, "-5%", "-%5"],
      [2.5, {}, "250%", "%250"],
      [0.125, { maximumFractionDigits: 0 }, "13%", "%13"],
      [0.12345, { maximumFractionDigits: 3 }, "12.345%", "%12,345"],
    ] as const;

    for (const [value, digits, enUs, trTr] of cases) {
      expect(formatPercent(value, { locale: "en-US", timeZone: TIME_ZONE, ...digits })).toBe(enUs);
      expect(formatPercent(value, { locale: "tr-TR", timeZone: TIME_ZONE, ...digits })).toBe(trTr);
    }
  });

  it("returns an empty string for a missing value", () => {
    for (const locale of ["en-US", "tr-TR"]) {
      expect(formatPercent(null, { locale, timeZone: TIME_ZONE })).toBe("");
      expect(formatPercent(undefined, { locale, timeZone: TIME_ZONE })).toBe("");
    }
  });

  it("rejects a number that is not finite", () => {
    for (const locale of ["en-US", "tr-TR"]) {
      for (const value of [Number.NaN, Number.POSITIVE_INFINITY]) {
        expect(() => formatPercent(value, { locale, timeZone: TIME_ZONE })).toThrow(RangeError);
      }
    }
  });
});
