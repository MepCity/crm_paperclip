import type { ModuleApiName } from "@crm/core/records";

/** Leads-only detail rules (Interim). Field API names stay here; screens stay module-agnostic. */
export const LEADS_MODULE: ModuleApiName = "Leads";

/** Field API names referenced by Leads detail helpers. */
export const LEADS_DETAIL_FIELD_API_NAMES = {
  Full_Name: "Full_Name",
  Company: "Company",
  Modified_Time: "Modified_Time",
  Created_Time: "Created_Time",
  Created_By: "Created_By",
  Modified_By: "Modified_By",
  Address: "Address",
} as const;

/** Overview detail section labels from the Standard layout. */
export const LEADS_DETAIL_SECTION_LABELS = {
  leadInformation: "Lead Information",
  addressInformation: "Address Information",
  descriptionInformation: "Description Information",
  leadImage: "Lead Image",
} as const;

/** Detail label overrides for Leads (metadata differs from rendered UI). */
export const LEADS_DETAIL_FIELD_LABELS: Readonly<Record<string, string>> = {
  [LEADS_DETAIL_FIELD_API_NAMES.Full_Name]: "Lead Name",
};

/** @deprecated Use `COMPOSITE_ADDRESS_DISPLAY_SUFFIXES` from `composite-address`. */
export { COMPOSITE_ADDRESS_DISPLAY_SUFFIXES as LEADS_ADDRESS_COMPOSITE_FIELD_ORDER } from "./composite-address";

/** Layout sections omitted from the Overview tab body. */
export const LEADS_OVERVIEW_SKIPPED_SECTIONS: ReadonlySet<string> = new Set([
  LEADS_DETAIL_SECTION_LABELS.leadImage,
]);
