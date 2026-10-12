import { displayDateToCalendarShape, isCalendarDate } from "./calendar-date";

/** Parses a filter panel display date (`DD.MM.YYYY`) to strict `YYYY-MM-DD`, or null if invalid. */
export function displayDateToIso(input: string): string | null {
  const iso = displayDateToCalendarShape(input);
  if (!iso) return null;
  return isCalendarDate(iso) ? iso : null;
}

export function isValidDisplayDateRange(from: string, to: string): boolean {
  const fromIso = displayDateToIso(from);
  const toIso = displayDateToIso(to);
  if (!fromIso || !toIso) return false;
  return fromIso <= toIso;
}
