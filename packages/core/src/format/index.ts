/**
 * Locale-aware formatting for dates, times, numbers and money, on top of `Intl` alone.
 *
 * Screens never format these values themselves (ADR 0003, "Language and formatting"): they call
 * these functions with the locale and time zone they were given. Nothing here reads the system
 * clock or the environment's time zone, so the same input gives the same output wherever it runs.
 *
 * Client-safe: this module imports nothing from outside its own directory.
 */

/** The locale and the time zone a value is rendered in. */
export type FormatOptions = {
  locale: string;
  timeZone: string;
  /** Overrides the locale's decimal separator. Set together with `groupSeparator`. */
  decimalSeparator?: string;
  groupSeparator?: string;
  /** Overrides the locale's date layout, e.g. `dd.MM.yyyy`. */
  datePattern?: string;
  /** Overrides the locale's clock. */
  clock?: 12 | 24;
  /** Replaces the `Intl` currency symbol, keyed by ISO 4217 code. */
  currencySymbols?: Readonly<Record<string, string>>;
  /** Interface language for relative time and UI-dependent date text. */
  language?: string;
};

export {
  type DatePattern,
  DOTTED_DAY_FIRST_FORMAT,
  FormatSettingError,
  formatOptionsFromOrganization,
  type OrganizationFormat,
} from "./organization";

/** A calendar day, `"YYYY-MM-DD"`: no time of day and no time zone. */
export type CalendarDate = string;

/** A bare `"YYYY-MM-DD"` day. */
const CALENDAR_DAY = /^\d{4}-\d{2}-\d{2}$/;

/**
 * The ISO 8601 forms that mean the same instant everywhere. A date and time without a zone is
 * read in the environment's own time zone, so those strings are rejected.
 */
const TIMESTAMP = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2}))?$/;

const SECOND = 1_000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
// Neither a year nor a month has a fixed length; the averages only serve to pick a unit.
const YEAR = 365.25 * DAY;
const MONTH = YEAR / 12;

/** The units a relative time is expressed in, largest first. */
const RELATIVE_UNITS: readonly (readonly [
  unit: Intl.RelativeTimeFormatUnit,
  milliseconds: number,
])[] = [
  ["year", YEAR],
  ["month", MONTH],
  ["day", DAY],
  ["hour", HOUR],
  ["minute", MINUTE],
  ["second", SECOND],
];

import { renderDatePattern, validateSeparators } from "./organization";

/** Zero-padded day, month and year of `value` in `timeZone`. */
function patternParts(value: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).formatToParts(value);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((candidate) => candidate.type === type)?.value ?? "";
  return { day: get("day"), month: get("month"), year: get("year") };
}

/** The time of day as `h:mm AM` or `HH:mm`. */
function clockTime(value: Date, timeZone: string, clock: 12 | 24, language?: string): string {
  const parts = new Intl.DateTimeFormat(language === "tr" ? "tr-TR" : "en-GB", {
    timeZone,
    hour: clock === 12 ? "numeric" : "2-digit",
    minute: "2-digit",
    hourCycle: clock === 12 ? "h12" : "h23",
  }).formatToParts(value);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((candidate) => candidate.type === type)?.value ?? "";
  const time = `${get("hour")}:${get("minute")}`;
  return clock === 12 ? `${time} ${get("dayPeriod").toUpperCase()}` : time;
}

/**
 * Formats a calendar day, or the day an instant falls on in `options.timeZone`.
 * A `"YYYY-MM-DD"` string is a calendar day and stays on that day in every time zone.
 */
export function formatDate(
  value: CalendarDate | Date | null | undefined,
  options: FormatOptions,
): string {
  if (value === null || value === undefined) return "";

  const day = typeof value === "string" ? calendarDay(value) : undefined;
  if (day !== undefined) {
    // A calendar day has no time of day, so it is rendered in UTC and cannot shift a day.
    if (options.datePattern !== undefined) {
      return renderDatePattern(options.datePattern, patternParts(new Date(day), "UTC"));
    }
    return render(options.locale, "UTC", { dateStyle: "medium" }, day);
  }
  if (options.datePattern !== undefined) {
    return renderDatePattern(options.datePattern, patternParts(instant(value), options.timeZone));
  }
  return render(options.locale, options.timeZone, { dateStyle: "medium" }, instant(value));
}

/**
 * Formats an instant for Created By / Modified By detail rows: weekday, day, month,
 * year and 12-hour clock in `options.timeZone`.
 */
