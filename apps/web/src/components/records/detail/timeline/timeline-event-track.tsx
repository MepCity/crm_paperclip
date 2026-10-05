import { Icons } from "@/components/ui/icon";
import type { TimelineEvent, TimelineEventKind } from "./types";

function formatTime(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function formatDateBadge(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatBylineDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function EventKindIcon({ kind }: { kind: TimelineEventKind }) {
  if (kind === "lead_image_upload" || kind === "image_upload") {
    return <Icons.timelineImage className="h-4 w-4" aria-hidden="true" />;
  }
  return <Icons.timelineGeneric className="h-4 w-4" aria-hidden="true" />;
}

function groupEventsByDay(
  events: readonly TimelineEvent[],
): { dayKey: string; events: TimelineEvent[] }[] {
  const sorted = [...events].sort(
    (left, right) => new Date(right.at).getTime() - new Date(left.at).getTime(),
  );
  const groups = new Map<string, TimelineEvent[]>();
  for (const event of sorted) {
    const dayKey = event.at.slice(0, 10);
    const bucket = groups.get(dayKey);
    if (bucket) bucket.push(event);
    else groups.set(dayKey, [event]);
  }
  return [...groups.entries()].map(([dayKey, dayEvents]) => ({
    dayKey,
    events: dayEvents.sort(
      (left, right) => new Date(right.at).getTime() - new Date(left.at).getTime(),
    ),
  }));
}

export interface TimelineEventTrackProps {
  events: readonly TimelineEvent[];
}

export function TimelineEventTrack({ events }: TimelineEventTrackProps) {
  if (events.length === 0) return null;
  const days = groupEventsByDay(events);
  return (
    <div className="timeline-event-track" data-timeline-event-track>
      {days.map((day) => {
        const anchor = day.events[0];
        if (!anchor) return null;
        return (
          <section
            key={day.dayKey}
            className="timeline-event-day"
            aria-label={formatDateBadge(anchor.at)}
          >
            <div className="timeline-event-date-badge">{formatDateBadge(anchor.at)}</div>
            <ul className="m-0 list-none p-0">
              {day.events.map((event) => (
                <li key={event.id} className="timeline-event-row">
                  <time className="timeline-event-time" dateTime={event.at}>
                    {formatTime(event.at)}
                  </time>
                  <div className="timeline-event-rail" aria-hidden="true">
                    <span className="timeline-event-icon">
                      <EventKindIcon kind={event.kind} />
                    </span>
                  </div>
                  <div className="timeline-event-body">
                    <p className="timeline-event-title">{event.title}</p>
                    <p className="timeline-event-byline">
                      by {event.actorName} {formatBylineDate(event.at)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
