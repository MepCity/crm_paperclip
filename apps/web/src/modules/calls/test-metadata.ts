import type { FieldDefinition, ModuleMetadata, RecordData } from "@crm/core/records";

/** Synthetic metadata, restricted to fields exercised by the definition tests. */
export function callField(apiName: string, extra: Partial<FieldDefinition> = {}): FieldDefinition {
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

export function callRecord(fields: RecordData["fields"] = {}): RecordData {
  return { id: "sample-call", fields };
}

export function callMetadata(
  fields: readonly FieldDefinition[] = [],
  extra: Partial<ModuleMetadata> = {},
): ModuleMetadata {
  return {
    apiName: "Calls",
    singularLabel: "Call",
    pluralLabel: "Calls",
    fields,
    businessCardFields: [],
    layout: [],
    ...extra,
  };
}
