/**
 * Organization-level format settings (separators, date pattern, clock) and the helpers that
 * apply them. Everything is opt-in: with none of these fields set, `index.ts` renders exactly
 * what `Intl` produces for the locale.
 */
import type { FormatOptions } from "./index";

/** Thrown for a date pattern or a separator the formatter cannot honour. */
export class FormatSettingError extends RangeError {
  constructor(message: string) {
    super(message);
    this.name = "FormatSettingError";
  }
}

/** A date pattern such as `dd.MM.yyyy`, `MM/dd/yyyy` or `yyyy-MM-dd`. */
export type DatePattern = string;

export type OrganizationFormat = {
  locale: string;
  timeZone: string;
  decimalSeparator: string;
  groupSeparator: string;
  datePattern: DatePattern;
  /** 12-hour (`h:mm AM`) or 24-hour (`HH:mm`) clock. */
  clock: 12 | 24;
  /** Display text that replaces the `Intl` currency symbol, keyed by ISO 4217 code. */
  currencySymbols?: Readonly<Record<string, string>>;
};

const PATTERN_TOKENS = ["dd", "MM", "yyyy"] as const;
const PATTERN_FILLER = /^[./\- ]+$/;

/** Splits a pattern into tokens and literal separators, or throws a `FormatSettingError`. */
export function parseDatePattern(pattern: DatePattern): readonly string[] {
  const pieces = pattern.split(/(dd|MM|yyyy)/).filter((piece) => piece !== "");
  const seen = pieces.filter((piece) => (PATTERN_TOKENS as readonly string[]).includes(piece));
  const filler = pieces.filter((piece) => !(PATTERN_TOKENS as readonly string[]).includes(piece));
  const valid =
    seen.length === 3 &&
    new Set(seen).size === 3 &&
    filler.every((piece) => PATTERN_FILLER.test(piece));
  if (!valid) throw new FormatSettingError(`Invalid date pattern: ${pattern}`);
  return pieces;
}

export function validateSeparators(decimal: string, group: string): void {
  if (decimal.length === 0 || decimal === group) {
    throw new FormatSettingError(`Invalid separators: decimal "${decimal}", group "${group}"`);
  }
}

/** Renders a pattern from zero-padded date parts. */
export function renderDatePattern(
  pattern: DatePattern,
  parts: { day: string; month: string; year: string },
): string {
  return parseDatePattern(pattern)
    .map((piece) =>
      piece === "dd"
        ? parts.day
        : piece === "MM"
          ? parts.month
          : piece === "yyyy"
            ? parts.year
            : piece,
    )
    .join("");
}

/** Maps organization settings onto the options every formatter takes. */
export function formatOptionsFromOrganization(settings: OrganizationFormat): FormatOptions {
  parseDatePattern(settings.datePattern);
  validateSeparators(settings.decimalSeparator, settings.groupSeparator);
  return {
    locale: settings.locale,
    timeZone: settings.timeZone,
    decimalSeparator: settings.decimalSeparator,
    groupSeparator: settings.groupSeparator,
    datePattern: settings.datePattern,
    clock: settings.clock,
    ...(settings.currencySymbols ? { currencySymbols: settings.currencySymbols } : {}),
  };
}

/** Observed in the reference CRM: `30.06.2026`, `TL 250.000,00`, 12-hour clock. */
export const DOTTED_DAY_FIRST_FORMAT: OrganizationFormat = {
  locale: "en-US",
  timeZone: "UTC",
  decimalSeparator: ",",
  groupSeparator: ".",
  datePattern: "dd.MM.yyyy",
  clock: 12,
  currencySymbols: { TRY: "TL" },
};
