"use client";

import { DEFAULT_FORMAT } from "@/lib/locale";
import { TimelineHistory } from "./timeline-history";
import { TimelineSurface } from "./timeline-surface";
import type { TimelineEvent, TimelineFilterOption } from "./types";

const IST_FORMAT = { locale: "en-US", timeZone: "Europe/Istanbul" };

const moduleOptions: TimelineFilterOption[] = [
  { id: "notes", label: "Notes" },
  { id: "attachments", label: "Attachments" },
  { id: "tasks", label: "Tasks" },
  { id: "calls", label: "Calls" },
  { id: "meetings", label: "Meetings" },
  { id: "emails", label: "Emails" },
];

const userOptions: TimelineFilterOption[] = [
  { id: "u1", label: "Sample Owner" },
  { id: "u2", label: "Sample Reviewer" },
];

const sourceOptions: TimelineFilterOption[] = [
  { id: "workflow", label: "Workflow Rules" },
  { id: "manual", label: "Manual" },
  { id: "import", label: "Import" },
];

const events: TimelineEvent[] = [
  {
    id: "e1",
    at: "2026-10-04T14:32:00.000Z",
    kind: "lead_image_upload",
    title: "Lead Image uploaded",
    actorName: "Sample Owner",
  },
  {
    id: "e2",
    at: "2026-10-04T11:05:00.000Z",
    kind: "field_update",
    title: "Company updated",
    actorName: "Sample Reviewer",
  },
  {
    id: "e3",
    at: "2026-10-04T09:18:00.000Z",
    kind: "unknown_kind",
    title: "Status changed",
    actorName: "Sample Owner",
  },
  {
    id: "e4",
    at: "2026-10-03T16:44:00.000Z",
    kind: "email",
    title: "Email logged",
    actorName: "Sample Owner",
  },
  {
    id: "e5",
    at: "2026-10-03T08:12:00.000Z",
    kind: "task",
    title: "Task completed",
    actorName: "Sample Reviewer",
  },
  {
    id: "e6",
    at: "2026-10-04T22:30:00.000Z",
    kind: "task",
    title: "Late night update",
    actorName: "Sample Owner",
  },
];

const subtabs = [{ id: "history", label: "History" }];

const filterLabels = {
  modulesLabel: "Modules",
  modulesAllLabel: "All Modules",
  moduleOptions,
  usersLabel: "Users",
  usersAllLabel: "All Users",
  userOptions,
  timeLabel: "Time",
  sourcesLabel: "Sources",
  sourcesAllLabel: "All Sources",
  sourceOptions,
  applyLabel: "Apply Filter",
  onApply: () => {},
};

export default function TimelineHistoryDemo() {
  return (
    <div className="space-y-10">
      <section data-timeline-demo="filter-closed" aria-label="Timeline History with filter closed">
        <TimelineSurface subtabs={subtabs} activeSubtabId="history">
          <TimelineHistory
            heading="Timeline History"
            filterButtonLabel="History filter"
            events={events}
            format={DEFAULT_FORMAT}
            initialFilterExpanded={false}
            {...filterLabels}
          />
        </TimelineSurface>
      </section>
      <section data-timeline-demo="filter-open" aria-label="Timeline History with filter open">
        <TimelineSurface subtabs={subtabs} activeSubtabId="history">
          <TimelineHistory
            heading="Timeline History"
            filterButtonLabel="History filter"
            events={events}
            format={IST_FORMAT}
            initialFilterExpanded={true}
            {...filterLabels}
          />
        </TimelineSurface>
      </section>
    </div>
  );
}
