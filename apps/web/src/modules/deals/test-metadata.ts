import type { FieldDefinition, ModuleMetadata, RecordData } from "@crm/core/records";

/** Synthetic metadata, restricted to fields exercised by the definition tests. */
export function dealField(apiName: string, extra: Partial<FieldDefinition> = {}): FieldDefinition {
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

export function dealRecord(fields: RecordData["fields"] = {}): RecordData {
  return { id: "sample-deal", fields };
}

export function dealMetadata(
  fields: readonly FieldDefinition[] = [],
  extra: Partial<ModuleMetadata> = {},
): ModuleMetadata {
  return {
    apiName: "Deals",
    singularLabel: "Deal",
    pluralLabel: "Deals",
    fields,
    businessCardFields: [],
    layout: [],
    ...extra,
  };
}
