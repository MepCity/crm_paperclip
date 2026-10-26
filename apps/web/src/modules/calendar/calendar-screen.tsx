"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { monthDays } from "@/components/calendar/calendar-date";
import { CalendarMonthGrid } from "@/components/calendar/calendar-month-grid";
import { CalendarTimeGrid } from "@/components/calendar/calendar-time-grid";
import { Button } from "@/components/ui/button";
import { Link } from "@/components/ui/link";
import { TextField } from "@/components/ui/text-field";
import { useUiTranslations } from "@/i18n/client-provider";
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
  const t = useUiTranslations();
  const orgFormat = useFormat();
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
  const calendarName = mine ? t("modules.calendar.myCalendar") : t("modules.calendar.allUsers");
  const viewName = (v: CalendarView) =>
    orgFormat.language === "tr" ? (v === "day" ? "gün" : v === "week" ? "hafta" : "ay") : v;
  const label = (value: string, options: Intl.DateTimeFormatOptions) =>
    new Date(`${value}T12:00:00`).toLocaleDateString(
      orgFormat.language ?? orgFormat.locale,
      options,
    );

  const weekdays = useMemo(() => {
    const loc = orgFormat.language ?? orgFormat.locale;
    const fmt = new Intl.DateTimeFormat(loc, { weekday: "short" });
    return [5, 6, 7, 8, 9, 10, 11].map((d) => fmt.format(new Date(1970, 0, d)));
  }, [orgFormat]);

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
      <aside aria-label={t("modules.calendar.calendars")} className="calendar-sidebar">
        <h2 className="px-4 py-3 text-lg font-semibold">{t("modules.calendar.calendar")}</h2>
        <div className="mx-3 mb-2">
          <TextField
            label={t("modules.calendar.searchCalendars")}
            hideLabel
            placeholder={t("modules.calendar.searchPlaceholder")}
            value={search}
            onChange={setSearch}
          />
        </div>
        {[
          { key: "mine", label: t("modules.calendar.myCalendar") },
          { key: "all", label: t("modules.calendar.allUsers") },
        ]
          .filter((item) => item.label.toLowerCase().includes(search.toLowerCase()))
          .map((item) => (
            <Button
              key={item.key}
              variant="ghost"
              className="mx-3 justify-start text-inherit"
              aria-pressed={calendarName === item.label}
              onPress={() => setMine(item.key === "mine")}
            >
              {item.label}
            </Button>
          ))}
        <div className="calendar-mini">
          <div className="flex items-center justify-between">
            <span>{label(miniDate, { month: "long", year: "numeric" })}</span>
            <Button
              variant="ghost"
              aria-label={t("modules.calendar.previousMonth")}
              onPress={() => setMiniDate(shiftDate(miniDate, "month", -1))}
            >
              ‹
            </Button>
            <Button
              variant="ghost"
              aria-label={t("modules.calendar.nextMonth")}
              onPress={() => setMiniDate(shiftDate(miniDate, "month", 1))}
            >
              ›
            </Button>
          </div>
          <div className="grid grid-cols-7 text-center text-xs">
            {weekdays.map((day) => (
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
                  aria-label={t("modules.calendar.selectDate", { date: day })}
                  aria-pressed={day === date}
                  onPress={() => selectDate(day)}
                >
                  {Number(day.slice(8))}
                </Button>
              ))}
          </div>
        </div>
      </aside>
      <section aria-label={t("modules.calendar.calendarSchedule")} className="min-w-0 flex-1">
        <div className="calendar-toolbar">
          <h2 className="text-lg font-semibold">{calendarName}</h2>
          <fieldset
            aria-label={t("modules.calendar.calendarView")}
            className="calendar-view-switch"
          >
            {(["day", "week", "month"] as const).map((value) => (
              <Button
                key={value}
                variant="ghost"
                aria-pressed={view === value}
                onPress={() => setView(value)}
              >
                {t(`modules.calendar.${value}`)}
              </Button>
            ))}
          </fieldset>
          <Link variant="primary" href={moduleCreatePath(orgSlug, "Meetings")}>
            {t("modules.calendar.create")}
          </Link>
        </div>
        <div className="calendar-date-strip">
          <TextField
            label={t("modules.calendar.calendarDate")}
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
              {t("modules.calendar.today")}
            </Button>
            <Button
              variant="secondary"
              aria-label={t("modules.calendar.previousView", { view: viewName(view) })}
              onPress={() => selectDate(shiftDate(date, view, -1))}
            >
              ←
            </Button>
            <Button
              variant="secondary"
              aria-label={t("modules.calendar.nextView", { view: viewName(view) })}
              onPress={() => selectDate(shiftDate(date, view, 1))}
            >
              →
            </Button>
          </div>
        </div>
        {events.isPending ? (
          <p role="status" className="p-4">
            {t("modules.calendar.loading")}
          </p>
        ) : events.isError ? (
          <div role="alert" className="p-4">
            {t("modules.calendar.error")}{" "}
            <Button
              variant="secondary"
              onPress={() => {
                void events.refetch();
              }}
            >
              {t("modules.calendar.retry")}
            </Button>
          </div>
        ) : (
          <>
            {events.data.length === 0 && (
              <p role="status" className="px-4 py-2 text-sm text-text-muted">
                {t("modules.calendar.noEvents")}
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
