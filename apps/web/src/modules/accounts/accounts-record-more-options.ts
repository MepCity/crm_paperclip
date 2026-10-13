import type { RecordMenuGroup } from "@/components/records/detail/record-header";
import type { ModuleKey } from "@/components/ui/later-module";

export const ACCOUNTS_DELETE_CONFIRM_TITLE = "Delete Account";
export const ACCOUNTS_DELETE_CONFIRM_MESSAGE = "Are you sure you want to delete this Account?";

type Handlers = {
  onClone: () => void;
  onDelete: () => void;
  onFindMergeDuplicates?: () => void;
};
type Row = { id: string; label: string; handler?: keyof Handlers; laterModule?: ModuleKey };

/** Thirteen rows; Run Macro and Enroll to Cadence are absent on Accounts (AD-07.x). */
export const ACCOUNTS_RECORD_MORE_OPTIONS_GROUPS: readonly {
  id: string;
  items: readonly Row[];
}[] = [
  {
    id: "accounts-more-primary",
    items: [
      { id: "clone", label: "Clone", handler: "onClone" },
      { id: "share", label: "Share", laterModule: "M11" },
      { id: "delete", label: "Delete", handler: "onDelete" },
    ],
  },
  {
    id: "accounts-more-print",
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
    id: "accounts-more-automation",
    items: [
      { id: "customize-business-card", label: "Customize Business Card", laterModule: "M11" },
      { id: "organize-account-details", label: "Organize Account Details", laterModule: "M11" },
      { id: "add-related-list", label: "Add Related List", laterModule: "M11" },
      { id: "review-history", label: "Review History", laterModule: "P3" },
      { id: "add-kiosk", label: "Add Kiosk", laterModule: "M11" },
      { id: "create-button", label: "Create Button", laterModule: "M11" },
      { id: "create-client-script", label: "Create Client Script", laterModule: "M11" },
    ],
  },
];

export function buildAccountsRecordMoreMenuGroups(handlers: Handlers): RecordMenuGroup[] {
  return ACCOUNTS_RECORD_MORE_OPTIONS_GROUPS.map((group) => ({
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
}
