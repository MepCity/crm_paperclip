import type { FieldDefinition, ModuleMetadata, RecordData } from "@crm/core/records";

/** Synthetic Campaigns metadata, restricted to what the definition tests exercise. */
export function campaignField(
  apiName: string,
  extra: Partial<FieldDefinition> = {},
): FieldDefinition {
  return {
    apiName,
    label: apiName,
    dataType: "text",
    required: false,
    readOnly: false,
    unique: false,
    massUpdate: false,
    views: { view: true, create: true, edit: true, quickCreate: false },
    ...extra,
  };
}

export function campaignRecord(fields: RecordData["fields"] = {}): RecordData {
  return { id: "sample-campaign", fields };
}

export function campaignMetadata(fields: readonly FieldDefinition[] = []): ModuleMetadata {
  return {
    apiName: "Campaigns",
    singularLabel: "Campaign",
    pluralLabel: "Campaigns",
    fields,
    businessCardFields: [],
    layout: [],
  };
}
