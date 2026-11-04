import type { ModuleListScreenConfig } from "@/components/records/list/module-list-screen";
import {
  moduleCreatePath,
  moduleDraftsPath,
  moduleListCustomPath,
  moduleListDefaultPath,
  moduleRecordPath,
} from "@/lib/crm-paths";
import { productsFilterGroups } from "./list-filters";

export const PRODUCTS_LIST_CURRENCY_CODE = "TRY";
export const PRODUCTS_EMPTY_TEXT = "No Products found.";

export const PRODUCTS_SORT_FIELD_LABELS = [
  "Commission Rate",
  "Created By",
  "Created Time",
  "Description",
  "Handler",
  "Last Activity Time",
  "Manufacturer",
  "Modified By",
  "Modified Time",
  "Product Active",
  "Product Category",
  "Product Code",
  "Product Name",
  "Product Owner",
  "Qty Ordered",
  "Quantity in Demand",
  "Quantity in Stock",
  "Reorder Level",
  "Sales End Date",
  "Sales Start Date",
  "Support End Date",
  "Support Start Date",
  "Tag",
  "Tax",
  "Taxable",
  "Unit Price",
  "Usage Unit",
] as const;

export const productsListPageConfig: ModuleListScreenConfig = {
  module: "Products",
  linkField: "Product_Name",
  linkFieldLabel: "Product Name",
  pluralLabel: "Products",
  singularLabel: "Product",
  createLabel: "Create Product",
  filterTitle: "Filter Products by",
  filterGroups: productsFilterGroups,
  sortFieldLabels: PRODUCTS_SORT_FIELD_LABELS,
  pinnedViews: ["All Products"],
  badgeColumn: false,
  selectionTags: true,
  cellCurrencyCode: PRODUCTS_LIST_CURRENCY_CODE,
  rowEditLink: true,
  zeroState: {
    description: "Products refer to goods or services sold or procured by an organization.",
    createLabel: "Create",
    importLabel: "Import",
    importLaterModule: "M6",
  },
  inventory: {
    createItems: [
      { id: "import", label: "Import Products", laterModule: "M6", onAction: () => {} },
    ],
    actions: [
      { id: "mass-transfer", label: "Mass Transfer" },
      { id: "mass-delete", label: "Mass Delete" },
      { id: "mass-update", label: "Mass Update" },
      { id: "tags", label: "Manage Tags" },
      { id: "drafts", label: "Drafts" },
      { id: "export", label: "Export Products" },
      { id: "sheet", label: "Sheet view", laterModule: "P3" },
      {
        id: "print",
        label: "Print View",
        submenuIndicator: true,
        submenu: [
          { id: "print-default", label: "Print Default view", laterModule: "M6" },
          { id: "print-canvas", label: "Print Using Canvas", laterModule: "M6", accent: true },
        ],
      },
    ],
  },
  paths: {
    defaultList: moduleListDefaultPath,
    customList: moduleListCustomPath,
    record: moduleRecordPath,
    create: moduleCreatePath,
    drafts: moduleDraftsPath,
  },
};
