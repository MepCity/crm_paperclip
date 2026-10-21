import type { ModuleListScreenConfig } from "@/components/records/list/module-list-screen";
import {
  moduleCreatePath,
  moduleListCustomPath,
  moduleListDefaultPath,
  moduleRecordPath,
} from "@/lib/crm-paths";
import { campaignsFilterGroups } from "./list-filters";

export const CAMPAIGNS_LIST_CURRENCY_CODE = "TRY";
export const CAMPAIGNS_EMPTY_TEXT = "No Campaigns found.";

/** Interim: Sort By contents were not opened; use field dictionary labels like Accounts. */
export const CAMPAIGNS_SORT_FIELD_LABELS = [
  "Actual Cost",
  "Budgeted Cost",
  "Campaign Name",
  "Campaign Owner",
  "Connected To",
  "Created By",
  "Created Time",
  "End Date",
  "Expected Response",
  "Expected Revenue",
  "Last Activity Time",
  "Modified By",
  "Modified Time",
  "Numbers sent",
  "Parent Campaign",
  "Start Date",
  "Status",
  "Tag",
  "Type",
] as const;

export const campaignsListPageConfig: ModuleListScreenConfig = {
  module: "Campaigns",
  linkField: "Campaign_Name",
  linkFieldLabel: "Campaign Name",
  pluralLabel: "Campaigns",
  singularLabel: "Campaign",
  createLabel: "Create Campaign",
  filterTitle: "Filter Campaigns by",
  filterGroups: campaignsFilterGroups,
  sortFieldLabels: CAMPAIGNS_SORT_FIELD_LABELS,
  pinnedViews: ["All Campaigns"],
  badgeColumn: false,
  inventory: {
    actions: [
      { id: "mass-transfer", label: "Mass Transfer" },
      { id: "mass-delete", label: "Mass Delete" },
      { id: "mass-update", label: "Mass Update" },
      { id: "tags", label: "Manage Tags", laterModule: "M6" },
      { id: "drafts", label: "Drafts" },
      { id: "client-script", label: "Create Client Script", laterModule: "M11" },
      { id: "export", label: "Export Campaigns", laterModule: "M6" },
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
