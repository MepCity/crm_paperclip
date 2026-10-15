import type { ModuleListScreenConfig } from "@/components/records/list/module-list-screen";
import {
  moduleCreatePath,
  moduleListCustomPath,
  moduleListDefaultPath,
  moduleRecordPath,
} from "@/lib/crm-paths";
import { callsFilterGroups } from "./list-filters";

export const CALLS_LIST_CURRENCY_CODE = "TRY";

/** Interim: Sort By contents were not opened; use field dictionary labels like Leads, Contacts, Accounts. */
export const CALLS_SORT_FIELD_LABELS = [
  "CTI Entry",
  "Call Agenda",
  "Call Duration",
  "Call Duration (in seconds)",
  "Call Owner",
  "Call Purpose",
  "Call Result",
  "Call Start Time",
  "Call Type",
  "Caller ID",
  "Contact Name",
  "Created By",
  "Created Time",
  "Description",
  "Dialled Number",
  "Last Activity Time",
  "Modified By",
  "Modified Time",
  "Outgoing Call Status",
  "Record Id",
  "Related To",
  "Reminder",
  "Scheduled in CRM",
  "Subject",
  "Tag",
  "Voice Recording",
] as const;

/**
 * View type tiles drawn for Calls (CL-05 – CL-09): List, Kanban, Chart, two horizontal bars
 * (Cards presentation). Timeline and Sheet are absent; the down chevron is rendered trailing.
 */
export const CALLS_VIEW_TYPE_TILE_IDS = ["list", "split", "chart", "cards"] as const;

export const callsListPageConfig: ModuleListScreenConfig = {
  module: "Calls",
  linkField: "Subject",
  linkFieldLabel: "Subject",
  pluralLabel: "Calls",
  singularLabel: "Call",
  createLabel: "Create Call",
  filterTitle: "Filter Calls by",
  filterGroups: callsFilterGroups,
  sortFieldLabels: CALLS_SORT_FIELD_LABELS,
  pinnedViews: ["All Calls"],
  listVariant: "activities",
  viewMenuSearch: true,
  viewTypeTileIds: CALLS_VIEW_TYPE_TILE_IDS,
  badgeColumn: false,
  inventory: {
    actions: [
      { id: "mass-transfer", label: "Mass Transfer" },
      { id: "mass-delete", label: "Mass Delete" },
      { id: "mass-update", label: "Mass Update" },
      { id: "tags", label: "Manage Tags", laterModule: "M6" },
      { id: "export", label: "Export Calls", laterModule: "M6" },
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
