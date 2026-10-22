import type { TimelineFilterOption, TimelineSubtab } from "@/components/records/detail/timeline";
import {
  DEALS_TIMELINE_MODULE_OPTIONS,
  DEALS_TIMELINE_SOURCE_OPTIONS,
} from "../deals/deals-timeline";

export const MEETINGS_TIMELINE_SUBTABS: readonly TimelineSubtab[] = [
  { id: "history", label: "History" },
];

export const MEETINGS_TIMELINE_MODULE_OPTIONS: readonly TimelineFilterOption[] =
  DEALS_TIMELINE_MODULE_OPTIONS;

export const MEETINGS_TIMELINE_SOURCE_OPTIONS: readonly TimelineFilterOption[] =
  DEALS_TIMELINE_SOURCE_OPTIONS;

export function normalizeMeetingsEventKind(kind: string): string {
  return kind;
}
