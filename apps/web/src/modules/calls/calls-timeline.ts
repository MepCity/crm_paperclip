import type { TimelineFilterOption, TimelineSubtab } from "@/components/records/detail/timeline";
import {
  TASKS_TIMELINE_MODULE_OPTIONS,
  TASKS_TIMELINE_SOURCE_OPTIONS,
} from "../tasks/tasks-timeline";

export const CALLS_TIMELINE_SUBTABS: readonly TimelineSubtab[] = [
  { id: "history", label: "History" },
];

export const CALLS_TIMELINE_MODULE_OPTIONS: readonly TimelineFilterOption[] =
  TASKS_TIMELINE_MODULE_OPTIONS;

export const CALLS_TIMELINE_SOURCE_OPTIONS: readonly TimelineFilterOption[] =
  TASKS_TIMELINE_SOURCE_OPTIONS;

export function normalizeCallsEventKind(kind: string): string {
  return kind;
}
