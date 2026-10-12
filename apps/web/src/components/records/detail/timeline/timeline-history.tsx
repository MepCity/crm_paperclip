"use client";

import type { FormatOptions } from "@crm/core/format";
import { useState } from "react";
import { Icons } from "@/components/ui/icon";
import { TimelineEventTrack } from "./timeline-event-track";
import {
  TimelineHistoryFilterPanel,
  type TimelineHistoryFilterProps,
} from "./timeline-history-filter";
import type { TimelineEvent } from "./types";
import "./timeline.css";

export interface TimelineHistoryProps extends TimelineHistoryFilterProps {
  heading: string;
  filterButtonLabel: string;
  events: readonly TimelineEvent[];
  format: FormatOptions;
  initialFilterExpanded?: boolean;
}

export function TimelineHistory({
  heading,
  filterButtonLabel,
  events,
  format,
  initialFilterExpanded = false,
  ...filterProps
}: TimelineHistoryProps) {
  const [filterExpanded, setFilterExpanded] = useState(initialFilterExpanded);
  return (
    <div className="timeline-history" data-timeline-history>
      <div className="timeline-history-header">
        <h3 className="timeline-history-title">{heading}</h3>
        <button
          type="button"
          className="timeline-history-filter-button"
          aria-label={filterButtonLabel}
          aria-expanded={filterExpanded}
          data-expanded={filterExpanded ? "true" : "false"}
          onClick={() => setFilterExpanded((open) => !open)}
        >
          <Icons.filter aria-hidden="true" className="h-4 w-4" />
        </button>
      </div>
      {filterExpanded && <TimelineHistoryFilterPanel {...filterProps} />}
      <TimelineEventTrack events={events} format={format} />
    </div>
  );
}
