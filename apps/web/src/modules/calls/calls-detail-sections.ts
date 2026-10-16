import type { ModuleMetadata, RecordData } from "@crm/core/records";
import type { BusinessCardField } from "@/components/records/detail/business-card";
import type { DetailFieldEntry, DetailSection } from "@/components/records/detail/details-card";
import { referenceModuleSuffix, taskRelatedToSuffix } from "@/modules/tasks/tasks-detail-sections";

/** Field order for the Calls business card: Call For, Related To, Call Type, Call Status, Call Start Time. */
export const CALLS_BUSINESS_CARD_FIELDS = [
  "Who_Id",
  "What_Id",
  "Call_Type",
  "Outgoing_Call_Status",
  "Call_Start_Time",
] as const;

function visible(field: { views: { view: boolean }; apiName: string }, record: RecordData) {
  return field.views.view && Object.hasOwn(record.fields, field.apiName);
}

/**
 * Unlinked module suffix shown after a record link (CD-36, CD-39, CD-42, CD-46):
 * the singular label of the referenced record's module, for Who_Id and What_Id.
 */
export function callReferenceSuffix(
  record: RecordData,
  apiName: "Who_Id" | "What_Id",
): string | undefined {
  return taskRelatedToSuffix({
    ...record,
    fields: { What_Id: record.fields[apiName] ?? null },
  });
}

/** Reference label for the Who_Id field on Calls. */
function callField<T extends { apiName: string; label: string }>(field: T): T {
  return field.apiName === "Who_Id" ? { ...field, label: "Call For" } : field;
}

function callSuffix(name: string, value: unknown): string | undefined {
  return name === "Who_Id" || name === "What_Id" ? referenceModuleSuffix(value) : undefined;
}

/** Business card fields in metadata order, falling back to CALLS_BUSINESS_CARD_FIELDS. */
export function buildCallsBusinessCardFields(
  module: ModuleMetadata,
  record: RecordData,
): BusinessCardField[] {
  const cardNames =
    module.businessCardFields.length > 0 ? module.businessCardFields : CALLS_BUSINESS_CARD_FIELDS;

  return cardNames.flatMap((name) => {
    const field = module.fields.find((candidate) => candidate.apiName === name);
    return field && visible(field, record)
      ? [
          {
            field: callField(field),
            value: record.fields[name] ?? null,
            suffix: callSuffix(name, record.fields[name]),
          },
        ]
      : [];
  });
}

/** Detail sections from the layout metadata (Call Information first); single column. */
export function buildCallsDetailSections(
  module: ModuleMetadata,
  record: RecordData,
): DetailSection[] {
  const byName = new Map(module.fields.map((field) => [field.apiName, field]));

  return module.layout.map((section) => {
    const fields: DetailFieldEntry[] = [];
    for (const column of section.columns) {
      for (const name of column) {
        const field = byName.get(name);
        if (!field || !visible(field, record)) continue;
        const timestamp =
          name === "Created_By"
            ? record.fields.Created_Time
            : name === "Modified_By"
              ? record.fields.Modified_Time
              : undefined;
        fields.push({
          column: "full",
          field: callField(field),
          value: record.fields[name] ?? null,
          suffix: callSuffix(name, record.fields[name]),
          auditTimestamp: typeof timestamp === "string" ? timestamp : undefined,
        });
      }
    }
    return { title: section.label, fields };
  });
}
