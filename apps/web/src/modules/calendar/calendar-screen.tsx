"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { monthDays } from "@/components/calendar/calendar-date";
import { CalendarMonthGrid } from "@/components/calendar/calendar-month-grid";
import { CalendarTimeGrid } from "@/components/calendar/calendar-time-grid";
import { Button } from "@/components/ui/button";
import { Link } from "@/components/ui/link";
import { TextField } from "@/components/ui/text-field";
import { useClientRecordService } from "@/lib/api/client/provider";
import { moduleCreatePath, moduleRecordPath } from "@/lib/crm-paths";
import { useFormat } from "@/lib/format-context";
import { isoToDateTimeParts } from "@/lib/records/datetime-parts";
import { type CalendarView, loadCalendarEvents, shiftDate, visibleRange } from "./calendar-model";
import "./calendar.css";

export function CalendarScreen({
  orgSlug,
  userId,
  initialDate,
}: {
  orgSlug: string;
  userId: string;
  initialDate?: string;
}) {
  const router = useRouter();
  const service = useClientRecordService();
  const today = () => isoToDateTimeParts(new Date().toISOString()).date;
  const [date, setDate] = useState(initialDate ?? today);
  const [view, setView] = useState<CalendarView>("day");
  const [mine, setMine] = useState(true);
  const [miniDate, setMiniDate] = useState(date);
  const [search, setSearch] = useState("");
  const range = visibleRange(date, view);
  const events = useQuery({
    queryKey: ["calendar", orgSlug, userId, mine, range.start, range.end],
    queryFn: () => loadCalendarEvents(service, range, mine ? userId : undefined),
  });
  const selectDate = (value: string) => {
    setDate(value);
    setMiniDate(value);
  };
  const openDay = (value: string) => {
    selectDate(value);
    setView("day");
  };
  const format = useFormat();
  const calendarName = mine ? "My Calendar" : "All Users";
  const label = (value: string, options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(format.locale, { ...options, timeZone: "UTC" }).format(
      new Date(`${value}T12:00:00Z`),
    );
  const gridProps = {
    date,
    events: events.data ?? [],
    weekStartsOn: 1,
    onEventClick: (event: { id: string }) =>
      router.push(moduleRecordPath(orgSlug, "Meetings", event.id)),
    onDayClick: openDay,
    onSlotClick: () => router.push(moduleCreatePath(orgSlug, "Meetings")),
  };
  return (
    <div className="calendar-screen">
      <aside aria-label="Calendars" className="calendar-sidebar">
        <h2 className="px-4 py-3 text-lg font-semibold">Calendar</h2>
        <div className="mx-3 mb-2">
          <TextField
            label="Search calendars"
            hideLabel
            placeholder="Search"
            value={search}
            onChange={setSearch}
          />
        </div>
        {["My Calendar", "All Users"]
          .filter((name) => name.toLowerCase().includes(search.toLowerCase()))
          .map((name) => (
            <Button
              key={name}
              variant="ghost"
              className="mx-3 justify-start text-inherit"
              aria-pressed={calendarName === name}
              onPress={() => setMine(name === "My Calendar")}
            >
              {name}
            </Button>
          ))}
        <div className="calendar-mini">
          <div className="flex items-center justify-between">
            <span>{label(miniDate, { month: "long", year: "numeric" })}</span>
            <Button
              variant="ghost"
              aria-label="Previous month"
              onPress={() => setMiniDate(shiftDate(miniDate, "month", -1))}
            >
              ‹
            </Button>
            <Button
              variant="ghost"
              aria-label="Next month"
              onPress={() => setMiniDate(shiftDate(miniDate, "month", 1))}
            >
              ›
            </Button>
          </div>
          <div className="grid grid-cols-7 text-center text-xs">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
              <span key={day}>{day}</span>
            ))}
            {monthDays(miniDate, 1)
              .flat()
              .map((day) => (
                <Button
                  key={day}
                  variant="ghost"
                  size="sm"
                  className="text-inherit"
                  aria-label={`Select date ${day}`}
                  aria-pressed={day === date}
                  onPress={() => selectDate(day)}
                >
                  {Number(day.slice(8))}
                </Button>
              ))}
          </div>
        </div>
      </aside>
      <section aria-label="Calendar schedule" className="min-w-0 flex-1">
        <div className="calendar-toolbar">
          <h2 className="text-lg font-semibold">{calendarName}</h2>
          <fieldset aria-label="Calendar view" className="calendar-view-switch">
            {(["day", "week", "month"] as const).map((value) => (
              <Button
                key={value}
                variant="ghost"
                aria-pressed={view === value}
                onPress={() => setView(value)}
              >
                {value[0]?.toUpperCase()}
                {value.slice(1)}
              </Button>
            ))}
          </fieldset>
          <Link variant="primary" href={moduleCreatePath(orgSlug, "Meetings")}>
            Create
          </Link>
        </div>
        <div className="calendar-date-strip">
          <TextField
            label="Calendar date"
            hideLabel
            type="date"
            value={date}
            onChange={(value) => {
              if (value) selectDate(value);
            }}
          />
          <span className="text-lg">
            {label(
              date,
              view === "month"
                ? { month: "long", year: "numeric" }
                : { day: "numeric", month: "short", year: "numeric", weekday: "long" },
            )}
          </span>
          <div className="ml-auto flex gap-2">
            <Button variant="secondary" onPress={() => selectDate(today())}>
              Today
            </Button>
            <Button
              variant="secondary"
              aria-label={`Previous ${view}`}
              onPress={() => selectDate(shiftDate(date, view, -1))}
            >
              ←
            </Button>
            <Button
              variant="secondary"
              aria-label={`Next ${view}`}
              onPress={() => selectDate(shiftDate(date, view, 1))}
            >
              →
            </Button>
          </div>
        </div>
        {events.isPending ? (
          <p role="status" className="p-4">
            Loading calendar…
          </p>
        ) : events.isError ? (
          <div role="alert" className="p-4">
            Unable to load calendar.{" "}
            <Button
              variant="secondary"
              onPress={() => {
                void events.refetch();
              }}
            >
              Retry
            </Button>
          </div>
        ) : (
          <>
            {events.data.length === 0 && (
              <p role="status" className="px-4 py-2 text-sm text-text-muted">
                No events in this date range.
              </p>
            )}
            <div className="calendar-grid">
              {view === "month" ? (
                <CalendarMonthGrid {...gridProps} />
              ) : (
                <CalendarTimeGrid {...gridProps} view={view} />
              )}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
