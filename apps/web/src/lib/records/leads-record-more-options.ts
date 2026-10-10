import type { RecordMenuGroup } from "@/components/records/detail/record-header";

/** Interim copy for single-record delete (leads-write-behaviour.md › A1, not documented in UI). */
export const LEADS_DELETE_CONFIRM_TITLE = "Delete Lead";
export const LEADS_DELETE_CONFIRM_MESSAGE = "Are you sure you want to delete this Lead?";

export type LeadsRecordMoreOptionsHandlers = {
  onDelete: () => void;
};

type SpecMenuItem = {
  id: string;
  label: string;
  handlerKey?: keyof LeadsRecordMoreOptionsHandlers;
};

export type LeadsMoreOptionsDeviation = {
  label: string;
  parityModule: string;
};

/**
 * Full More Options inventory in spec order (record-detail.md › Actions).
 * Separators match the three visual groups in the reference menu.
 */
export const LEADS_RECORD_MORE_OPTIONS_SPEC_GROUPS: readonly {
  id: string;
  items: readonly SpecMenuItem[];
}[] = [
  {
    id: "leads-more-primary",
    items: [
      { id: "clone", label: "Clone" },
      { id: "share", label: "Share" },
      { id: "delete", label: "Delete", handlerKey: "onDelete" },
    ],
  },
  {
    id: "leads-more-print",
    items: [
      { id: "print-preview", label: "Print Preview" },
      { id: "find-merge-duplicates", label: "Find and Merge Duplicates" },
      { id: "mail-merge", label: "Mail Merge" },
    ],
  },
  {
    id: "leads-more-automation",
    items: [
      { id: "run-macro", label: "Run Macro" },
      { id: "customize-business-card", label: "Customize Business Card" },
      { id: "organize-lead-details", label: "Organize Lead Details" },
      { id: "add-related-list", label: "Add Related List" },
      { id: "review-history", label: "Review History" },
      { id: "enroll-cadence", label: "Enroll to Cadence" },
      { id: "add-kiosk", label: "Add Kiosk" },
      { id: "create-button", label: "Create Button" },
      { id: "create-client-script", label: "Create Client Script" },
    ],
  },
];

/** Unimplemented menu labels with parity-checklist owning module (docs/parity-checklist.md). */
export const LEADS_RECORD_MORE_OPTIONS_DEVIATIONS: readonly LeadsMoreOptionsDeviation[] = [
  { label: "Clone", parityModule: "M1 row 25 (separate Clone Lead task)" },
  { label: "Share", parityModule: "M11 (Record Share)" },
  { label: "Print Preview", parityModule: "M6" },
  { label: "Find and Merge Duplicates", parityModule: "M2 with Contacts" },
  { label: "Mail Merge", parityModule: "M10" },
  { label: "Run Macro", parityModule: "M12" },
  { label: "Customize Business Card", parityModule: "M11" },
  { label: "Organize Lead Details", parityModule: "M11" },
  { label: "Add Related List", parityModule: "M11" },
  { label: "Review History", parityModule: "P3" },
  { label: "Enroll to Cadence", parityModule: "P3" },
  { label: "Add Kiosk", parityModule: "P3" },
  { label: "Create Button", parityModule: "M11" },
  { label: "Create Client Script", parityModule: "P3" },
];

/**
 * Renders only items whose handler is supplied; empty spec groups are omitted.
 */
export function buildLeadsRecordMoreMenuGroups(
  handlers: LeadsRecordMoreOptionsHandlers,
): RecordMenuGroup[] {
  const groups: RecordMenuGroup[] = [];
  for (const group of LEADS_RECORD_MORE_OPTIONS_SPEC_GROUPS) {
    const items = group.items
      .filter((item) => item.handlerKey !== undefined)
      .map((item) => {
        const key = item.handlerKey;
        if (!key) throw new Error("Filtered item missing handlerKey.");
        return {
          id: item.id,
          label: item.label,
          onAction: handlers[key],
        };
      });
    if (items.length > 0) {
      groups.push({ id: group.id, items });
    }
  }
  return groups;
}
