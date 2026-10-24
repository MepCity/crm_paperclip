import type { FieldDefinition, ModuleMetadata, RecordData } from "@crm/core/records";
import type { BusinessCardField } from "@/components/records/detail/business-card";
import type { DetailFieldEntry, DetailSection } from "@/components/records/detail/details-card";
import { addressSubfieldApiNames } from "@/lib/records/composite-address";

function visible(field: FieldDefinition, record: RecordData) {
  return field.views.view && Object.hasOwn(record.fields, field.apiName);
}
function label(field: FieldDefinition): FieldDefinition {
  return field.apiName === "Full_Name" ? { ...field, label: "Contact Name" } : field;
}
export function buildContactsBusinessCardFields(
  module: ModuleMetadata,
  record: RecordData,
): BusinessCardField[] {
  return module.businessCardFields.flatMap((name) => {
    const field = module.fields.find((candidate) => candidate.apiName === name);
    if (!field || !visible(field, record)) return [];
    const value = record.fields[name] ?? null;
    const isPhone = name === "Phone";
    const hasValue = value !== null && value !== undefined && value !== "";
    return [
      {
        field: label(field),
        value,
        ...(isPhone && hasValue ? { callAction: true } : {}),
      },
    ];
  });
}

/** Interim: match the shared Leads comma-separated composite until detail evidence exists. */
export function formatContactsAddress(record: RecordData, prefix: "Mailing" | "Other"): string {
  return ["Country", "Flat_House_No_Building_Apartment_Name", "Street", "City", "State", "Zip"]
    .flatMap((part) => {
      const value = record.fields[`${prefix}_${part}`];
      return typeof value === "string" && value.length > 0 ? [value] : [];
    })
    .join(", ");
}
export function buildContactsDetailSections(
  module: ModuleMetadata,
  record: RecordData,
): DetailSection[] {
  const byName = new Map(module.fields.map((field) => [field.apiName, field]));
  const activeRecord = {
    ...record,
    fields: Object.fromEntries(
      Object.entries(record.fields).filter(([name]) => byName.get(name)?.views.view),
    ),
  };
  const addressParts = new Set(
    ["Mailing", "Other"].flatMap((prefix) => [
      ...addressSubfieldApiNames(`${prefix}_Address`),
      `${prefix}_Code`,
    ]),
  );
  return module.layout
    .filter((section) => section.label !== "Contact Image")
    .map((section) => {
      const fields: DetailFieldEntry[] = [];
      section.columns.forEach((column, index) => {
        for (const name of column) {
          const field = byName.get(name);
          if (!field?.views.view) continue;
          const prefix =
            name === "Mailing_Address" ? "Mailing" : name === "Other_Address" ? "Other" : null;
          if (section.label === "Address Information" && !prefix && addressParts.has(name))
            continue;
          if (!prefix && !visible(field, record)) continue;
          const timestamp =
            name === "Created_By"
              ? record.fields.Created_Time
              : name === "Modified_By"
                ? record.fields.Modified_Time
                : undefined;
          const value = prefix
            ? formatContactsAddress(activeRecord, prefix) || null
            : (record.fields[name] ?? null);
          const isPhone =
            section.label === "Contact Information" && name === "Phone" && index === 0;
          const hasValue = value !== null && value !== undefined && value !== "";
          fields.push({
            column:
              section.label === "Description Information" ? "full" : index === 0 ? "left" : "right",
            field: label(field),
            value,
            auditTimestamp: typeof timestamp === "string" ? timestamp : undefined,
            ...(isPhone && hasValue ? { callAction: true } : {}),
          });
        }
      });
      return { title: section.label, fields };
    });
}
