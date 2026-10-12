import type {
  TimelineEvent,
  TimelineFilterOption,
  TimelineSubtab,
} from "@/components/records/detail/timeline";

export const LEADS_TIMELINE_SUBTABS: readonly TimelineSubtab[] = [
  { id: "history", label: "History" },
];

export const LEADS_TIMELINE_MODULE_OPTIONS: readonly TimelineFilterOption[] = [
  { id: "notes", label: "Notes" },
  { id: "attachments", label: "Attachments" },
  { id: "tasks", label: "Tasks" },
  { id: "calls", label: "Calls" },
  { id: "meetings", label: "Meetings" },
  { id: "emails", label: "Emails" },
];

export const LEADS_TIMELINE_SOURCE_OPTIONS: readonly TimelineFilterOption[] = [
  { id: "workflow", label: "Workflow Rules" },
  { id: "manual", label: "Manual" },
  { id: "import", label: "Import" },
];

/** Interim: event list is empty until a database adapter / event source arrives. */
export const LEADS_TIMELINE_EMPTY_EVENTS: readonly TimelineEvent[] = [];
