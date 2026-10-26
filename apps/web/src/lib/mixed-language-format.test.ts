import {
  formatCurrency,
  formatDate,
  formatNumber,
  formatOptionsFromOrganization,
  formatRelativeTime,
  type OrganizationFormat,
} from "@crm/core/format";
import { describe, expect, it } from "vitest";
import { translator } from "@/i18n/catalogs";
import { overdueLabel } from "@/modules/workqueue/workqueue";

describe("mixed language × organization format matrix", () => {
  const enOrgFormat: OrganizationFormat = {
    locale: "en-US",
    timeZone: "UTC",
    decimalSeparator: ".",
    groupSeparator: ",",
    datePattern: "MM/dd/yyyy",
    clock: 12,
    currencySymbols: { USD: "$", TRY: "₺" },
  };

  const trOrgFormat: OrganizationFormat = {
    locale: "tr-TR",
    timeZone: "UTC",
    decimalSeparator: ",",
    groupSeparator: ".",
    datePattern: "dd.MM.yyyy",
    clock: 24,
    currencySymbols: { TRY: "TL", USD: "$" },
  };

  const chOrgFormat: OrganizationFormat = {
    locale: "de-CH",
    timeZone: "UTC",
    decimalSeparator: ".",
    groupSeparator: "'",
    datePattern: "yyyy-MM-dd",
    clock: 24,
    currencySymbols: { CHF: "CHF", EUR: "€" },
  };

  const now = new Date("2026-10-25T12:00:00Z");
  const yesterday = new Date("2026-10-24T12:00:00Z");
  const fiveMinAgo = new Date("2026-10-25T11:55:00Z");
  const testNumber = 1234567.89;
  const testDate = "2026-10-25";

  describe("Turkish UI language ('tr') with various organization formats", () => {
    const t = translator("tr");

    it("respects en-US organization number/date format while UI relative text is Turkish", () => {
      const options = { ...formatOptionsFromOrganization(enOrgFormat), language: "tr" };

      // Number formatting uses org separators (comma grouping, period decimal)
      expect(formatNumber(testNumber, options)).toBe("1,234,567.89");

      // Date formatting uses org datePattern (MM/dd/yyyy)
      expect(formatDate(testDate, options)).toBe("10/25/2026");

      // Currency uses org currency symbols and separators
      expect(formatCurrency(testNumber, "USD", options)).toContain("1,234,567.89");

      // Relative time uses UI language (Turkish)
      expect(formatRelativeTime(yesterday, now, options)).toBe("dün");
      expect(formatRelativeTime(now, now, options)).toBe("şimdi");
      expect(formatRelativeTime(fiveMinAgo, now, options)).toBe("5 dakika önce");

      // Workqueue overdue label uses UI translation
      expect(overdueLabel("2026-10-24", now, t)).toBe("1 gün geç");
      expect(overdueLabel("2026-10-22", now, t)).toBe("3 gün geç");

      // UI relative term "Today" resolves to "Bugün"
      expect(t("modules.home.today")).toBe("Bugün");
      expect(t("modules.calendar.today")).toBe("Bugün");
    });

    it("respects tr-TR organization format and Turkish UI language", () => {
      const options = { ...formatOptionsFromOrganization(trOrgFormat), language: "tr" };

      // Number formatting uses Turkish org separators (period grouping, comma decimal)
      expect(formatNumber(testNumber, options)).toBe("1.234.567,89");

      // Date formatting uses Turkish org datePattern (dd.MM.yyyy)
      expect(formatDate(testDate, options)).toBe("25.10.2026");

      // Currency uses TL symbol
      expect(formatCurrency(testNumber, "TRY", options)).toContain("1.234.567,89");
      expect(formatCurrency(testNumber, "TRY", options)).toContain("TL");

      // Relative time in Turkish
      expect(formatRelativeTime(yesterday, now, options)).toBe("dün");
      expect(formatRelativeTime(fiveMinAgo, now, options)).toBe("5 dakika önce");
    });

    it("respects de-CH organization format with Turkish UI language", () => {
      const options = { ...formatOptionsFromOrganization(chOrgFormat), language: "tr" };

      // Number formatting uses Swiss apostrophe grouping and period decimal
      expect(formatNumber(testNumber, options)).toBe("1'234'567.89");

      // Date formatting uses yyyy-MM-dd
      expect(formatDate(testDate, options)).toBe("2026-10-25");

      // Relative time is still Turkish because UI language is "tr"
      expect(formatRelativeTime(yesterday, now, options)).toBe("dün");
      expect(formatRelativeTime(now, now, options)).toBe("şimdi");
    });
  });

  describe("English UI language ('en') with various organization formats", () => {
    const t = translator("en");

    it("respects tr-TR organization format while UI relative text is English", () => {
      const options = { ...formatOptionsFromOrganization(trOrgFormat), language: "en" };

      // Number formatting uses Turkish org separators (period grouping, comma decimal)
      expect(formatNumber(testNumber, options)).toBe("1.234.567,89");

      // Date formatting uses Turkish org datePattern (dd.MM.yyyy)
      expect(formatDate(testDate, options)).toBe("25.10.2026");

      // Currency uses TL symbol from org
      expect(formatCurrency(testNumber, "TRY", options)).toContain("1.234.567,89");

      // Relative time uses English UI language
      expect(formatRelativeTime(yesterday, now, options)).toBe("yesterday");
      expect(formatRelativeTime(now, now, options)).toBe("now");
      expect(formatRelativeTime(fiveMinAgo, now, options)).toBe("5 minutes ago");

      // Workqueue overdue label in English
      expect(overdueLabel("2026-10-24", now, t)).toBe("Late by 1 day");
      expect(overdueLabel("2026-10-22", now, t)).toBe("Late by 3 days");

      // UI relative term "Today" resolves to "Today"
      expect(t("modules.home.today")).toBe("Today");
      expect(t("modules.calendar.today")).toBe("Today");
    });
  });
});
