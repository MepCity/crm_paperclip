import type { RecordMenuGroup } from "@/components/records/detail/record-header";
import type { ModuleKey } from "@/components/ui/later-module";

export const TASKS_DELETE_CONFIRM_TITLE = "Delete Task";
export const TASKS_DELETE_CONFIRM_MESSAGE = "Are you sure you want to delete this Task?";

type Handlers = {
  onClone: () => void;
  onDelete: () => void;
  onFindMergeDuplicates?: () => void;
};
type Row = { id: string; label: string; handler?: keyof Handlers; laterModule?: ModuleKey };

/** Seven rows; separators follow Delete and Print Preview (TD-07.1–TD-07.7). */
export const TASKS_RECORD_MORE_OPTIONS_GROUPS: readonly {
  id: string;
  items: readonly Row[];
}[] = [
  {
    id: "tasks-more-primary",
    items: [
      { id: "clone", label: "Clone", handler: "onClone" },
      { id: "share", label: "Share", laterModule: "M11" },
      { id: "delete", label: "Delete", handler: "onDelete" },
    ],
  },
  {
    id: "tasks-more-print",
    items: [{ id: "print-preview", label: "Print Preview", laterModule: "M6" }],
  },
  {
    id: "tasks-more-automation",
    items: [
      { id: "customize-business-card", label: "Customize Business Card", laterModule: "M11" },
      { id: "organize-task-details", label: "Organize Task Details", laterModule: "M11" },
      { id: "create-button", label: "Create Button", laterModule: "M11" },
    ],
  },
];

export function buildTasksRecordMoreMenuGroups(handlers: Handlers): RecordMenuGroup[] {
  return TASKS_RECORD_MORE_OPTIONS_GROUPS.map((group) => ({
    id: group.id,
    items: group.items.map(({ handler, ...row }) => ({
      ...row,
      ...(handler ? { onAction: handlers[handler] } : {}),
    })),
  }));
}
