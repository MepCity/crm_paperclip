import type { ModuleApiName } from "@crm/core/records";
import {
  moduleCreatePath,
  moduleListCustomPath,
  moduleListDefaultPath,
  moduleRecordPath,
} from "@/lib/crm-paths";
import { leadsFilterGroups } from "./list-filters";

export const LEADS_MODULE: ModuleApiName = "Leads";

/** Sort By field labels, in the screen order recorded in list-views.md › Sorting. */
export const LEADS_SORT_FIELD_LABELS = [
  "Address - City",
  "Address - Country / Region",
  "Address - Flat / House No./ Building / Apartment Name",
  "Address - Latitude",
  "Address - Longitude",
  "Address - State / Province",
  "Address - Street Address",
  "Address - Zip / Postal Code",
  "Annual Revenue",
  "Company",
  "Created By",
  "Created Time",
  "Distance",
  "Email",
  "Email Opt Out",
  "Fax",
  "First Name",
  "Industry",
  "Last Activity Time",
  "Last Name",
  "Lead Conversion Time",
  "Lead Name",
  "Lead Owner",
  "Lead Source",
  "Lead Status",
  "Mobile",
  "Modified By",
  "Modified Time",
  "No. of Employees",
  "Phone",
  "Rating",
  "Salutation",
  "Secondary Email",
  "Skype ID",
  "Title",
  "Twitter",
  "Unsubscribed Mode",
  "Unsubscribed Time",
  "Website",
] as const;

export const leadsListPageConfig = {
  module: LEADS_MODULE,
  linkField: "Full_Name",
  // The reference names the record title field "Lead Name" in Sort By.
  linkFieldLabel: "Lead Name",
  pluralLabel: "Leads",
  createLabel: "Create Lead",
  filterTitle: "Filter Leads by",
  filterGroups: leadsFilterGroups,
  sortFieldLabels: LEADS_SORT_FIELD_LABELS,
  paths: {
    defaultList: moduleListDefaultPath,
    customList: moduleListCustomPath,
    record: moduleRecordPath,
    create: moduleCreatePath,
  },
};
