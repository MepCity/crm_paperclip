import type { FormatOptions } from "@crm/core/format";

/**
 * The locale and time zone the web app formats with until organization and user settings exist
 * (ADR 0003, "Language and formatting"). Timestamps themselves are stored in UTC (ADR 0001).
 */
export const DEFAULT_LOCALE = "en-US";
export const DEFAULT_TIME_ZONE = "Europe/Istanbul";
export const DEFAULT_FORMAT: FormatOptions = {
  locale: DEFAULT_LOCALE,
  timeZone: DEFAULT_TIME_ZONE,
};

const INPUT_LOCALE_CANDIDATES = ["en-US", "tr-TR", "de-CH", "fr-FR", "de-DE"] as const;

function separatorsOf(locale: string): { decimal: string; group: string } {
  const parts = new Intl.NumberFormat(locale).formatToParts(1234567.5);
  const pick = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return { decimal: pick("decimal"), group: pick("group") };
}

/**
 * The locale a number input parses with so that typed text follows the organization's separators
 * (`1.234,56` → 1234.56). Falls back to the format's own locale when no known locale matches.
 */
export function numberInputLocale(format: FormatOptions): string {
  if (!format.decimalSeparator || !format.groupSeparator) return format.locale;
  const match = INPUT_LOCALE_CANDIDATES.find((candidate) => {
    const { decimal, group } = separatorsOf(candidate);
    return decimal === format.decimalSeparator && group === format.groupSeparator;
  });
  return match ?? format.locale;
}
