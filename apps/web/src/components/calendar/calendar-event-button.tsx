"use client";

import type { CSSProperties } from "react";
import { Button } from "@/components/ui/button";
import type { CalendarEvent } from "./layout-timed-events";

export function CalendarEventButton({
  event,
  onEventClick,
  style,
}: {
  event: CalendarEvent;
  onEventClick?: (event: CalendarEvent) => void;
  style?: CSSProperties;
}) {
  return (
    <Button
      variant="ghost"
      size="sm"
      aria-label={`${event.title}, ${event.start} to ${event.end}${event.allDay ? ", all day" : ""}`}
      onPress={() => onEventClick?.(event)}
      style={style}
      className="z-10 w-full overflow-hidden rounded-sm bg-primary-subtle px-1! py-0! text-left text-xs text-text data-focus-visible:z-20"
    >
      <span className="truncate">{event.title}</span>
    </Button>
  );
}
