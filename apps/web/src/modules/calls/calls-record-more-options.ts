import type { RecordMenuGroup } from "@/components/records/detail/record-header";
import type { ModuleKey } from "@/components/ui/later-module";

export const CALLS_DELETE_CONFIRM_TITLE = "Delete Call";
export const CALLS_DELETE_CONFIRM_MESSAGE = "Are you sure you want to delete this Call?";

type Handlers = {
  onEdit?: () => void;
  onDelete: () => void;
};
type Row = { id: string; label: string; handler?: keyof Handlers; laterModule?: ModuleKey };

/** Five rows; one separator follows Delete (CD-07.1–CD-07.5). */
export const CALLS_RECORD_MORE_OPTIONS_GROUPS: readonly {
  id: string;
  items: readonly Row[];
}[] = [
  {
    id: "calls-more-primary",
    items: [
      { id: "edit", label: "Edit", handler: "onEdit" },
      { id: "share", label: "Share", laterModule: "M11" },
      { id: "delete", label: "Delete", handler: "onDelete" },
    ],
  },
  {
    id: "calls-more-secondary",
    items: [
      { id: "print-preview", label: "Print Preview", laterModule: "M6" },
      { id: "send-email", label: "Send Email", laterModule: "M10" },
    ],
  },
];

export function buildCallsRecordMoreMenuGroups(handlers: Handlers): RecordMenuGroup[] {
  return CALLS_RECORD_MORE_OPTIONS_GROUPS.map((group) => ({
    id: group.id,
    items: group.items.map(({ handler, ...row }) => ({
      ...row,
      ...(handler ? { onAction: handlers[handler] } : {}),
    })),
  }));
}
