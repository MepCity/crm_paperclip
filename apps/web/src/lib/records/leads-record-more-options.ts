import type { RecordMenuGroup } from "@/components/records/detail/record-header";

/** Interim copy for single-record delete (leads-write-behaviour.md › A1, not documented in UI). */
export const LEADS_DELETE_CONFIRM_TITLE = "Delete Lead";
export const LEADS_DELETE_CONFIRM_MESSAGE = "Are you sure you want to delete this Lead?";

export type LeadsRecordMoreOptionsHandlers = {
  onDelete: () => void;
};

/**
 * Spec order (record-detail.md › Actions): Clone, Share, Delete, … — only handlers
 * passed from the page are rendered; other labels are deferred to later tasks.
 */
export function buildLeadsRecordMoreMenuGroups(
  handlers: LeadsRecordMoreOptionsHandlers,
): RecordMenuGroup[] {
  const items = [{ id: "delete", label: "Delete", onAction: handlers.onDelete }];
  return [{ id: "leads-more-primary", items }];
}
