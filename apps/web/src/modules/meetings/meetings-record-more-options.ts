import type { RecordMenuGroup } from "@/components/records/detail/record-header";
import type { ModuleKey } from "@/components/ui/later-module";

export const MEETINGS_DELETE_CONFIRM_TITLE = "Delete Meeting";
export const MEETINGS_DELETE_CONFIRM_MESSAGE = "Are you sure you want to delete this Meeting?";

type Handlers = {
  onClone: () => void;
  onDelete: () => void;
  onFindMergeDuplicates?: () => void;
};
type Row = { id: string; label: string; handler?: keyof Handlers; laterModule?: ModuleKey };

/** Six rows; separators follow Delete and Export Meeting (MD-07.1–MD-07.6). */
export const MEETINGS_RECORD_MORE_OPTIONS_GROUPS: readonly {
  id: string;
  items: readonly Row[];
}[] = [
  {
    id: "meetings-more-primary",
    items: [
      { id: "clone", label: "Clone", handler: "onClone" },
      { id: "share", label: "Share", laterModule: "M11" },
      { id: "delete", label: "Delete", handler: "onDelete" },
    ],
  },
  {
    id: "meetings-more-print",
    items: [
      { id: "print-preview", label: "Print Preview", laterModule: "M6" },
      { id: "export-meeting", label: "Export Meeting" },
    ],
  },
  {
    id: "meetings-more-automation",
    items: [{ id: "create-button", label: "Create Button", laterModule: "M11" }],
  },
];

export function buildMeetingsRecordMoreMenuGroups(handlers: Handlers): RecordMenuGroup[] {
  return MEETINGS_RECORD_MORE_OPTIONS_GROUPS.map((group) => ({
    id: group.id,
    items: group.items.map(({ handler, ...row }) => ({
      ...row,
      ...(handler ? { onAction: handlers[handler] } : {}),
    })),
  }));
}
