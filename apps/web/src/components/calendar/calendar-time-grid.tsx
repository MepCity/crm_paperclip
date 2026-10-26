/** biome-ignore-all lint/a11y/noNoninteractiveElementToInteractiveRole: ARIA permits grid tables and grid cells containing focusable buttons. */
"use client";

import { Button } from "@/components/ui/button";
import { useUiTranslations } from "@/i18n/client-provider";
import { dateOrdinal, slotTime, wallMinute, weekDays } from "./calendar-date";
import { CalendarEventButton } from "./calendar-event-button";
import { type CalendarEvent, eventsOnDay, layoutTimedEvents } from "./layout-timed-events";

export interface CalendarTimeGridProps {
  date: string;
  slotMinutes?: 30 | 60;
  dayLabel?: (date: string) => string;
  timeLabel?: (minute: number) => string;
  view: "day" | "week";
  events: readonly CalendarEvent[];
  weekStartsOn?: number;
  /** Caller-controlled wall time. Updating it advances the optional line. */
  now?: string;
  onEventClick?: (event: CalendarEvent) => void;
  onSlotClick?: (dateTime: string) => void;
  onDayClick?: (day: string) => void;
}

export function CalendarTimeGrid({
  date,
  slotMinutes = 30,
  dayLabel,
  timeLabel,
  view,
  events,
  weekStartsOn = 0,
  now,
  onEventClick,
  onSlotClick,
  onDayClick,
}: CalendarTimeGridProps) {
  const t = useUiTranslations();
  dateOrdinal(date);
  const days = view === "day" ? [date] : weekDays(date, weekStartsOn);
  const layouts = days.map((day) => layoutTimedEvents(events, day));
  if (now) wallMinute(now);
  return (
    <table
      role="grid"
      tabIndex={-1}
      aria-label={t(
        view === "day" ? "modules.calendar.dayCalendar" : "modules.calendar.weekCalendar",
        { date },
      )}
      className="w-full table-fixed border-collapse bg-surface text-text"
    >
      <thead>
        <tr>
          <th scope="col" className="w-16 text-xs text-text-muted">
            {t("modules.calendar.time")}
          </th>
          {days.map((day) => (
            <th scope="col" key={day}>
              <Button
                variant="ghost"
                size="sm"
                onPress={() => onDayClick?.(day)}
                aria-label={t("modules.calendar.openDay", { day })}
              >
                {dayLabel?.(day) ?? day}
              </Button>
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        <tr>
          <th scope="row" className="text-xs text-text-muted">
            {t("modules.calendar.allDay")}
          </th>
          {days.map((day) => (
            <td
              role="gridcell"
              tabIndex={-1}
              key={day}
              aria-label={t("modules.calendar.allDayOn", { day })}
              className="border border-border align-top"
            >
              {eventsOnDay(events, day)
                .filter((event) => event.allDay)
                .map((event) => (
                  <CalendarEventButton key={event.id} event={event} onEventClick={onEventClick} />
                ))}
            </td>
          ))}
        </tr>
        {Array.from({ length: 1440 / slotMinutes }, (_, index) => {
          const minute = index * slotMinutes;
          return (
            <tr key={minute}>
              <th scope="row" className="text-xs font-normal text-text-muted">
                {timeLabel?.(minute) ?? slotTime(date, minute).slice(11)}
              </th>
              {days.map((day, dayIndex) => {
                const nowMinute = now?.startsWith(`${day}T`)
                  ? wallMinute(now) - dateOrdinal(day) * 1440
                  : -1;
                return (
                  <td
                    role="gridcell"
                    tabIndex={-1}
                    key={day}
                    aria-label={slotTime(day, minute)}
                    className={`relative ${slotMinutes === 60 ? "h-16" : "h-8"} border border-border p-0 align-top`}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={`Create event ${slotTime(day, minute)}`}
                      onPress={() => onSlotClick?.(slotTime(day, minute))}
                      className="absolute inset-0 h-full w-full rounded-none p-0"
                    />
                    {(layouts[dayIndex] ?? [])
                      .filter(
                        (item) =>
                          item.startMinute >= minute && item.startMinute < minute + slotMinutes,
                      )
                      .map((item) => (
                        <CalendarEventButton
                          key={item.event.id}
                          event={item.event}
                          onEventClick={onEventClick}
                          style={{
                            position: "absolute",
                            top: `${((item.startMinute - minute) / slotMinutes) * 100}%`,
                            height: `${((item.endMinute - item.startMinute) / slotMinutes) * 100}%`,
                            left: `${item.columnIndex * item.width * 100}%`,
                            width: `${item.width * 100}%`,
                            minHeight: 0,
                          }}
                        />
                      ))}
                    {nowMinute >= minute && nowMinute < minute + slotMinutes && (
                      <span
                        role="img"
                        aria-label={`Current time ${now}`}
                        className="pointer-events-none absolute inset-x-0 z-20 border-t border-danger"
                        style={{ top: `${((nowMinute - minute) / slotMinutes) * 100}%` }}
                      />
                    )}
                  </td>
                );
              })}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
