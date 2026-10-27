import type { RecordMenuGroup } from "@/components/records/detail/record-header";
import { withPrintPreviewAction } from "@/components/records/print/print-preview-menu";
import type { ModuleKey } from "@/components/ui/later-module";

/** Interim copy for single-record delete (leads-write-behaviour.md › A1, not documented in UI). */
export const LEADS_DELETE_CONFIRM_TITLE = "Delete Lead";
export const LEADS_DELETE_CONFIRM_MESSAGE = "Are you sure you want to delete this Lead?";

export type LeadsRecordMoreOptionsHandlers = {
  onClone: () => void;
  onDelete: () => void;
  onFindMergeDuplicates?: () => void;
  onPrintPreview?: () => void;
};

type SpecMenuItem = {
  id: string;
  label: string;
  handlerKey?: keyof LeadsRecordMoreOptionsHandlers;
  laterModule?: ModuleKey;
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
      { id: "clone", label: "Clone", handlerKey: "onClone" },
      { id: "share", label: "Share", laterModule: "M11" },
      { id: "delete", label: "Delete", handlerKey: "onDelete" },
    ],
  },
  {
    id: "leads-more-print",
    items: [
      { id: "print-preview", label: "Print Preview", laterModule: "M6" },
      {
        id: "find-merge-duplicates",
        label: "Find and Merge Duplicates",
        handlerKey: "onFindMergeDuplicates",
      },
      { id: "mail-merge", label: "Mail Merge", laterModule: "M10" },
    ],
  },
  {
    id: "leads-more-automation",
    items: [
      { id: "run-macro", label: "Run Macro", laterModule: "M12" },
      { id: "customize-business-card", label: "Customize Business Card", laterModule: "M11" },
      { id: "organize-lead-details", label: "Organize Lead Details", laterModule: "M11" },
      { id: "add-related-list", label: "Add Related List", laterModule: "M11" },
      { id: "review-history", label: "Review History", laterModule: "M11" },
      { id: "enroll-cadence", label: "Enroll to Cadence", laterModule: "P3" },
      { id: "add-kiosk", label: "Add Kiosk", laterModule: "P3" },
      { id: "create-button", label: "Create Button", laterModule: "M11" },
      { id: "create-client-script", label: "Create Client Script", laterModule: "P3" },
    ],
  },
];

/** Unimplemented menu labels with parity-checklist owning module (docs/parity-checklist.md). */
export const LEADS_RECORD_MORE_OPTIONS_DEVIATIONS: readonly LeadsMoreOptionsDeviation[] = [
  { label: "Share", parityModule: "M11 (Record Share)" },
  { label: "Print Preview", parityModule: "M6" },
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
 * Keeps the observed menu inventory visible; unavailable actions retain their feature boundary.
 */
export function buildLeadsRecordMoreMenuGroups(
  handlers: LeadsRecordMoreOptionsHandlers,
): RecordMenuGroup[] {
  const groups: RecordMenuGroup[] = [];
  for (const group of LEADS_RECORD_MORE_OPTIONS_SPEC_GROUPS) {
    const items = group.items
      .filter((item) => item.handlerKey !== undefined || item.laterModule !== undefined)
      .filter(
        (item) =>
          item.handlerKey !== "onFindMergeDuplicates" ||
          handlers.onFindMergeDuplicates !== undefined,
      )
      .map((item) => {
        const key = item.handlerKey;
        return {
          id: item.id,
          label: item.label,
          ...(key ? { onAction: handlers[key] } : {}),
          ...(item.laterModule ? { laterModule: item.laterModule } : {}),
        };
      });
    if (items.length > 0) {
      groups.push({ id: group.id, items });
    }
  }
  return withPrintPreviewAction(groups, handlers.onPrintPreview);
}
