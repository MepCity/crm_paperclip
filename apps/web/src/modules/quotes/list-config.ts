import type { ModuleListScreenConfig } from "@/components/records/list/module-list-screen";
import {
  moduleCreatePath,
  moduleListCustomPath,
  moduleListDefaultPath,
  moduleRecordPath,
} from "@/lib/crm-paths";
import { quotesFilterGroups } from "./list-filters";

export const QUOTES_LIST_CURRENCY_CODE = "TRY";
export const QUOTES_EMPTY_HEADING = "Manage customer quotes";
export const QUOTES_EMPTY_TEXT = "No Quotes found.";
export const QUOTES_EMPTY_DESCRIPTION =
  "Quotes are agreements to deliver the requested products at an agreed price within a time frame.";

/** Interim: Sort By contents were not observable (empty reference list); field labels from metadata. */
export const QUOTES_SORT_FIELD_LABELS = [
  "Account Name",
  "Contact Name",
  "Created Time",
  "Deal Name",
  "Grand Total",
  "Modified Time",
  "Quote Number",
  "Quote Owner",
  "Quote Stage",
  "Subject",
  "Valid Until",
] as const;

export const quotesListPageConfig: ModuleListScreenConfig = {
  module: "Quotes",
  linkField: "Subject",
  linkFieldLabel: "Subject",
  pluralLabel: "Quotes",
  singularLabel: "Quote",
  createLabel: "Create Quote",
  filterTitle: "Filter Quotes by",
  filterGroups: quotesFilterGroups,
  sortFieldLabels: QUOTES_SORT_FIELD_LABELS,
  pinnedViews: ["All Quotes"],
  emptyState: { heading: QUOTES_EMPTY_HEADING, text: QUOTES_EMPTY_DESCRIPTION },
  badgeColumn: false,
  selectionTags: true,
  inventory: {
    actions: [
      { id: "mass-transfer", label: "Mass Transfer" },
      { id: "mass-delete", label: "Mass Delete" },
      { id: "mass-update", label: "Mass Update" },
      { id: "tags", label: "Manage Tags" },
      { id: "export", label: "Export Quotes" },
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
