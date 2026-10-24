import type { RecordMenuGroup } from "@/components/records/detail/record-header";
import { withPrintPreviewAction } from "@/components/records/print/print-preview-menu";
import type { ModuleKey } from "@/components/ui/later-module";

export const CONTACTS_DELETE_CONFIRM_TITLE = "Delete Contact";
/** Interim: shared Leads confirmation wording. */
export const CONTACTS_DELETE_CONFIRM_MESSAGE = "Are you sure you want to delete this Contact?";
type Handlers = {
  onClone: () => void;
  onDelete: () => void;
  onFindMergeDuplicates?: () => void;
  onPrintPreview?: () => void;
};
type Row = { id: string; label: string; handler?: keyof Handlers; laterModule?: ModuleKey };
/** Three observed groups; separators follow Delete and Mail Merge. */
export const CONTACTS_RECORD_MORE_OPTIONS_GROUPS: readonly { id: string; items: readonly Row[] }[] =
  [
    {
      id: "contacts-more-primary",
      items: [
        { id: "clone", label: "Clone", handler: "onClone" },
        { id: "share", label: "Share", laterModule: "M11" },
        { id: "delete", label: "Delete", handler: "onDelete" },
      ],
    },
    {
      id: "contacts-more-print",
      items: [
        { id: "print-preview", label: "Print Preview", laterModule: "M6" },
        {
          id: "find-merge-duplicates",
          label: "Find and Merge Duplicates",
          handler: "onFindMergeDuplicates",
        },
        { id: "mail-merge", label: "Mail Merge", laterModule: "M9" },
      ],
    },
    {
      id: "contacts-more-automation",
      items: [
        { id: "run-macro", label: "Run Macro", laterModule: "M12" },
        { id: "customize-business-card", label: "Customize Business Card", laterModule: "M11" },
        { id: "organize-contact-details", label: "Organize Contact Details", laterModule: "M11" },
        { id: "add-related-list", label: "Add Related List", laterModule: "M11" },
        { id: "review-history", label: "Review History", laterModule: "P3" },
        { id: "enroll-cadence", label: "Enroll to Cadence", laterModule: "P3" },
        { id: "add-kiosk", label: "Add Kiosk", laterModule: "M11" },
        { id: "create-button", label: "Create Button", laterModule: "M11" },
        { id: "create-client-script", label: "Create Client Script", laterModule: "M11" },
      ],
    },
  ];
export function buildContactsRecordMoreMenuGroups(handlers: Handlers): RecordMenuGroup[] {
  const groups = CONTACTS_RECORD_MORE_OPTIONS_GROUPS.map((group) => ({
    id: group.id,
    items: group.items
      .filter(
        (item) =>
          item.handler !== "onFindMergeDuplicates" || handlers.onFindMergeDuplicates !== undefined,
      )
      .map(({ handler, ...row }) => ({
        ...row,
        ...(handler ? { onAction: handlers[handler] } : {}),
      })),
  }));
  return withPrintPreviewAction(groups, handlers.onPrintPreview);
}
