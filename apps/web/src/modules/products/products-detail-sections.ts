import type { ModuleMetadata, RecordData } from "@crm/core/records";
import type { BusinessCardField } from "@/components/records/detail/business-card";
import type { DetailFieldEntry, DetailSection } from "@/components/records/detail/details-card";

export function buildProductsBusinessCardFields(
  _module: ModuleMetadata,
  _record: RecordData,
): BusinessCardField[] {
  return [];
}

/**
 * Sections come from the service layout. Vendor_Name is hidden per ADR 0016 §8.
 * 1-column sections and Description Information span the full width.
 */
export function buildProductsDetailSections(
  module: ModuleMetadata,
  record: RecordData,
): DetailSection[] {
  const byName = new Map(module.fields.map((field) => [field.apiName, field]));
  return module.layout.map((section) => {
    const fields: DetailFieldEntry[] = [];
    section.columns.forEach((column, index) => {
      for (const name of column) {
        if (name === "Vendor_Name") continue;
        const field = byName.get(name);
        if (!field?.views.view || !Object.hasOwn(record.fields, name)) continue;
        const timestamp =
          name === "Created_By"
            ? record.fields.Created_Time
            : name === "Modified_By"
              ? record.fields.Modified_Time
              : undefined;
        fields.push({
          column:
            section.columnCount === 1 ||
            section.label === "Description Information" ||
            section.label === "Product Image"
              ? "full"
              : index === 0
                ? "left"
                : "right",
          field,
          value: record.fields[name] ?? null,
          auditTimestamp: typeof timestamp === "string" ? timestamp : undefined,
        });
      }
    });
    return { title: section.label, fields };
  });
}
