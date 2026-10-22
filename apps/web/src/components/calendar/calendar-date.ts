/** Calendar dates and local wall times only; offsets and time zones are rejected. */
export type CalendarDate = string;
export type WallDateTime = string;

const DAY_MS = 86_400_000;

export function dateOrdinal(day: CalendarDate): number {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) throw new RangeError("Expected YYYY-MM-DD");
  const year = Number(day.slice(0, 4));
  const month = Number(day.slice(5, 7));
  const date = Number(day.slice(8, 10));
  const value = new Date(0);
  value.setUTCFullYear(year, month - 1, date);
  value.setUTCHours(0, 0, 0, 0);
  if (value.toISOString().slice(0, 10) !== day) throw new RangeError("Invalid calendar date");
  return value.getTime() / DAY_MS;
}

export function addDays(day: CalendarDate, count: number): CalendarDate {
  if (!Number.isInteger(count)) throw new RangeError("Expected whole calendar days");
  return new Date((dateOrdinal(day) + count) * DAY_MS).toISOString().slice(0, 10);
}

/** Sunday = 0, Monday = 1, … Saturday = 6. */
export function weekDays(day: CalendarDate, weekStartsOn = 0): CalendarDate[] {
  if (!Number.isInteger(weekStartsOn) || weekStartsOn < 0 || weekStartsOn > 6) {
    throw new RangeError("Invalid week start");
  }
  const weekday = (((dateOrdinal(day) + 4) % 7) + 7) % 7;
  const start = addDays(day, -((weekday - weekStartsOn + 7) % 7));
  return Array.from({ length: 7 }, (_, index) => addDays(start, index));
}

export function monthDays(day: CalendarDate, weekStartsOn = 0): CalendarDate[][] {
  dateOrdinal(day);
  const start = weekDays(`${day.slice(0, 7)}-01`, weekStartsOn)[0] ?? day;
  return Array.from({ length: 6 }, (_, row) =>
    Array.from({ length: 7 }, (_, column) => addDays(start, row * 7 + column)),
  );
}

export function wallMinute(value: WallDateTime): number {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) {
    throw new RangeError("Expected YYYY-MM-DDTHH:mm without offset");
  }
  const hour = Number(value.slice(11, 13));
  const minute = Number(value.slice(14, 16));
  if (hour > 23 || minute > 59) throw new RangeError("Invalid wall time");
  return dateOrdinal(value.slice(0, 10)) * 1440 + hour * 60 + minute;
}

export function slotTime(day: CalendarDate, minute: number): WallDateTime {
  dateOrdinal(day);
  if (!Number.isInteger(minute) || minute < 0 || minute >= 1440)
    throw new RangeError("Invalid slot minute");
  return `${day}T${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`;
}
