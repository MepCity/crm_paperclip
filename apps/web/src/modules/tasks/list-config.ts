import type { ModuleListScreenConfig } from "@/components/records/list/module-list-screen";
import {
  moduleCreatePath,
  moduleListCustomPath,
  moduleListDefaultPath,
  moduleRecordPath,
} from "@/lib/crm-paths";
import { tasksFilterGroups } from "./list-filters";

export const TASKS_LIST_CURRENCY_CODE = "TRY";

/** Interim: Sort By contents were not opened; use field dictionary labels like Accounts and Deals. */
export const TASKS_SORT_FIELD_LABELS = [
  "Closed Time",
  "Contact Name",
  "Created By",
  "Created Time",
  "Due Date",
  "Last Activity Time",
  "Locked",
  "Modified By",
  "Modified Time",
  "Priority",
  "Related To",
  "Status",
  "Subject",
  "Tag",
  "Task Owner",
] as const;

/** View type tiles drawn for Tasks (TL-05 – TL-11): the Sheet tile is absent. */
export const TASKS_VIEW_TYPE_TILE_IDS = ["list", "split", "chart", "connected", "cards"] as const;

export const tasksListPageConfig: ModuleListScreenConfig = {
  module: "Tasks",
  linkField: "Subject",
  linkFieldLabel: "Subject",
  pluralLabel: "Tasks",
  singularLabel: "Task",
  createLabel: "Create Task",
  filterTitle: "Filter Tasks by",
  filterGroups: tasksFilterGroups,
  sortFieldLabels: TASKS_SORT_FIELD_LABELS,
  pinnedViews: ["All Tasks"],
  listVariant: "activities",
  viewMenuSearch: true,
  viewTypeTileIds: TASKS_VIEW_TYPE_TILE_IDS,
  badgeColumn: false,
  inventory: {
    actions: [
      { id: "mass-transfer", label: "Mass Transfer" },
      { id: "mass-delete", label: "Mass Delete" },
      { id: "mass-update", label: "Mass Update" },
      { id: "tags", label: "Manage Tags", laterModule: "M6" },
      { id: "export", label: "Export Tasks", laterModule: "M6" },
      { id: "print", label: "Print View", submenuIndicator: true },
    ],
  },
  paths: {
    defaultList: moduleListDefaultPath,
    customList: moduleListCustomPath,
    record: moduleRecordPath,
    create: moduleCreatePath,
  },
};
