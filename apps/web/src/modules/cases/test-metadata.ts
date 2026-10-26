import type { FieldDefinition, ModuleMetadata, RecordData } from "@crm/core/records";

/** Synthetic Cases metadata, restricted to what the definition tests exercise. */
export function caseField(apiName: string, extra: Partial<FieldDefinition> = {}): FieldDefinition {
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

export function caseRecord(fields: RecordData["fields"] = {}): RecordData {
  return { id: "sample-case", fields };
}

export function caseMetadata(fields: readonly FieldDefinition[] = []): ModuleMetadata {
  return {
    apiName: "Cases",
    singularLabel: "Case",
    pluralLabel: "Cases",
    fields,
    businessCardFields: [],
    layout: [],
  };
}