export function formatRecordAuditDateTime(
  value: Date | string | null | undefined,
  options: FormatOptions,
): string {
  if (value === null || value === undefined) return "";
  const formatter = new Intl.DateTimeFormat(options.locale, {
    timeZone: options.timeZone,
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  const parts = formatter.formatToParts(instant(value));
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((candidate) => candidate.type === type)?.value ?? "";
  return `${part("weekday")}, ${part("day")} ${part("month")} ${part("year")} ${part("hour")}:${part("minute")} ${part("dayPeriod")}`;
}

/** Formats an instant as a date and a time of day in `options.timeZone`. */
export function formatDateTime(
  value: Date | string | null | undefined,
  options: FormatOptions,
): string {
  if (value === null || value === undefined) return "";
  if (options.datePattern !== undefined || options.clock !== undefined) {
    const date = instant(value);
    const day =
      options.datePattern === undefined
        ? render(options.locale, options.timeZone, { dateStyle: "medium" }, date)
        : renderDatePattern(options.datePattern, patternParts(date, options.timeZone));
    return `${day} ${clockTime(date, options.timeZone, options.clock ?? 12, options.language)}`;
  }
  return render(
    options.locale,
    options.timeZone,
    { dateStyle: "medium", timeStyle: "short" },
    instant(value),
  );
}

function numericParts(options: FormatOptions, withTime: boolean, value: Date) {
  const formatter = new Intl.DateTimeFormat(options.language === "tr" ? "tr-TR" : "en-GB", {
    timeZone: options.timeZone,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    ...(withTime ? { hour: "numeric", minute: "2-digit", hour12: true } : {}),
  });
  const parts = formatter.formatToParts(value);
  return (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((candidate) => candidate.type === type)?.value ?? "";
}

/**
 * Zero-padded `dd.mm.yyyy` (Activities list cells). A `"YYYY-MM-DD"` calendar day stays on that
 * day in every time zone.
 */
export function formatNumericDate(
  value: CalendarDate | Date | null | undefined,
  options: FormatOptions,
): string {
  if (value === null || value === undefined) return "";
  const day = typeof value === "string" ? calendarDay(value) : undefined;
  if (options.datePattern !== undefined) {
    return day === undefined
      ? renderDatePattern(options.datePattern, patternParts(instant(value), options.timeZone))
      : renderDatePattern(options.datePattern, patternParts(new Date(day), "UTC"));
  }
  const part = numericParts(
    day === undefined ? options : { ...options, timeZone: "UTC" },
    false,
    day === undefined ? instant(value) : new Date(day),
  );
  return `${part("day")}.${part("month")}.${part("year")}`;
}

/** `dd.mm.yyyy h:mm AM` in `options.timeZone` (Activities list cells). */
export function formatNumericDateTime(
  value: Date | string | null | undefined,
  options: FormatOptions,
): string {
  if (value === null || value === undefined) return "";
  if (options.datePattern !== undefined || options.clock !== undefined) {
    const date = instant(value);
    const day = renderDatePattern(
      options.datePattern ?? "dd.MM.yyyy",
      patternParts(date, options.timeZone),
    );
    return `${day} ${clockTime(date, options.timeZone, options.clock ?? 12, options.language)}`;
  }
  const part = numericParts(options, true, instant(value));
  return `${part("day")}.${part("month")}.${part("year")} ${part("hour")}:${part("minute")} ${part("dayPeriod").toUpperCase()}`;
}

/** Formats the time of day of an instant in `options.timeZone`. */
export function formatTime(
  value: Date | string | null | undefined,
  options: FormatOptions,
): string {
  if (value === null || value === undefined) return "";
  if (options.clock !== undefined)
    return clockTime(instant(value), options.timeZone, options.clock, options.language);
  return render(options.locale, options.timeZone, { timeStyle: "short" }, instant(value));
}

/**
 * Formats the distance from `value` to `now` — "3 hours ago", "tomorrow" — in whole units, so
 * "3 hours ago" means at least three full hours have passed. `now` is a parameter: the clock is
 * never read here.
 *
 * `Intl.RelativeTimeFormat` measures absolute time, so `options.timeZone` has no effect on it.
 */
export function formatRelativeTime(
  value: Date | string,
  now: Date,
  options: FormatOptions,
): string {
  const difference = instant(value).getTime() - instant(now).getTime();
  const locale = options.language ?? options.locale;
  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

  for (const [unit, milliseconds] of RELATIVE_UNITS) {
    const amount = Math.trunc(difference / milliseconds);
    if (amount !== 0) return formatter.format(amount, unit);
  }
  return formatter.format(0, "second");
}

/** Formats a number for the locale, with the caller's fraction digits when given. */
export function formatNumber(
  value: number | null | undefined,
  options: FormatOptions & { minimumFractionDigits?: number; maximumFractionDigits?: number },
): string {
  if (value === null || value === undefined) return "";
  return withSeparators(
    new Intl.NumberFormat(options.locale, {
      minimumFractionDigits: options.minimumFractionDigits,
      maximumFractionDigits: options.maximumFractionDigits,
    }),
    finite(value),
    options,
  );
}

/**
 * Formats an amount of money. `currency` is an ISO 4217 code and decides the fraction digits:
 * JPY renders whole units, USD two decimals.
 */
export function formatCurrency(
  value: number | null | undefined,
  currency: string,
  options: FormatOptions,
): string {
  if (value === null || value === undefined) return "";
  return withSeparators(
    new Intl.NumberFormat(options.locale, { style: "currency", currency }),
    finite(value),
    options,
    currency,
  );
}

/** Formats a ratio as a percentage: `0.125` becomes `12.5%`. */
export function formatPercent(
  value: number | null | undefined,
  options: FormatOptions & { maximumFractionDigits?: number },
): string {
  if (value === null || value === undefined) return "";
  return withSeparators(
    new Intl.NumberFormat(options.locale, {
      style: "percent",
      // `Intl` rounds a percentage to a whole number; one decimal keeps 0.125 readable.
      maximumFractionDigits: options.maximumFractionDigits ?? 1,
    }),
    finite(value),
    options,
  );
}

/**
 * Formats with `formatter`, then swaps in the explicit separators and currency symbol of
 * `options`. With none of them set the result is `formatter.format(value)` unchanged.
 */
function withSeparators(
  formatter: Intl.NumberFormat,
  value: number,
  options: FormatOptions,
  currency?: string,
): string {
  const symbol = currency === undefined ? undefined : options.currencySymbols?.[currency];
  const { decimalSeparator, groupSeparator } = options;
  if (decimalSeparator === undefined && groupSeparator === undefined && symbol === undefined) {
    return formatter.format(value);
  }
  if (decimalSeparator !== undefined && groupSeparator !== undefined) {
    validateSeparators(decimalSeparator, groupSeparator);
  }
  return formatter
    .formatToParts(value)
    .map((part) => {
      if (part.type === "decimal" && decimalSeparator !== undefined) return decimalSeparator;
      if (part.type === "group" && groupSeparator !== undefined) return groupSeparator;
      if (part.type === "currency" && symbol !== undefined) return symbol;
      // A replaced symbol is text such as "TL", so its gap is a plain space.
      if (part.type === "literal" && symbol !== undefined)
        return part.value.replace(/\u00a0/g, " ");
      return part.value;
    })
    .join("");
}

function render(
  locale: string,
  timeZone: string,
  style: Intl.DateTimeFormatOptions,
  value: Date | number,
): string {
  return new Intl.DateTimeFormat(locale, { ...style, timeZone }).format(value);
}

/**
 * The instant a `Date` or an ISO 8601 timestamp stands for. Throws a `RangeError` for anything
 * that is not one, including a timestamp without a zone designator.
 */
function instant(value: Date | string): Date {
  const date = typeof value === "string" && TIMESTAMP.test(value) ? new Date(value) : value;
  if (typeof date === "string" || Number.isNaN(date.getTime())) {
    throw new RangeError(`Not a date: ${String(value)}`);
  }
  return date;
}

/**
 * A `"YYYY-MM-DD"` string as milliseconds since the epoch at UTC midnight, or `undefined` when
 * `value` is not a calendar day.
 */
function calendarDay(value: string): number | undefined {
  if (!CALENDAR_DAY.test(value)) return undefined;

  const timestamp = Date.UTC(
    Number(value.slice(0, 4)),
    Number(value.slice(5, 7)) - 1,
    Number(value.slice(8, 10)),
  );
  // `Date.UTC` rolls an impossible day over into the next month, so read the day back.
  if (new Date(timestamp).toISOString().slice(0, 10) !== value) {
    throw new RangeError(`Not a calendar day: ${value}`);
  }
  return timestamp;
}

function finite(value: number): number {
  if (!Number.isFinite(value)) throw new RangeError(`Not a finite number: ${value}`);
  return value;
}
