import type { RecordData, RecordService } from "@crm/core/records";
import { addDays, dateOrdinal, monthDays, weekDays } from "@/components/calendar/calendar-date";
import type { CalendarEvent } from "@/components/calendar/layout-timed-events";
import { isoToDateTimeParts } from "@/lib/records/datetime-parts";

export type CalendarView = "day" | "week" | "month";

export function shiftDate(date: string, view: CalendarView, direction: number): string {
  if (view !== "month") return addDays(date, direction * (view === "week" ? 7 : 1));
  const next = new Date(`${date.slice(0, 7)}-01T12:00:00Z`);
  next.setUTCMonth(next.getUTCMonth() + direction);
  const last = new Date(next);
  last.setUTCMonth(last.getUTCMonth() + 1, 0);
  return `${next.toISOString().slice(0, 7)}-${String(Math.min(Number(date.slice(8)), last.getUTCDate())).padStart(2, "0")}`;
}

export function visibleRange(date: string, view: CalendarView) {
  const days =
    view === "month" ? monthDays(date, 1).flat() : view === "week" ? weekDays(date, 1) : [date];
  return { start: days[0] ?? date, end: addDays(days.at(-1) ?? date, 1) };
}

export function calendarEvent(record: RecordData): CalendarEvent | null {
  const { fields } = record;
  const allDay = fields.All_day === true;
  const start = isoToDateTimeParts(
    typeof fields.Start_DateTime === "string" ? fields.Start_DateTime : null,
    allDay,
  );
  const end = isoToDateTimeParts(
    typeof fields.End_DateTime === "string" ? fields.End_DateTime : null,
    allDay,
  );
  if (!start.date || !end.date) return null;
  const result = {
    id: record.id,
    title: typeof fields.Event_Title === "string" ? fields.Event_Title : "Meeting",
    start: `${start.date}T${allDay ? "00:00" : start.time}`,
    // Existing all-day forms store an inclusive final day; grids use exclusive end.
    end: `${allDay ? addDays(end.date, 1) : end.date}T${allDay ? "00:00" : end.time}`,
    allDay,
  };
  return result.end > result.start ? result : null;
}

/** Existing record port owns tenant access and pagination; no calendar persistence. */
export async function loadCalendarEvents(
  service: RecordService,
  range: { start: string; end: string },
  userId?: string,
) {
  dateOrdinal(range.start);
  dateOrdinal(range.end);
  const events: CalendarEvent[] = [];
  for (let page = 1; ; page++) {
    const result = await service.list("Events", {
      viewId: "all-meetings",
      page,
      perPage: 100,
      fields: ["Event_Title", "Start_DateTime", "End_DateTime", "All_day", "Owner"],
      ...(userId
        ? {
            filters: {
              field: "Owner",
              comparator: "equal",
              value: { token: "CURRENTUSER" },
            } as const,
          }
        : {}),
    });
    for (const record of result.records) {
      const event = calendarEvent(record);
      if (event && event.start < `${range.end}T00:00` && event.end > `${range.start}T00:00`)
        events.push(event);
    }
    if (!result.moreRecords) return events;
  }
}
