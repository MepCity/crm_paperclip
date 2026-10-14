/** Date-time form values travel as UTC ISO text; the form edits a local date and a local time. */
export interface DateTimeParts {
  date: string;
  time: string;
}

const pad = (value: number) => String(value).padStart(2, "0");

/** A day-only (All day) value is read in UTC so the stored day never shifts with the time zone. */
export function isoToDateTimeParts(
  iso: string | null | undefined,
  dateOnly = false,
): DateTimeParts {
  if (!iso) return { date: "", time: "" };
  const parsed = new Date(iso);
  if (!Number.isFinite(parsed.getTime())) return { date: "", time: "" };
  if (dateOnly) return { date: parsed.toISOString().slice(0, 10), time: "" };
  return {
    date: `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}`,
    time: `${pad(parsed.getHours())}:${pad(parsed.getMinutes())}`,
  };
}

/** Null while the entry is incomplete or not a real day / time. */
export function dateTimePartsToIso(parts: DateTimeParts, dateOnly = false): string | null {
  const day = /^(\d{4})-(\d{2})-(\d{2})$/.exec(parts.date);
  if (!day) return null;
  const [year, month, date] = [Number(day[1]), Number(day[2]), Number(day[3])];
  if (dateOnly) {
    const utc = new Date(Date.UTC(year, month - 1, date));
    return utc.getUTCMonth() === month - 1 && utc.getUTCDate() === date ? utc.toISOString() : null;
  }
  const clock = /^(\d{2}):(\d{2})$/.exec(parts.time);
  if (!clock) return null;
  const local = new Date(year, month - 1, date, Number(clock[1]), Number(clock[2]));
  return local.getMonth() === month - 1 && local.getDate() === date ? local.toISOString() : null;
}

/** The next whole hour after `now`. */
export function nextFullHour(now: Date = new Date()): Date {
  const next = new Date(now);
  next.setHours(next.getHours() + 1, 0, 0, 0);
  return next;
}

export function addHours(date: Date, hours: number): Date {
  return new Date(date.getTime() + hours * 3_600_000);
}

/**
 * Provisional rule when All day is cleared: From keeps its day at the next whole hour after
 * `now`, To is one hour later — the same calculation as a new Meeting Information window.
 */
export function allDayClearedTime(index: 0 | 1, now: Date = new Date()): string {
  const start = nextFullHour(now);
  const at = index === 0 ? start : addHours(start, 1);
  return `${pad(at.getHours())}:${pad(at.getMinutes())}`;
}
