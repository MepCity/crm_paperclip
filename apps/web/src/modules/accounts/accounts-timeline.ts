import type { TimelineFilterOption, TimelineSubtab } from "@/components/records/detail/timeline";
import {
  LEADS_TIMELINE_MODULE_OPTIONS,
  LEADS_TIMELINE_SOURCE_OPTIONS,
} from "../leads/leads-timeline";

/** Accounts Timeline paints History alone (AD-159); Interactions is absent (AD-34). */
export const ACCOUNTS_TIMELINE_SUBTABS: readonly TimelineSubtab[] = [
  { id: "history", label: "History" },
];

export const ACCOUNTS_TIMELINE_MODULE_OPTIONS: readonly TimelineFilterOption[] =
  LEADS_TIMELINE_MODULE_OPTIONS;
export const ACCOUNTS_TIMELINE_SOURCE_OPTIONS: readonly TimelineFilterOption[] =
  LEADS_TIMELINE_SOURCE_OPTIONS;

export function normalizeAccountsEventKind(kind: string): string {
  return kind === "account_image_upload" ? "image_upload" : kind;
}
