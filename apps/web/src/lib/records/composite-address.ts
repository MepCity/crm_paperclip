import type { FieldValue } from "@crm/core/records";

/** Sub-fields joined for composite address display (excludes coordinates). */
export const COMPOSITE_ADDRESS_DISPLAY_SUFFIXES: readonly string[] = [
  "Country",
  "Flat_House_No_Building_Apartment_Name",
  "Street",
  "City",
  "State",
  "Zip_Code",
];

export const COMPOSITE_ADDRESS_COORDINATE_SUFFIXES: readonly string[] = ["Latitude", "Longitude"];

/** API-name prefix for address sub-fields under a composite parent. */
export function addressFieldPrefix(parentApiName: string): string {
  if (parentApiName === "Address") return "";
  if (parentApiName.endsWith("_Address")) {
    return parentApiName.slice(0, -"Address".length);
  }
  return `${parentApiName}_`;
}

export function addressSubfieldApiName(parentApiName: string, suffix: string): string {
  const prefix = addressFieldPrefix(parentApiName);
  const part = suffix === "Zip_Code" && parentApiName !== "Address" ? "Zip" : suffix;
  return prefix ? `${prefix}${part}` : part;
}

export function addressSubfieldApiNames(parentApiName: string): readonly string[] {
  return [
    ...COMPOSITE_ADDRESS_DISPLAY_SUFFIXES.map((suffix) =>
      addressSubfieldApiName(parentApiName, suffix),
    ),
    ...COMPOSITE_ADDRESS_COORDINATE_SUFFIXES.map((suffix) =>
      addressSubfieldApiName(parentApiName, suffix),
    ),
  ];
}

export function formatCompositeAddressFromFieldList(
  fields: Readonly<Record<string, FieldValue>>,
  orderedApiNames: readonly string[],
): string {
  const parts: string[] = [];
  for (const apiName of orderedApiNames) {
    const value = fields[apiName];
    if (value === null || value === undefined || value === "") continue;
    parts.push(String(value));
  }
  return parts.join(", ");
}

/** Non-empty sub-field values join with ", " (interim rule shared by Leads and Contacts). */
export function formatCompositeAddress(
  parentApiName: string,
  fields: Readonly<Record<string, FieldValue>>,
  displayFieldApiNames?: readonly string[],
): string {
  const apiNames =
    displayFieldApiNames ??
    COMPOSITE_ADDRESS_DISPLAY_SUFFIXES.map((suffix) =>
      addressSubfieldApiName(parentApiName, suffix),
    );
  return formatCompositeAddressFromFieldList(fields, apiNames);
}
