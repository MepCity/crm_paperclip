"use client";

import type { FormatOptions } from "@crm/core/format";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icon";
import type { ModuleKey } from "@/components/ui/later-module";
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
  upcomingAutomatedActions?: { label: string; laterModule: ModuleKey };
}

export function TimelineHistory({
  heading,
  filterButtonLabel,
  events,
  format,
  initialFilterExpanded = false,
  upcomingAutomatedActions,
  ...filterProps
}: TimelineHistoryProps) {
  const [filterExpanded, setFilterExpanded] = useState(initialFilterExpanded);
  return (
    <div className="timeline-history" data-timeline-history>
      <div className="timeline-history-header">
        <h3 className="timeline-history-title">{heading}</h3>
        <span className="flex-1" aria-hidden />
        {upcomingAutomatedActions ? (
          <Button variant="ghost" size="compact" laterModule={upcomingAutomatedActions.laterModule}>
            {upcomingAutomatedActions.label}
          </Button>
        ) : null}
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
      {events.length === 0 ? (
        <p className="timeline-history-empty text-md text-text-muted px-3 py-4">No logs found</p>
      ) : (
        <TimelineEventTrack events={events} format={format} />
      )}
    </div>
  );
}
