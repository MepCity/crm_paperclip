import type { ModuleListScreenConfig } from "@/components/records/list/module-list-screen";
import {
  moduleCreatePath,
  moduleListCustomPath,
  moduleListDefaultPath,
  moduleRecordPath,
} from "@/lib/crm-paths";
import { solutionsFilterGroups } from "./list-filters";

export const SOLUTIONS_LIST_CURRENCY_CODE = "TRY";
export const SOLUTIONS_EMPTY_TEXT = "No Solutions found.";

/** Interim: Sort By contents were not opened; use field dictionary labels like Accounts. */
export const SOLUTIONS_SORT_FIELD_LABELS = [
  "Answer",
  "Comments",
  "Connected To",
  "Created By",
  "Created Time",
  "Last Activity Time",
  "Modified By",
  "Modified Time",
  "No. of comments",
  "Product Name",
  "Published",
  "Question",
  "Solution Number",
  "Solution Owner",
  "Solution Title",
  "Status",
  "Tag",
] as const;

export const solutionsListPageConfig: ModuleListScreenConfig = {
  module: "Solutions",
  linkField: "Solution_Title",
  linkFieldLabel: "Solution Title",
  pluralLabel: "Solutions",
  singularLabel: "Solution",
  createLabel: "Create Solution",
  filterTitle: "Filter Solutions by",
  filterGroups: solutionsFilterGroups,
  sortFieldLabels: SOLUTIONS_SORT_FIELD_LABELS,
  pinnedViews: ["All Solutions"],
  badgeColumn: false,
  selectionTags: true,
  inventory: {
    actions: [
      { id: "mass-transfer", label: "Mass Transfer" },
      { id: "mass-delete", label: "Mass Delete" },
      { id: "mass-update", label: "Mass Update" },
      { id: "tags", label: "Manage Tags" },
      { id: "drafts", label: "Drafts" },
      { id: "client-script", label: "Create Client Script", laterModule: "M11" },
      { id: "export", label: "Export Solutions", laterModule: "M6" },
      { id: "sheet", label: "Sheet view", laterModule: "P3" },
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
