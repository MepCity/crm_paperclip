import type { ModuleListScreenConfig } from "@/components/records/list/module-list-screen";
import {
  moduleCreatePath,
  moduleListCustomPath,
  moduleListDefaultPath,
  moduleRecordPath,
} from "@/lib/crm-paths";
import { casesFilterGroups } from "./list-filters";

export const CASES_LIST_CURRENCY_CODE = "TRY";
export const CASES_EMPTY_TEXT = "No Cases found.";

/** Interim: Sort By contents were not opened; use field dictionary labels like Accounts. */
export const CASES_SORT_FIELD_LABELS = [
  "Account Name",
  "Case Number",
  "Case Origin",
  "Case Owner",
  "Case Reason",
  "Comments",
  "Connected To",
  "Created By",
  "Created Time",
  "Deal Name",
  "Description",
  "Email",
  "Internal Comments",
  "Last Activity Time",
  "Modified By",
  "Modified Time",
  "No. of comments",
  "Phone",
  "Priority",
  "Product Name",
  "Related To",
  "Reported By",
  "Solution",
  "Status",
  "Subject",
  "Tag",
  "Type",
] as const;

export const casesListPageConfig: ModuleListScreenConfig = {
  module: "Cases",
  linkField: "Subject",
  linkFieldLabel: "Subject",
  pluralLabel: "Cases",
  singularLabel: "Case",
  createLabel: "Create Case",
  filterTitle: "Filter Cases by",
  filterGroups: casesFilterGroups,
  sortFieldLabels: CASES_SORT_FIELD_LABELS,
  pinnedViews: ["All Cases"],
  badgeColumn: false,
  inventory: {
    actions: [
      { id: "mass-transfer", label: "Mass Transfer" },
      { id: "mass-delete", label: "Mass Delete" },
      { id: "mass-update", label: "Mass Update" },
      { id: "tags", label: "Manage Tags" },
      { id: "drafts", label: "Drafts" },
      { id: "mass-email", label: "Mass Email", laterModule: "M10" },
      { id: "approve", label: "Approve Cases", laterModule: "P3" },
      { id: "client-script", label: "Create Client Script", laterModule: "M11" },
      { id: "export", label: "Export Cases" },
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
