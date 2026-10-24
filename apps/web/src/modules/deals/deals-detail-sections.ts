import type { FieldDefinition, ModuleMetadata, RecordData } from "@crm/core/records";
import type { BusinessCardField } from "@/components/records/detail/business-card";
import type { DetailFieldEntry, DetailSection } from "@/components/records/detail/details-card";

function visible(field: FieldDefinition, record: RecordData) {
  return field.views.view && Object.hasOwn(record.fields, field.apiName);
}

/** Field order for Deals business card: Deal Owner, Stage, Probability (%), Expected Revenue, Closing Date. */
export const DEALS_BUSINESS_CARD_FIELDS = [
  "Owner",
  "Stage",
  "Probability",
  "Expected_Revenue",
  "Closing_Date",
] as const;

/**
 * Builds business card fields in the order supplied by service metadata,
 * falling back to DEALS_BUSINESS_CARD_FIELDS when metadata businessCardFields is empty.
 */
export function buildDealsBusinessCardFields(
  module: ModuleMetadata,
  record: RecordData,
): BusinessCardField[] {
  const cardNames =
    module.businessCardFields.length > 0 ? module.businessCardFields : DEALS_BUSINESS_CARD_FIELDS;

  return cardNames.flatMap((name) => {
    const field = module.fields.find((candidate) => candidate.apiName === name);
    return field && visible(field, record) ? [{ field, value: record.fields[name] ?? null }] : [];
  });
}

/**
 * Builds detail sections from service layout (Deal Information, Description Information).
 * Filters out Deal Image layout section.
 * Does not include address grouping or status ribbon.
 */
export function buildDealsDetailSections(
  module: ModuleMetadata,
  record: RecordData,
): DetailSection[] {
  const byName = new Map(module.fields.map((field) => [field.apiName, field]));

  return module.layout
    .filter((section) => section.label !== "Deal Image")
    .map((section) => {
      const fields: DetailFieldEntry[] = [];
      section.columns.forEach((column, index) => {
        for (const name of column) {
          const field = byName.get(name);
          if (!field?.views.view) continue;
          if (!visible(field, record)) continue;
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
            value: record.fields[name] ?? null,
            auditTimestamp: typeof timestamp === "string" ? timestamp : undefined,
          });
        }
      });
      return { title: section.label, fields };
    });
}
