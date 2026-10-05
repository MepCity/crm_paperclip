import { type FormatOptions, formatDate, formatTime } from "@crm/core/format";
import { Icons } from "@/components/ui/icon";
import type { TimelineEvent, TimelineEventKind } from "./types";

function EventKindIcon({ kind }: { kind: TimelineEventKind }) {
  if (kind === "lead_image_upload" || kind === "image_upload") {
    return <Icons.timelinePencil className="h-4 w-4" aria-hidden="true" data-kind-icon="pencil" />;
  }
  return <Icons.timelineGeneric className="h-4 w-4" aria-hidden="true" data-kind-icon="generic" />;
}

function groupEventsByDay(
  events: readonly TimelineEvent[],
  format: FormatOptions,
): { dayLabel: string; events: TimelineEvent[] }[] {
  const sorted = [...events].sort(
    (left, right) => new Date(right.at).getTime() - new Date(left.at).getTime(),
  );
  const groups: { dayLabel: string; events: TimelineEvent[] }[] = [];
  for (const event of sorted) {
    const dayLabel = formatDate(event.at, format);
    const last = groups.at(-1);
    if (last && last.dayLabel === dayLabel) last.events.push(event);
    else groups.push({ dayLabel, events: [event] });
  }
  for (const group of groups) {
    group.events.sort((left, right) => new Date(right.at).getTime() - new Date(left.at).getTime());
  }
  return groups;
}

export interface TimelineEventTrackProps {
  events: readonly TimelineEvent[];
  format: FormatOptions;
}

export function TimelineEventTrack({ events, format }: TimelineEventTrackProps) {
  if (events.length === 0) return null;
  const days = groupEventsByDay(events, format);
  return (
    <div className="timeline-event-track" data-timeline-event-track>
      {days.map((day) => (
        <section key={day.dayLabel} className="timeline-event-day" aria-label={day.dayLabel}>
          <div className="timeline-event-date-badge">{day.dayLabel}</div>
          <div className="timeline-event-connector" aria-hidden="true" />
          <ul className="m-0 list-none p-0">
            {day.events.map((event) => (
              <li key={event.id} className="timeline-event-row">
                <time className="timeline-event-time" dateTime={event.at}>
                  {formatTime(event.at, format)}
                </time>
                <div className="timeline-event-rail" aria-hidden="true">
                  <span className="timeline-event-icon">
                    <EventKindIcon kind={event.kind} />
                  </span>
                </div>
                <div className="timeline-event-body">
                  <p className="timeline-event-title">{event.title}</p>
                  <p className="timeline-event-byline">
                    by {event.actorName} {formatDate(event.at, format)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
