import type {
  TimelineEvent,
  TimelineFilterOption,
  TimelineSubtab,
} from "@/components/records/detail/timeline";
import {
  ACCOUNTS_TIMELINE_MODULE_OPTIONS,
  ACCOUNTS_TIMELINE_SOURCE_OPTIONS,
} from "../accounts/accounts-timeline";

export const DEALS_TIMELINE_SUBTABS: readonly TimelineSubtab[] = [
  { id: "history", label: "History" },
];

export const DEALS_TIMELINE_MODULE_OPTIONS: readonly TimelineFilterOption[] =
  ACCOUNTS_TIMELINE_MODULE_OPTIONS;

export const DEALS_TIMELINE_SOURCE_OPTIONS: readonly TimelineFilterOption[] =
  ACCOUNTS_TIMELINE_SOURCE_OPTIONS;

export const DEALS_TIMELINE_EMPTY_EVENTS: readonly TimelineEvent[] = [];

export function normalizeDealsEventKind(kind: string): string {
  return kind;
}
