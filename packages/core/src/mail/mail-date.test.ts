import { describe, expect, it } from "vitest";
import { parseMailDate } from "./mail-date";

describe("parseMailDate", () => {
  describe("standard RFC 5322 date-time", () => {
    it("parses full standard date-time with day of week and comma", () => {
      const result = parseMailDate("Mon, 23 Feb 2026 12:34:56 +0000");
      expect(result).toBe(Date.UTC(2026, 1, 23, 12, 34, 56));
    });

    it("parses date-time with day of week but without comma (obs format)", () => {
      const result = parseMailDate("Mon 23 Feb 2026 12:34:56 +0000");
      expect(result).toBe(Date.UTC(2026, 1, 23, 12, 34, 56));
    });

    it("parses date-time without day of week", () => {
      const result = parseMailDate("23 Feb 2026 12:34:56 +0000");
      expect(result).toBe(Date.UTC(2026, 1, 23, 12, 34, 56));
    });

    it("parses single-digit day of month", () => {
      const result = parseMailDate("5 Mar 2026 09:15:30 +0000");
      expect(result).toBe(Date.UTC(2026, 2, 5, 9, 15, 30));
    });

    it("parses two-digit day with leading zero", () => {
      const result = parseMailDate("05 Mar 2026 09:15:30 +0000");
      expect(result).toBe(Date.UTC(2026, 2, 5, 9, 15, 30));
    });

    it("parses date-time with seconds omitted", () => {
      const result = parseMailDate("23 Feb 2026 12:34 +0000");
      expect(result).toBe(Date.UTC(2026, 1, 23, 12, 34, 0));
    });

    it("parses date-time with case-insensitive month names", () => {
      expect(parseMailDate("23 feb 2026 12:34:56 +0000")).toBe(Date.UTC(2026, 1, 23, 12, 34, 56));
      expect(parseMailDate("23 FEB 2026 12:34:56 +0000")).toBe(Date.UTC(2026, 1, 23, 12, 34, 56));
      expect(parseMailDate("23 fEb 2026 12:34:56 +0000")).toBe(Date.UTC(2026, 1, 23, 12, 34, 56));
    });

    it("tolerates optional leading 'Date:' header name", () => {
      const result = parseMailDate("Date: Mon, 23 Feb 2026 12:34:56 +0000");
      expect(result).toBe(Date.UTC(2026, 1, 23, 12, 34, 56));
    });
  });

  describe("year formats", () => {
    it("parses 4-digit years", () => {
      expect(parseMailDate("23 Feb 2026 12:34:56 +0000")).toBe(Date.UTC(2026, 1, 23, 12, 34, 56));
      expect(parseMailDate("23 Feb 1999 12:34:56 +0000")).toBe(Date.UTC(1999, 1, 23, 12, 34, 56));
    });

    it("parses 2-digit years: 00-49 maps to 20xx", () => {
      expect(parseMailDate("23 Feb 26 12:34:56 +0000")).toBe(Date.UTC(2026, 1, 23, 12, 34, 56));
      expect(parseMailDate("23 Feb 00 12:34:56 +0000")).toBe(Date.UTC(2000, 1, 23, 12, 34, 56));
      expect(parseMailDate("23 Feb 49 12:34:56 +0000")).toBe(Date.UTC(2049, 1, 23, 12, 34, 56));
    });

    it("parses 2-digit years: 50-99 maps to 19xx", () => {
      expect(parseMailDate("23 Feb 50 12:34:56 +0000")).toBe(Date.UTC(1950, 1, 23, 12, 34, 56));
      expect(parseMailDate("23 Feb 99 12:34:56 +0000")).toBe(Date.UTC(1999, 1, 23, 12, 34, 56));
      expect(parseMailDate("23 Feb 70 12:34:56 +0000")).toBe(Date.UTC(1970, 1, 23, 12, 34, 56));
    });

    it("parses 3-digit years: adds 1900", () => {
      // 100 + 1900 = 2000
      expect(parseMailDate("23 Feb 100 12:34:56 +0000")).toBe(Date.UTC(2000, 1, 23, 12, 34, 56));
      // 126 + 1900 = 2026
      expect(parseMailDate("23 Feb 126 12:34:56 +0000")).toBe(Date.UTC(2026, 1, 23, 12, 34, 56));
      // 096 + 1900 = 1996
      expect(parseMailDate("23 Feb 096 12:34:56 +0000")).toBe(Date.UTC(1996, 1, 23, 12, 34, 56));
    });
  });

  describe("timezones and offsets", () => {
    it("handles positive numeric offsets", () => {
      // 12:34:56 +0200 = 10:34:56 UTC
      const result = parseMailDate("23 Feb 2026 12:34:56 +0200");
      expect(result).toBe(Date.UTC(2026, 1, 23, 10, 34, 56));
    });

    it("handles negative numeric offsets", () => {
      // 12:34:56 -0500 = 17:34:56 UTC
      const result = parseMailDate("23 Feb 2026 12:34:56 -0500");
      expect(result).toBe(Date.UTC(2026, 1, 23, 17, 34, 56));
    });

    it("handles numeric offsets with colons (+hh:mm / -hh:mm)", () => {
      expect(parseMailDate("23 Feb 2026 12:34:56 +02:00")).toBe(Date.UTC(2026, 1, 23, 10, 34, 56));
      expect(parseMailDate("23 Feb 2026 12:34:56 -05:00")).toBe(Date.UTC(2026, 1, 23, 17, 34, 56));
    });

    it("handles -0000 as UTC (+0000)", () => {
      expect(parseMailDate("23 Feb 2026 12:34:56 -0000")).toBe(Date.UTC(2026, 1, 23, 12, 34, 56));
    });

    it("handles obsolete named zones: UT, GMT, Z -> +0000", () => {
      const expected = Date.UTC(2026, 1, 23, 12, 34, 56);
      expect(parseMailDate("23 Feb 2026 12:34:56 UT")).toBe(expected);
      expect(parseMailDate("23 Feb 2026 12:34:56 GMT")).toBe(expected);
      expect(parseMailDate("23 Feb 2026 12:34:56 Z")).toBe(expected);
    });

    it("handles obsolete US timezones with distinct offsets", () => {
      // EST = -0500 (-300 mins) -> 07:34:56 EST is 12:34:56 UTC
      expect(parseMailDate("23 Feb 2026 07:34:56 EST")).toBe(Date.UTC(2026, 1, 23, 12, 34, 56));
      // EDT = -0400 (-240 mins) -> 08:34:56 EDT is 12:34:56 UTC
      expect(parseMailDate("23 Feb 2026 08:34:56 EDT")).toBe(Date.UTC(2026, 1, 23, 12, 34, 56));
      // CST = -0600 (-360 mins) -> 06:34:56 CST is 12:34:56 UTC
      expect(parseMailDate("23 Feb 2026 06:34:56 CST")).toBe(Date.UTC(2026, 1, 23, 12, 34, 56));
      // CDT = -0500 (-300 mins) -> 07:34:56 CDT is 12:34:56 UTC
      expect(parseMailDate("23 Feb 2026 07:34:56 CDT")).toBe(Date.UTC(2026, 1, 23, 12, 34, 56));
      // MST = -0700 (-420 mins) -> 05:34:56 MST is 12:34:56 UTC
      expect(parseMailDate("23 Feb 2026 05:34:56 MST")).toBe(Date.UTC(2026, 1, 23, 12, 34, 56));
      // MDT = -0600 (-360 mins) -> 06:34:56 MDT is 12:34:56 UTC
      expect(parseMailDate("23 Feb 2026 06:34:56 MDT")).toBe(Date.UTC(2026, 1, 23, 12, 34, 56));
      // PST = -0800 (-480 mins) -> 04:34:56 PST is 12:34:56 UTC
      expect(parseMailDate("23 Feb 2026 04:34:56 PST")).toBe(Date.UTC(2026, 1, 23, 12, 34, 56));
      // PDT = -0700 (-420 mins) -> 05:34:56 PDT is 12:34:56 UTC
      expect(parseMailDate("23 Feb 2026 05:34:56 PDT")).toBe(Date.UTC(2026, 1, 23, 12, 34, 56));
    });

    it("handles single-letter military timezones as +0000", () => {
      const expected = Date.UTC(2026, 1, 23, 12, 34, 56);
      expect(parseMailDate("23 Feb 2026 12:34:56 A")).toBe(expected);
      expect(parseMailDate("23 Feb 2026 12:34:56 M")).toBe(expected);
      expect(parseMailDate("23 Feb 2026 12:34:56 N")).toBe(expected);
      expect(parseMailDate("23 Feb 2026 12:34:56 Y")).toBe(expected);
    });

    it("handles unknown alphabetical zones as +0000", () => {
      const expected = Date.UTC(2026, 1, 23, 12, 34, 56);
      expect(parseMailDate("23 Feb 2026 12:34:56 CET")).toBe(expected);
      expect(parseMailDate("23 Feb 2026 12:34:56 UTC")).toBe(expected);
      expect(parseMailDate("23 Feb 2026 12:34:56 BST")).toBe(expected);
      expect(parseMailDate("23 Feb 2026 12:34:56 J")).toBe(expected);
    });
  });

  describe("leap second", () => {
    it("accepts second 60 and normalizes it to 59", () => {
      const leapResult = parseMailDate("23 Feb 2026 12:34:60 +0000");
      const expected = Date.UTC(2026, 1, 23, 12, 34, 59);
      expect(leapResult).toBe(expected);
    });
  });

  describe("comments and folding whitespace", () => {
    it("ignores trailing comment", () => {
      const result = parseMailDate("Mon, 23 Feb 2026 12:34:56 +0000 (UTC)");
      expect(result).toBe(Date.UTC(2026, 1, 23, 12, 34, 56));
    });

    it("ignores leading comment", () => {
      const result = parseMailDate("(Generated on) Mon, 23 Feb 2026 12:34:56 +0000");
      expect(result).toBe(Date.UTC(2026, 1, 23, 12, 34, 56));
    });

    it("ignores comments between tokens", () => {
      const result = parseMailDate("Mon, 23 (Day) Feb (Month) 2026 12:34:56 +0000");
      expect(result).toBe(Date.UTC(2026, 1, 23, 12, 34, 56));
    });

    it("ignores nested comments", () => {
      const result = parseMailDate(
        "Mon, 23 Feb 2026 12:34:56 +0000 (Outer (nested (deep)) comment)",
      );
      expect(result).toBe(Date.UTC(2026, 1, 23, 12, 34, 56));
    });

    it("handles comments with escaped parentheses", () => {
      const result = parseMailDate(
        "Mon, 23 Feb 2026 12:34:56 +0000 (Comment with \\( escaped \\) parens)",
      );
      expect(result).toBe(Date.UTC(2026, 1, 23, 12, 34, 56));
    });

    it("handles CRLF folded lines", () => {
      const result = parseMailDate("Mon, 23 Feb 2026\r\n 12:34:56 +0000");
      expect(result).toBe(Date.UTC(2026, 1, 23, 12, 34, 56));
    });

    it("handles multiple CRLF and tab folded lines", () => {
      const result = parseMailDate("Mon,\r\n\t23 Feb 2026\r\n\t12:34:56\r\n\t+0000");
      expect(result).toBe(Date.UTC(2026, 1, 23, 12, 34, 56));
    });

    it("handles obsolete whitespace around colons", () => {
      const result = parseMailDate("Mon, 23 Feb 2026 12 : 34 : 56 +0000");
      expect(result).toBe(Date.UTC(2026, 1, 23, 12, 34, 56));
    });
  });

  describe("calendar validation and leap years", () => {
    it("accepts Feb 29 on leap years", () => {
      expect(parseMailDate("29 Feb 2024 12:00:00 +0000")).toBe(Date.UTC(2024, 1, 29, 12, 0, 0));
      expect(parseMailDate("29 Feb 2000 12:00:00 +0000")).toBe(Date.UTC(2000, 1, 29, 12, 0, 0));
    });

    it("rejects Feb 29 on non-leap years", () => {
      expect(parseMailDate("29 Feb 2023 12:00:00 +0000")).toBeNull();
      expect(parseMailDate("29 Feb 1900 12:00:00 +0000")).toBeNull();
    });

    it("rejects day 31 on 30-day months", () => {
      expect(parseMailDate("31 Apr 2026 12:00:00 +0000")).toBeNull();
      expect(parseMailDate("31 Jun 2026 12:00:00 +0000")).toBeNull();
      expect(parseMailDate("31 Sep 2026 12:00:00 +0000")).toBeNull();
      expect(parseMailDate("31 Nov 2026 12:00:00 +0000")).toBeNull();
    });

    it("rejects Feb 30 and Feb 31", () => {
      expect(parseMailDate("30 Feb 2024 12:00:00 +0000")).toBeNull();
      expect(parseMailDate("31 Feb 2024 12:00:00 +0000")).toBeNull();
    });
  });

  describe("invalid values return null", () => {
    it("returns null for non-string or empty input", () => {
      expect(parseMailDate(null as unknown as string)).toBeNull();
      expect(parseMailDate(undefined as unknown as string)).toBeNull();
      expect(parseMailDate(12345 as unknown as string)).toBeNull();
      expect(parseMailDate("")).toBeNull();
      expect(parseMailDate("   ")).toBeNull();
    });

    it("returns null for arbitrary non-date strings", () => {
      expect(parseMailDate("invalid date string")).toBeNull();
      expect(parseMailDate("Hello World")).toBeNull();
      expect(parseMailDate("Foo, 23 Feb 2026 12:34:56 +0000")).toBeNull();
    });

    it("returns null for out-of-range months", () => {
      expect(parseMailDate("23 Foobar 2026 12:34:56 +0000")).toBeNull();
      expect(parseMailDate("23 13 2026 12:34:56 +0000")).toBeNull();
    });

    it("returns null for out-of-range days", () => {
      expect(parseMailDate("00 Feb 2026 12:34:56 +0000")).toBeNull();
      expect(parseMailDate("32 Jan 2026 12:34:56 +0000")).toBeNull();
    });

    it("returns null for out-of-range hours", () => {
      expect(parseMailDate("23 Feb 2026 24:00:00 +0000")).toBeNull();
      expect(parseMailDate("23 Feb 2026 25:00:00 +0000")).toBeNull();
    });

    it("returns null for out-of-range minutes", () => {
      expect(parseMailDate("23 Feb 2026 12:60:00 +0000")).toBeNull();
      expect(parseMailDate("23 Feb 2026 12:99:00 +0000")).toBeNull();
    });

    it("returns null for out-of-range seconds (> 60)", () => {
      expect(parseMailDate("23 Feb 2026 12:34:61 +0000")).toBeNull();
    });

    it("returns null for missing timezone", () => {
      expect(parseMailDate("23 Feb 2026 12:34:56")).toBeNull();
    });

    it("returns null for invalid timezone formats or out-of-range timezone hours/minutes", () => {
      // Missing sign
      expect(parseMailDate("23 Feb 2026 12:34:56 0000")).toBeNull();
      // Hour > 23
      expect(parseMailDate("23 Feb 2026 12:34:56 +2400")).toBeNull();
      // Minute >= 60
      expect(parseMailDate("23 Feb 2026 12:34:56 +0060")).toBeNull();
      // Invalid chars
      expect(parseMailDate("23 Feb 2026 12:34:56 +00ab")).toBeNull();
    });

    it("returns null for unclosed or unmatched comments", () => {
      expect(parseMailDate("23 Feb 2026 12:34:56 +0000 (unclosed comment")).toBeNull();
      expect(parseMailDate("23 Feb 2026 12:34:56 +0000 unmatched)")).toBeNull();
    });

    it("returns null for extra trailing tokens", () => {
      expect(parseMailDate("23 Feb 2026 12:34:56 +0000 trailing_extra")).toBeNull();
    });

    it("returns null for invalid year lengths", () => {
      expect(parseMailDate("23 Feb 6 12:34:56 +0000")).toBeNull();
      expect(parseMailDate("23 Feb 20260 12:34:56 +0000")).toBeNull();
    });
  });
});
