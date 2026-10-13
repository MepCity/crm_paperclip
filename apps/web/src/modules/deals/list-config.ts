import type { ModuleListScreenConfig } from "@/components/records/list/module-list-screen";
import {
  moduleCreatePath,
  moduleListCustomPath,
  moduleListDefaultPath,
  moduleRecordPath,
} from "@/lib/crm-paths";
import { dealsFilterGroups } from "./list-filters";

export const DEALS_LIST_CURRENCY_CODE = "TRY";

/** Interim: Sort By contents were not opened; use field dictionary labels like Leads, Contacts, Accounts. */
export const DEALS_SORT_FIELD_LABELS = [
  "Account Name",
  "Amount",
  "Campaign Source",
  "Change Log Time",
  "Closing Date",
  "Connected To",
  "Contact Name",
  "Created By",
  "Created Time",
  "Deal Name",
  "Deal Owner",
  "Description",
  "Expected Revenue",
  "Last Activity Time",
  "Lead Conversion Time",
  "Lead Source",
  "Locked",
  "Modified By",
  "Modified Time",
  "Next Step",
  "Overall Sales Duration",
  "Probability (%)",
  "Reason For Loss",
  "Record Id",
  "Sales Cycle Duration",
  "Stage",
  "Stage Modified Time",
  "Tag",
  "Type",
] as const;

export const dealsListPageConfig: ModuleListScreenConfig = {
  module: "Deals",
  linkField: "Deal_Name",
  linkFieldLabel: "Deal Name",
  pluralLabel: "Deals",
  singularLabel: "Deal",
  createLabel: "Create Deal",
  filterTitle: "Filter Deals by",
  filterGroups: dealsFilterGroups,
  sortFieldLabels: DEALS_SORT_FIELD_LABELS,
  pinnedViews: ["All Deals"],
  inventory: {
    actions: [
      { id: "mass-transfer", label: "Mass Transfer" },
      { id: "mass-delete", label: "Mass Delete" },
      { id: "mass-update", label: "Mass Update" },
      { id: "tags", label: "Manage Tags", laterModule: "M6" },
      { id: "drafts", label: "Drafts" },
      { id: "deduplicate", label: "Deduplicate Deals" },
      { id: "client-script", label: "Create Client Script", laterModule: "M11" },
      { id: "export", label: "Export Deals", laterModule: "M6" },
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
