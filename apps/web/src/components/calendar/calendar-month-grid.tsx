/** biome-ignore-all lint/a11y/noNoninteractiveElementToInteractiveRole: ARIA permits grid tables and grid cells containing focusable buttons. */
"use client";

import { Button } from "@/components/ui/button";
import { monthDays } from "./calendar-date";
import { CalendarEventButton } from "./calendar-event-button";
import { type CalendarEvent, eventsOnDay } from "./layout-timed-events";

export interface CalendarMonthGridProps {
  date: string;
  events: readonly CalendarEvent[];
  weekStartsOn?: number;
  maxVisibleEvents?: number;
  onEventClick?: (event: CalendarEvent) => void;
  onSlotClick?: (dateTime: string) => void;
  onDayClick?: (day: string) => void;
}

export function CalendarMonthGrid({
  date,
  events,
  weekStartsOn = 0,
  maxVisibleEvents = 3,
  onEventClick,
  onSlotClick,
  onDayClick,
}: CalendarMonthGridProps) {
  if (!Number.isInteger(maxVisibleEvents) || maxVisibleEvents < 0)
    throw new RangeError("Invalid event limit");
  const weeks = monthDays(date, weekStartsOn);
  return (
    <table
      role="grid"
      tabIndex={-1}
      aria-label={`Month calendar ${date.slice(0, 7)}`}
      className="w-full table-fixed border-collapse bg-surface text-text"
    >
      <thead>
        <tr>
          {(weeks[0] ?? []).map((day, index) => (
            <th scope="col" key={day}>
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][(weekStartsOn + index) % 7]}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {weeks.map((week) => (
          <tr key={week[0]}>
            {week.map((day) => {
              const items = eventsOnDay(events, day).sort(
                (a, b) =>
                  Number(!!b.allDay) - Number(!!a.allDay) ||
                  a.start.localeCompare(b.start) ||
                  a.id.localeCompare(b.id),
              );
              const extra = items.length - maxVisibleEvents;
              return (
                <td
                  role="gridcell"
                  tabIndex={-1}
                  key={day}
                  aria-label={day}
                  data-outside-month={day.slice(0, 7) !== date.slice(0, 7) || undefined}
                  className={`h-32 border border-border p-1 align-top ${day.slice(0, 7) !== date.slice(0, 7) ? "bg-bg text-text-muted" : ""}`}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    className={
                      day.slice(0, 7) !== date.slice(0, 7) ? "text-text-muted!" : undefined
                    }
                    aria-label={`Open day ${day}`}
                    onPress={() => onDayClick?.(day)}
                  >
                    {Number(day.slice(8))}
                  </Button>
                  <div className="flex flex-col gap-1">
                    {items.slice(0, maxVisibleEvents).map((event) => (
                      <CalendarEventButton
                        key={event.id}
                        event={event}
                        onEventClick={onEventClick}
                      />
                    ))}
                  </div>
                  {extra > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={`${extra} more events on ${day}`}
                      onPress={() => onDayClick?.(day)}
                    >
                      +{extra} more
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={`Create event ${day}`}
                    onPress={() => onSlotClick?.(`${day}T00:00`)}
                  >
                    +
                  </Button>
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
