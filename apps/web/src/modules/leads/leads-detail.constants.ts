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

/**
 * Address sub-fields in form order for the composite Address detail row.
 * Reference composite formatting was not observed; non-empty parts join with ", ".
 */
export const LEADS_ADDRESS_COMPOSITE_FIELD_ORDER: readonly string[] = [
  "Country",
  "Flat_House_No_Building_Apartment_Name",
  "Street",
  "City",
  "State",
  "Zip_Code",
];

/** Layout sections omitted from the Overview tab body. */
export const LEADS_OVERVIEW_SKIPPED_SECTIONS: ReadonlySet<string> = new Set([
  LEADS_DETAIL_SECTION_LABELS.leadImage,
]);
