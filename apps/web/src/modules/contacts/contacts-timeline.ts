import type { TimelineFilterOption, TimelineSubtab } from "@/components/records/detail/timeline";
import {
  LEADS_TIMELINE_MODULE_OPTIONS,
  LEADS_TIMELINE_SOURCE_OPTIONS,
} from "../leads/leads-timeline";

export const CONTACTS_TIMELINE_SUBTABS: readonly TimelineSubtab[] = [
  { id: "history", label: "History" },
  { id: "interactions", label: "Interactions" },
];
/** Interim: dropdown contents were not observed; use the shared Leads options. */
export const CONTACTS_TIMELINE_MODULE_OPTIONS: readonly TimelineFilterOption[] =
  LEADS_TIMELINE_MODULE_OPTIONS;
export const CONTACTS_TIMELINE_SOURCE_OPTIONS: readonly TimelineFilterOption[] =
  LEADS_TIMELINE_SOURCE_OPTIONS;
export function normalizeContactsEventKind(kind: string): string {
  return kind === "contact_image_upload" ? "image_upload" : kind;
}
