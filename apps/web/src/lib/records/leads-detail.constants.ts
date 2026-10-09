import type { ModuleApiName } from "@crm/core/records";

/** Leads-only detail rules (Interim). Field API names stay here; screens stay module-agnostic. */
export const LEADS_MODULE: ModuleApiName = "Leads";

/** Detail label overrides for Leads (metadata differs from rendered UI). */
export const LEADS_DETAIL_FIELD_LABELS: Readonly<Record<string, string>> = {
  Full_Name: "Lead Name",
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
export const LEADS_OVERVIEW_SKIPPED_SECTIONS: ReadonlySet<string> = new Set(["Lead Image"]);

/**
 * Previous/next order and cross-page boundaries were not observed in reference captures.
 * Neighbors are the prior and next record on the same loaded list page only; arrows disable at
 * the ends of that page.
 */
export const LEADS_RECORD_NEIGHBOR_SCOPE = "same_page" as const;
