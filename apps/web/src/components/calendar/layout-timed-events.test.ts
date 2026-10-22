import { expect, test } from "vitest";
import { type CalendarEvent, layoutTimedEvents } from "./layout-timed-events";

const day = "2026-10-22";
const event = (id: string, start: string, end: string): CalendarEvent => ({
  id,
  title: id,
  start: `${day}T${start}`,
  end: `${day}T${end}`,
});

test("allocates connected overlaps at their maximum concurrent width and reuses columns", () => {
  const events = [
    event("a", "09:00", "12:00"),
    event("b", "09:30", "10:00"),
    event("c", "09:45", "11:00"),
    event("d", "10:00", "10:30"),
    event("e", "12:00", "13:00"),
  ];
  const result = layoutTimedEvents(events, day);
  expect(result.map((item) => item.columnIndex)).toEqual([0, 1, 2, 1, 0]);
  expect(result.map((item) => item.columnCount)).toEqual([3, 3, 3, 3, 1]);
  expect(result[0]?.width).toBeCloseTo(1 / 3);
  expect(result[0]?.group).toBe(result[3]?.group);
  expect(result[4]?.group).not.toBe(result[0]?.group);
});
test("clips both day boundaries and excludes all-day, outside, zero and negative durations", () => {
  const result = layoutTimedEvents(
    [
      { ...event("span", "00:00", "01:00"), start: "2026-10-21T23:30", end: "2026-10-23T02:00" },
      { ...event("all", "00:00", "23:00"), allDay: true },
      { ...event("outside", "00:00", "01:00"), start: "2026-10-21T23:00", end: `${day}T00:00` },
      event("zero", "09:00", "09:00"),
      event("negative", "10:00", "09:00"),
    ],
    day,
  );
  expect(result).toHaveLength(1);
  expect(result[0]).toMatchObject({ startMinute: 0, endMinute: 1440, columnCount: 1 });
});
test("is deterministic without mutating input and never shares a column during overlap", () => {
  const events = [
    event("c", "10:00", "12:00"),
    event("b", "09:00", "11:00"),
    event("a", "09:00", "11:00"),
  ];
  const original = JSON.stringify(events);
  const layout = layoutTimedEvents(events, day);
  expect(layout).toEqual(layoutTimedEvents([...events].reverse(), day));
  expect(JSON.stringify(events)).toBe(original);
  for (const a of layout)
    for (const b of layout) {
      if (a !== b && a.startMinute < b.endMinute && b.startMinute < a.endMinute)
        expect(a.columnIndex).not.toBe(b.columnIndex);
    }
  expect(layoutTimedEvents([], day)).toEqual([]);
});
test("treats adjacent events as separate full-width groups", () => {
  expect(
    layoutTimedEvents([event("a", "09:00", "10:00"), event("b", "10:00", "11:00")], day).map(
      (item) => item.columnCount,
    ),
  ).toEqual([1, 1]);
});
