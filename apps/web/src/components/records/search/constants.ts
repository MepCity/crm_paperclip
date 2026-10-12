import type { FieldDataType, ModuleApiName, SortSpec } from "@crm/core/records";
import type { ModuleKey } from "@/components/ui/later-module";

export interface DocumentedModuleFilterItem {
  id: string;
  moduleApiName: ModuleApiName;
  label: string;
  isRegistered: boolean;
  laterModule?: ModuleKey;
}

export const DOCUMENTED_MODULE_FILTER_ITEMS: readonly DocumentedModuleFilterItem[] = [
  { id: "S-31.1", moduleApiName: "Contacts", label: "Contacts", isRegistered: true },
  {
    id: "S-31.2",
    moduleApiName: "Accounts",
    label: "Accounts",
    isRegistered: true,
  },
  { id: "S-31.3", moduleApiName: "Tasks", label: "Tasks", isRegistered: false, laterModule: "M5" },
  { id: "S-31.4", moduleApiName: "Leads", label: "Leads", isRegistered: true },
  { id: "S-31.5", moduleApiName: "Deals", label: "Deals", isRegistered: false, laterModule: "M4" },
  {
    id: "S-31.6",
    moduleApiName: "Meetings",
    label: "Meetings",
    isRegistered: false,
    laterModule: "M5",
  },
  { id: "S-31.7", moduleApiName: "Calls", label: "Calls", isRegistered: false, laterModule: "M5" },
  {
    id: "S-31.8",
    moduleApiName: "Products",
    label: "Products",
    isRegistered: false,
    laterModule: "P2",
  },
];

export interface SystemFilterField {
  id: string;
  apiName: string;
  label: string;
  dataType: FieldDataType;
}

export const SYSTEM_FILTER_FIELDS: readonly SystemFilterField[] = [
  { id: "S-32.1", apiName: "Created_By", label: "Created By", dataType: "ownerlookup" },
  { id: "S-32.2", apiName: "Created_Time", label: "Created Date", dataType: "datetime" },
  { id: "S-32.3", apiName: "Modified_Time", label: "Modified Date", dataType: "datetime" },
  { id: "S-32.4", apiName: "Modified_By", label: "Modified By", dataType: "ownerlookup" },
  { id: "S-32.5", apiName: "Owner", label: "Owned By", dataType: "ownerlookup" },
];

export interface SortOptionItem {
  id: string;
  label: string;
  sort: SortSpec;
}

export const SORT_OPTIONS: readonly SortOptionItem[] = [
  { id: "Modified_Time", label: "Modified Time", sort: { field: "Modified_Time", order: "desc" } },
  { id: "Created_Time", label: "Created Time", sort: { field: "Created_Time", order: "desc" } },
  { id: "Owner", label: "Owner", sort: { field: "Owner", order: "asc" } },
  { id: "Created_By", label: "Created By", sort: { field: "Created_By", order: "asc" } },
  { id: "Modified_By", label: "Modified By", sort: { field: "Modified_By", order: "asc" } },
];

export const NOTES_CARD_COLUMNS = [
  { id: "S-25.Notes.1", label: "Note Owner" },
  { id: "S-25.Notes.2", label: "Note Title" },
  { id: "S-25.Notes.3", label: "Note Content" },
  { id: "S-25.Notes.4", label: "Created Time" },
] as const;

export const DEFAULT_PAGE_SIZE = 10;
export const MAX_SELECTED_COLUMNS = 10;
export const REGISTERED_SEARCH_MODULES: readonly ModuleApiName[] = [
  "Contacts",
  "Accounts",
  "Leads",
];
