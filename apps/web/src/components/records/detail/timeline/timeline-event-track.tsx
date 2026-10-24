import { type FormatOptions, formatDate, formatTime } from "@crm/core/format";
import { useLayoutEffect, useRef, useState } from "react";
import { Icons } from "@/components/ui/icon";
import type { TimelineEvent, TimelineEventKind } from "./types";

function EventKindIcon({ kind }: { kind: TimelineEventKind }) {
  if (kind === "image_upload") {
    return <Icons.timelinePencil className="h-4 w-4" aria-hidden="true" data-kind-icon="pencil" />;
  }
  return <Icons.timelineGeneric className="h-4 w-4" aria-hidden="true" data-kind-icon="generic" />;
}

function EventBody({ event }: { event: TimelineEvent }) {
  const ref = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);
  // Measured while clamped: the clamp is what makes a long body overflow its box.
  useLayoutEffect(() => {
    const el = ref.current;
    if (el && !expanded) setOverflows(el.scrollHeight > el.clientHeight + 1);
  }, [expanded]);
  return (
    <div className="timeline-event-note">
      <div ref={ref} className="timeline-event-note-body" data-clamped={!expanded}>
        {event.body}
      </div>
      {overflows || expanded ? (
        <button
          type="button"
          className="timeline-event-show-more"
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? "Show Less" : "Show More"}
        </button>
      ) : null}
    </div>
  );
}

function groupEventsByDay(
  events: readonly TimelineEvent[],
  format: FormatOptions,
  preserveOrder: boolean,
): { dayLabel: string; events: TimelineEvent[] }[] {
  const sorted = preserveOrder
    ? [...events]
    : [...events].sort((left, right) => new Date(right.at).getTime() - new Date(left.at).getTime());
  const groups: { dayLabel: string; events: TimelineEvent[] }[] = [];
  for (const event of sorted) {
    const dayLabel = formatDate(event.at, format);
    const last = groups.at(-1);
    if (last && last.dayLabel === dayLabel) last.events.push(event);
    else groups.push({ dayLabel, events: [event] });
  }
  for (const group of preserveOrder ? [] : groups) {
    group.events.sort((left, right) => new Date(right.at).getTime() - new Date(left.at).getTime());
  }
  return groups;
}

export interface TimelineEventTrackProps {
  events: readonly TimelineEvent[];
  format: FormatOptions;
  preserveOrder?: boolean;
}

export function TimelineEventTrack({
  events,
  format,
  preserveOrder = false,
}: TimelineEventTrackProps) {
  if (events.length === 0) return null;
  const days = groupEventsByDay(events, format, preserveOrder);
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
                  {event.body ? <EventBody event={event} /> : null}
                  {event.moduleId === "notes" ? (
                    <span className="timeline-event-add-note">
                      Add Note
                      <Icons.chevronDown aria-hidden="true" className="h-3 w-3" />
                    </span>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
