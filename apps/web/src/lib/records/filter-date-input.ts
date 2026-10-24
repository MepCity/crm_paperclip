import { displayDateToCalendarShape, isCalendarDate } from "./calendar-date";

/** Parses a filter panel display date to strict `YYYY-MM-DD`, or null if invalid. */
export function displayDateToIso(input: string, pattern: string = "dd.MM.yyyy"): string | null {
  const iso =
    displayDateToCalendarShape(input, pattern) ??
    (pattern !== "dd.MM.yyyy" ? displayDateToCalendarShape(input, "dd.MM.yyyy") : null);
  if (!iso) return null;
  return isCalendarDate(iso) ? iso : null;
}

export function isValidDisplayDateRange(
  from: string,
  to: string,
  pattern: string = "dd.MM.yyyy",
): boolean {
  const fromIso = displayDateToIso(from, pattern);
  const toIso = displayDateToIso(to, pattern);
  if (!fromIso || !toIso) return false;
  return fromIso <= toIso;
}
