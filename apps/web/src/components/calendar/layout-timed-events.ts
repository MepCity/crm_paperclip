import { dateOrdinal, type WallDateTime, wallMinute } from "./calendar-date";

export interface CalendarEvent {
  id: string;
  title: string;
  start: WallDateTime;
  /** Exclusive end, including for all-day events. */
  end: WallDateTime;
  allDay?: boolean;
}

export interface TimedEventLayout {
  event: CalendarEvent;
  startMinute: number;
  endMinute: number;
  group: number;
  columnIndex: number;
  columnCount: number;
  /** Fraction of the day column occupied by this event. */
  width: number;
}

export function eventsOnDay(events: readonly CalendarEvent[], day: string): CalendarEvent[] {
  const start = dateOrdinal(day) * 1440;
  return events.filter(
    (event) =>
      wallMinute(event.start) < start + 1440 &&
      wallMinute(event.end) > start &&
      wallMinute(event.end) > wallMinute(event.start),
  );
}

/** Half-open intervals: adjacent events do not overlap. Input order is never mutated. */
export function layoutTimedEvents(
  events: readonly CalendarEvent[],
  day: string,
): TimedEventLayout[] {
  const dayStart = dateOrdinal(day) * 1440;
  const sorted = eventsOnDay(events, day)
    .filter((event) => !event.allDay)
    .map((event) => ({
      event,
      startMinute: Math.max(0, wallMinute(event.start) - dayStart),
      endMinute: Math.min(1440, wallMinute(event.end) - dayStart),
    }))
    .sort(
      (a, b) =>
        a.startMinute - b.startMinute ||
        b.endMinute - a.endMinute ||
        a.event.id.localeCompare(b.event.id),
    );
  const result: TimedEventLayout[] = [];
  let group: TimedEventLayout[] = [];
  let columnEnds: number[] = [];
  let groupEnd = -1;
  let groupIndex = 0;
  const finish = () => {
    for (const item of group) {
      item.columnCount = columnEnds.length;
      item.width = 1 / columnEnds.length;
    }
  };
  for (const item of sorted) {
    if (item.startMinute >= groupEnd) {
      finish();
      group = [];
      columnEnds = [];
      groupIndex++;
    }
    let columnIndex = columnEnds.findIndex((end) => end <= item.startMinute);
    if (columnIndex === -1) columnIndex = columnEnds.length;
    columnEnds[columnIndex] = item.endMinute;
    groupEnd = Math.max(groupEnd, item.endMinute);
    const placed = { ...item, group: groupIndex, columnIndex, columnCount: 1, width: 1 };
    group.push(placed);
    result.push(placed);
  }
  finish();
  return result;
}
