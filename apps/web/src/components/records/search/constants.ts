import type { FieldDataType, ModuleApiName, SortSpec } from "@crm/core/records";
import type { ModuleKey } from "@/components/ui/later-module";
import { isModuleRegistered, moduleScreens, resolveModuleLaterKey } from "@/modules/registry";
import type { ModuleScreenDefinition } from "@/modules/types";

export interface DocumentedModuleFilterItem {
  id: string;
  moduleApiName: ModuleApiName;
  label: string;
  isRegistered: boolean;
  laterModule?: ModuleKey;
}

export interface DocumentedModuleFilterSpec {
  id: string;
  moduleApiName: ModuleApiName;
  label: string;
}

export const DOCUMENTED_MODULE_FILTER_SPECS: readonly DocumentedModuleFilterSpec[] = [
  { id: "S-31.1", moduleApiName: "Contacts", label: "Contacts" },
  { id: "S-31.2", moduleApiName: "Accounts", label: "Accounts" },
  { id: "S-31.3", moduleApiName: "Tasks", label: "Tasks" },
  { id: "S-31.4", moduleApiName: "Leads", label: "Leads" },
  { id: "S-31.5", moduleApiName: "Deals", label: "Deals" },
  { id: "S-31.6", moduleApiName: "Meetings", label: "Meetings" },
  { id: "S-31.7", moduleApiName: "Calls", label: "Calls" },
  { id: "S-31.8", moduleApiName: "Products", label: "Products" },
];

export function getDocumentedModuleFilterItems(
  definitions: readonly ModuleScreenDefinition[] = moduleScreens,
): readonly DocumentedModuleFilterItem[] {
  const documented = DOCUMENTED_MODULE_FILTER_SPECS.map((item) => {
    const isRegistered = isModuleRegistered(item.moduleApiName, definitions);
    return {
      ...item,
      isRegistered,
      laterModule: isRegistered ? undefined : resolveModuleLaterKey(item.moduleApiName),
    };
  });

  const documentedApiNames = new Set<string>(
    DOCUMENTED_MODULE_FILTER_SPECS.map((s) => s.moduleApiName),
  );
  const extraItems: DocumentedModuleFilterItem[] = [];
  for (const def of definitions) {
    if (!documentedApiNames.has(def.apiName)) {
      extraItems.push({
        id: `custom-${def.apiName}`,
        moduleApiName: def.apiName,
        label: def.pluralLabel ?? def.apiName,
        isRegistered: true,
      });
    }
  }

  return [...documented, ...extraItems];
}

export const DOCUMENTED_MODULE_FILTER_ITEMS: readonly DocumentedModuleFilterItem[] =
  getDocumentedModuleFilterItems();

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
