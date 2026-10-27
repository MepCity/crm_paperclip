"use client";

import type { FormatOptions } from "@crm/core/format";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icon";
import type { ModuleKey } from "@/components/ui/later-module";
import { useUiTranslations } from "@/i18n/client-provider";
import { useRecordLabel } from "@/i18n/record-labels";
import { TimelineEventTrack } from "./timeline-event-track";
import {
  TimelineHistoryFilterPanel,
  type TimelineHistoryFilterProps,
} from "./timeline-history-filter";
import type { TimelineEvent, TimelineHistoryFilterValue, TimelineTimePreset } from "./types";
import "./timeline.css";

export interface TimelineHistoryProps extends TimelineHistoryFilterProps {
  heading: string;
  filterButtonLabel: string;
  events: readonly TimelineEvent[];
  format: FormatOptions;
  initialFilterExpanded?: boolean;
  serverFiltered?: boolean;
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
  hasMore?: boolean;
  loadingMore?: boolean;
  onShowMore?: () => void;
  upcomingAutomatedActions?: { label: string; laterModule: ModuleKey };
}

const NO_FILTER: TimelineHistoryFilterValue = {
  moduleIds: [],
  userId: null,
  time: "any",
  sourceIds: [],
};

function startOfDay(now: Date, daysBack: number): number {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysBack).getTime();
}

function inTimeRange(at: string, time: TimelineTimePreset, now: Date): boolean {
  const t = new Date(at).getTime();
  switch (time) {
    case "today":
      return t >= startOfDay(now, 0);
    case "yesterday":
      return t >= startOfDay(now, 1) && t < startOfDay(now, 0);
    case "last7":
      return t >= startOfDay(now, 7);
    case "last30":
      return t >= startOfDay(now, 30);
    default:
      return true;
  }
}

/** Events without a module id (record field changes) are hidden once a Modules filter is applied. */
export function filterTimelineEvents(
  events: readonly TimelineEvent[],
  filter: TimelineHistoryFilterValue,
  now: Date = new Date(),
): TimelineEvent[] {
  return events.filter(
    (event) =>
      (filter.moduleIds.length === 0 ||
        (event.moduleId !== undefined && filter.moduleIds.includes(event.moduleId))) &&
      (filter.userId === null || event.actorId === filter.userId) &&
      inTimeRange(event.at, filter.time, now),
  );
}

export function TimelineHistory({
  heading,
  filterButtonLabel,
  events,
  format,
  initialFilterExpanded = false,
  upcomingAutomatedActions,
  onApply,
  serverFiltered = false,
  loading = false,
  error = false,
  onRetry,
  hasMore = false,
  loadingMore = false,
  onShowMore,
  ...filterProps
}: TimelineHistoryProps) {
  const label = useRecordLabel();
  const t = useUiTranslations();
  const [applied, setApplied] = useState<TimelineHistoryFilterValue>(NO_FILTER);
  const visibleEvents = useMemo(
    () => (serverFiltered ? events : filterTimelineEvents(events, applied)),
    [events, applied, serverFiltered],
  );
  const [filterExpanded, setFilterExpanded] = useState(initialFilterExpanded);
  return (
    <div className="timeline-history" data-timeline-history>
      <div className="timeline-history-header">
        <h3 className="timeline-history-title">{label(heading)}</h3>
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
        <span className="flex-1" aria-hidden />
        {upcomingAutomatedActions ? (
          <Button variant="ghost" size="compact" laterModule={upcomingAutomatedActions.laterModule}>
            {label(upcomingAutomatedActions.label)}
          </Button>
        ) : null}
      </div>
      {filterExpanded && (
        <TimelineHistoryFilterPanel
          {...filterProps}
          initialValue={applied}
          onApply={(value) => {
            setApplied(value);
            onApply(value);
          }}
        />
      )}
      {loading ? <p role="status">Loading history…</p> : null}
      {error ? (
        <div role="alert">
          Could not load history.{" "}
          <button type="button" onClick={onRetry}>
            Retry
          </button>
        </div>
      ) : null}
      {!loading && !error && visibleEvents.length === 0 ? (
        <p className="timeline-history-empty text-md text-text-muted px-3 py-4">
          {t("records.chrome.noLogs")}
        </p>
      ) : (
        <TimelineEventTrack events={visibleEvents} format={format} preserveOrder={serverFiltered} />
      )}
      {hasMore ? (
        <button
          type="button"
          className="timeline-event-show-more"
          disabled={loadingMore}
          onClick={onShowMore}
        >
          {loadingMore ? "Loading…" : "Show More"}
        </button>
      ) : null}
    </div>
  );
}
