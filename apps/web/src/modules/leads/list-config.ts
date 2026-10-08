import type { ModuleApiName } from "@crm/core/records";
import {
  moduleCreatePath,
  moduleListCustomPath,
  moduleListDefaultPath,
  moduleRecordPath,
} from "@/lib/crm-paths";
import { leadsFilterGroups } from "./list-filters";

export const LEADS_MODULE: ModuleApiName = "Leads";

/** Non-sortable Leads field API names from list-views.md › Sorting. */
export const LEADS_NON_SORTABLE_FIELDS = new Set([
  "Description",
  "Tag",
  "Record_Image",
  "Change_Log_Time__s",
  "Last_Enriched_Time__s",
  "Enrich_Status__s",
  "Address",
  "Coordinates",
  "Connected_To__s",
]);

export const leadsListPageConfig = {
  module: LEADS_MODULE,
  linkField: "Full_Name",
  pluralLabel: "Leads",
  createLabel: "Create Lead",
  filterTitle: "Filter Leads by",
  filterGroups: leadsFilterGroups,
  nonSortableFields: LEADS_NON_SORTABLE_FIELDS,
  paths: {
    defaultList: moduleListDefaultPath,
    customList: moduleListCustomPath,
    record: moduleRecordPath,
    create: moduleCreatePath,
  },
};
