import type { ModuleMetadata, RecordData } from "@crm/core/records";
import type { BusinessCardField } from "@/components/records/detail/business-card";
import type { DetailFieldEntry, DetailSection } from "@/components/records/detail/details-card";
import { lineItemDetailSection } from "@/components/records/line-items";

/** No business card; the header shows the subject only. */
export function buildInvoicesBusinessCardFields(
  _module: ModuleMetadata,
  _record: RecordData,
): BusinessCardField[] {
  return [];
}

/**
 * Sections come from the service layout. The `subform` field (line items) is skipped
 * here: the shared line-item table is drawn by its own component.
 */
export function buildInvoicesDetailSections(
  module: ModuleMetadata,
  record: RecordData,
): DetailSection[] {
  const byName = new Map(module.fields.map((field) => [field.apiName, field]));
  return module.layout.map((section) => {
    if (section.label === "Invoiced Items")
      return lineItemDetailSection(record, "Invoiced_Items", section.label);
    const fields: DetailFieldEntry[] = [];
    section.columns.forEach((column, index) => {
      for (const name of column) {
        const field = byName.get(name);
        if (!field?.views.view || field.dataType === "subform") continue;
        if (!Object.hasOwn(record.fields, name)) continue;
        const timestamp =
          name === "Created_By"
            ? record.fields.Created_Time
            : name === "Modified_By"
              ? record.fields.Modified_Time
              : undefined;
        fields.push({
          column:
            section.columnCount === 1 ||
            section.label === "Terms and Conditions" ||
            section.label === "Description Information"
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
