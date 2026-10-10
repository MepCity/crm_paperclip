const CALENDAR_DAY = /^\d{4}-\d{2}-\d{2}$/;
const PANEL_DAY = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/;

/** True when `iso` is a real calendar day in `YYYY-MM-DD` form. */
export function isCalendarDateString(iso: unknown): boolean {
  if (typeof iso !== "string") return false;
  const day = iso;
  if (!CALENDAR_DAY.test(day)) return false;
  const timestamp = Date.UTC(
    Number(day.slice(0, 4)),
    Number(day.slice(5, 7)) - 1,
    Number(day.slice(8, 10)),
  );
  return new Date(timestamp).toISOString().slice(0, 10) === day;
}

/** Parses panel `DD.MM.YYYY` text to `YYYY-MM-DD`, or null when invalid. */
export function parsePanelDateText(text: string): string | null {
  const trimmed = text.trim();
  const match = PANEL_DAY.exec(trimmed);
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  if (!Number.isInteger(day) || !Number.isInteger(month) || !Number.isInteger(year)) return null;
  const iso = `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  return isCalendarDateString(iso) ? iso : null;
}

export function compareCalendarDates(left: string, right: string): number {
  return left.localeCompare(right);
}
