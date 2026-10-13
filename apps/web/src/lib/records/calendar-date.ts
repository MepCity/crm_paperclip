/**
 * The `DD.MM.YYYY` entry mask of a `date` field and the `YYYY-MM-DD` value the record contract
 * carries (`packages/core/src/records/contract.ts`).
 *
 * Shape mapping never validates the calendar. An impossible day keeps its shape on the way in,
 * so form validation reports it with the format message instead of dropping what the user typed.
 */

/** The mask every `date` control shows; observed in the Contacts create form and the filter panel. */
export const DATE_MASK_PLACEHOLDER = "DD.MM.YYYY";

const DISPLAY_DATE = /^(\d{2})\.(\d{2})\.(\d{4})$/;
const CALENDAR_SHAPE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** A complete `DD.MM.YYYY` entry as `YYYY-MM-DD`, or null while the entry is not a full day. */
export function displayDateToCalendarShape(value: string): string | null {
  const match = DISPLAY_DATE.exec(value.trim());
  if (!match) return null;
  const [, day, month, year] = match;
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
export function displayDateToModelShape(value: string): string | null {
  if (value.trim() === "") return null;
  return displayDateToCalendarShape(value) ?? value;
}

/** `YYYY-MM-DD` as `DD.MM.YYYY`; anything else is shown as it came in. */
export function calendarShapeToDisplayDate(value: string): string {
  const match = CALENDAR_SHAPE.exec(value);
  if (!match) return value;
  const [, year, month, day] = match;
  if (!year || !month || !day) return value;
  return `${day}.${month}.${year}`;
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
