import type { FieldDefinition, ModuleMetadata, RecordData } from "@crm/core/records";
import type { BusinessCardField } from "@/components/records/detail/business-card";
import type { DetailFieldEntry, DetailSection } from "@/components/records/detail/details-card";

function visible(field: FieldDefinition, record: RecordData) {
  return field.views.view && Object.hasOwn(record.fields, field.apiName);
}

/**
 * Builds business card fields in the exact order supplied by service metadata:
 * (Account Owner, Industry, Employees, Annual Revenue, Phone).
 */
export function buildAccountsBusinessCardFields(
  module: ModuleMetadata,
  record: RecordData,
): BusinessCardField[] {
  return module.businessCardFields.flatMap((name) => {
    const field = module.fields.find((candidate) => candidate.apiName === name);
    return field && visible(field, record) ? [{ field, value: record.fields[name] ?? null }] : [];
  });
}

/** Formats composite address for Billing and Shipping address fields. */
export function formatAccountsAddress(record: RecordData, prefix: "Billing" | "Shipping"): string {
  const code = record.fields[`${prefix}_Code`] ?? record.fields[`${prefix}_Zip`];
  const parts = [
    record.fields[`${prefix}_Country`],
    record.fields[`${prefix}_Flat_House_No_Building_Apartment_Name`],
    record.fields[`${prefix}_Street`],
    record.fields[`${prefix}_City`],
    record.fields[`${prefix}_State`],
    code,
  ];
  return parts
    .flatMap((val) => (typeof val === "string" && val.length > 0 ? [val] : []))
    .join(", ");
}

/**
 * Builds detail sections from service layout (Account Information, Address Information, Description Information).
 * Renders composite Billing and Shipping addresses, filtering out unparented subfields.
 */
export function buildAccountsDetailSections(
  module: ModuleMetadata,
  record: RecordData,
): DetailSection[] {
  const byName = new Map(module.fields.map((field) => [field.apiName, field]));
  return module.layout
    .filter((section) => section.label !== "Account Image")
    .map((section) => {
      const fields: DetailFieldEntry[] = [];
      section.columns.forEach((column, index) => {
        for (const name of column) {
          const field = byName.get(name);
          if (!field?.views.view) continue;
          const prefix =
            name === "Billing_Address"
              ? "Billing"
              : name === "Shipping_Address"
                ? "Shipping"
                : null;
          if (section.label === "Address Information" && !prefix) continue;
          if (!prefix && !visible(field, record)) continue;
          const timestamp =
            name === "Created_By"
              ? record.fields.Created_Time
              : name === "Modified_By"
                ? record.fields.Modified_Time
                : undefined;
          fields.push({
            column:
              section.label === "Description Information" ? "full" : index === 0 ? "left" : "right",
            field,
            value: prefix
              ? formatAccountsAddress(record, prefix) || null
              : (record.fields[name] ?? null),
            auditTimestamp: typeof timestamp === "string" ? timestamp : undefined,
          });
        }
      });
      return { title: section.label, fields };
    });
}
