import { parseDatePattern, renderDatePattern } from "@crm/core/format";

/**
 * The entry mask of a `date` field (derived from organization's `datePattern`) and the `YYYY-MM-DD`
 * value the record contract carries (`packages/core/src/records/contract.ts`).
 *
 * Shape mapping never validates the calendar. An impossible day keeps its shape on the way in,
 * so form validation reports it with the format message instead of dropping what the user typed.
 */

/** The mask every `date` control shows by default; observed in the Contacts create form and the filter panel. */
export const DATE_MASK_PLACEHOLDER = "DD.MM.YYYY";

/** Converts a date pattern such as `dd.MM.yyyy` or `MM/dd/yyyy` to an input mask placeholder like `DD.MM.YYYY` or `MM/DD/YYYY`. */
export function datePatternToPlaceholder(pattern: string = "dd.MM.yyyy"): string {
  return pattern.replace("dd", "DD").replace("MM", "MM").replace("yyyy", "YYYY");
}

const CALENDAR_SHAPE = /^(\d{4})-(\d{2})-(\d{2})$/;

function patternRegex(pattern: string): { regex: RegExp; order: ("day" | "month" | "year")[] } {
  try {
    const pieces = parseDatePattern(pattern);
    const order: ("day" | "month" | "year")[] = [];
    let patternStr = "^";
    for (const piece of pieces) {
      if (piece === "dd") {
        patternStr += "(\\d{2})";
        order.push("day");
      } else if (piece === "MM") {
        patternStr += "(\\d{2})";
        order.push("month");
      } else if (piece === "yyyy") {
        patternStr += "(\\d{4})";
        order.push("year");
      } else {
        patternStr += piece.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      }
    }
    patternStr += "$";
    return { regex: new RegExp(patternStr), order };
  } catch {
    return { regex: /^(\d{2})\.(\d{2})\.(\d{4})$/, order: ["day", "month", "year"] };
  }
}

/** A complete entry as `YYYY-MM-DD`, or null while the entry is not a full day. */
export function displayDateToCalendarShape(
  value: string,
  pattern: string = "dd.MM.yyyy",
): string | null {
  const trimmed = value.trim();
  const { regex, order } = patternRegex(pattern);
  const match = regex.exec(trimmed);
  if (!match) return null;
  let day = "";
  let month = "";
  let year = "";
  for (let i = 0; i < order.length; i++) {
    const val = match[i + 1] ?? "";
    const type = order[i];
    if (type === "day") day = val;
    else if (type === "month") month = val;
    else if (type === "year") year = val;
  }
  if (!day || !month || !year) return null;
  return `${year}-${month}-${day}`;
}

/**
 * What a `date` entry writes into the form model: `YYYY-MM-DD` for a full day, the entry itself
 * while it is not a full day, and null once nothing is left.
 *
 * An unfinished entry must not collapse into the same model value as a cleared field: the write
 * would drop a stored day on `Save` while the screen still shows half an entry. Keeping the typed
 * text makes the model say "half an entry", so validation reports it and the write stays blocked;
 * only the calendar shape is accepted by the record contract.
 */
export function displayDateToModelShape(
  value: string,
  pattern: string = "dd.MM.yyyy",
): string | null {
  if (value.trim() === "") return null;
  return displayDateToCalendarShape(value, pattern) ?? value;
}

/** `YYYY-MM-DD` formatted according to `pattern` (defaults to `dd.MM.yyyy`); anything else is shown as it came in. */
export function calendarShapeToDisplayDate(value: string, pattern: string = "dd.MM.yyyy"): string {
  const match = CALENDAR_SHAPE.exec(value);
  if (!match) return value;
  const [, year, month, day] = match;
  if (!year || !month || !day) return value;
  try {
    return renderDatePattern(pattern, { day, month, year });
  } catch {
    return `${day}.${month}.${year}`;
  }
}

/** True when `YYYY-MM-DD` is a real day: `2024-02-29` yes, `2026-02-30` no. */
export function isCalendarDate(value: string): boolean {
  const match = CALENDAR_SHAPE.exec(value);
  if (!match) return false;
  const [, rawYear, rawMonth, rawDay] = match;
  if (!rawYear || !rawMonth || !rawDay) return false;
  const year = Number(rawYear);
  const month = Number(rawMonth);
  const day = Number(rawDay);
  if (year < 1 || month < 1 || month > 12) return false;
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return day >= 1 && day <= lastDay;
}
