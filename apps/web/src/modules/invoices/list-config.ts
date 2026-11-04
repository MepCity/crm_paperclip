import type { ModuleListScreenConfig } from "@/components/records/list/module-list-screen";
import {
  moduleCreatePath,
  moduleListCustomPath,
  moduleListDefaultPath,
  moduleRecordPath,
} from "@/lib/crm-paths";
import { invoicesFilterGroups } from "./list-filters";

export const INVOICES_LIST_CURRENCY_CODE = "TRY";
export const INVOICES_EMPTY_HEADING = "Create Invoices";
export const INVOICES_EMPTY_TEXT = "No Invoices found.";
export const INVOICES_EMPTY_DESCRIPTION =
  "Invoices are bills issued by a seller for goods or services at the time of delivery.";

/** Interim: Sort By contents were not observable (empty reference list); field labels from metadata. */
export const INVOICES_SORT_FIELD_LABELS = [
  "Account Name",
  "Contact Name",
  "Created Time",
  "Due Date",
  "Grand Total",
  "Invoice Date",
  "Invoice Number",
  "Invoice Owner",
  "Modified Time",
  "Status",
  "Subject",
] as const;

export const invoicesListPageConfig: ModuleListScreenConfig = {
  module: "Invoices",
  linkField: "Subject",
  linkFieldLabel: "Subject",
  pluralLabel: "Invoices",
  singularLabel: "Invoice",
  createLabel: "Create Invoice",
  filterTitle: "Filter Invoices by",
  filterGroups: invoicesFilterGroups,
  sortFieldLabels: INVOICES_SORT_FIELD_LABELS,
  pinnedViews: ["All Invoices"],
  emptyState: { heading: INVOICES_EMPTY_HEADING, text: INVOICES_EMPTY_DESCRIPTION },
  badgeColumn: false,
  selectionTags: true,
  inventory: {
    actions: [
      { id: "mass-transfer", label: "Mass Transfer" },
      { id: "mass-delete", label: "Mass Delete" },
      { id: "mass-update", label: "Mass Update" },
      { id: "tags", label: "Manage Tags" },
      { id: "export", label: "Export Invoices" },
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
