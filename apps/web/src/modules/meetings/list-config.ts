import type { ModuleListScreenConfig } from "@/components/records/list/module-list-screen";
import {
  moduleCreatePath,
  moduleListCustomPath,
  moduleListDefaultPath,
  moduleRecordPath,
} from "@/lib/crm-paths";
import { meetingsFilterGroups } from "./list-filters";
import { renderMeetingQuickCreate } from "./meeting-quick-create";

export const MEETINGS_LIST_CURRENCY_CODE = "TRY";

/** Interim: Sort By contents were not opened; use field dictionary labels like Leads, Contacts, Accounts. */
export const MEETINGS_SORT_FIELD_LABELS = [
  "All day",
  "Check-In Address",
  "Check-In By",
  "Check-In City",
  "Check-In Comment",
  "Check-In Country",
  "Check-In State",
  "Check-In Sub-Locality",
  "Check-In Time",
  "Checked In Status",
  "Contact Name",
  "Created By",
  "Created Time",
  "Description",
  "From",
  "Host",
  "Last Activity Time",
  "Latitude",
  "Location",
  "Longitude",
  "Meeting Venue",
  "Modified By",
  "Modified Time",
  "Participants",
  "Participants Reminder",
  "Provider",
  "Record Id",
  "Related To",
  "Reminder",
  "Repeat",
  "Tag",
  "Title",
  "To",
  "Zip Code",
] as const;

/**
 * View type tiles drawn for Meetings (ML-05 – ML-09): List, Kanban, Chart, two horizontal bars
 * (Cards presentation). Timeline and Sheet are absent; the down chevron is rendered trailing.
 */
export const MEETINGS_VIEW_TYPE_TILE_IDS = ["list", "split", "chart", "cards"] as const;

export const meetingsListPageConfig: ModuleListScreenConfig = {
  module: "Events",
  linkField: "Event_Title",
  linkFieldLabel: "Title",
  pluralLabel: "Meetings",
  singularLabel: "Meeting",
  createLabel: "Create Meeting",
  quickCreate: renderMeetingQuickCreate,
  filterTitle: "Filter Meetings by",
  filterGroups: meetingsFilterGroups,
  sortFieldLabels: MEETINGS_SORT_FIELD_LABELS,
  pinnedViews: ["All Meetings"],
  viewMenuSearch: true,
  viewTypeTileIds: MEETINGS_VIEW_TYPE_TILE_IDS,
  badgeColumn: false,
  inventory: {
    actions: [
      { id: "mass-transfer", label: "Mass Transfer" },
      { id: "mass-delete", label: "Mass Delete" },
      { id: "mass-update", label: "Mass Update" },
      { id: "tags", label: "Manage Tags", laterModule: "M6" },
      { id: "export", label: "Export Meetings", laterModule: "M6" },
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
