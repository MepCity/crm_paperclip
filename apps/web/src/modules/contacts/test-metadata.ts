import type { FieldDefinition, ModuleMetadata, RecordData } from "@crm/core/records";

/** Synthetic metadata, restricted to fields exercised by the definition tests. */
export function contactField(
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
export function contactRecord(fields: RecordData["fields"] = {}): RecordData {
  return { id: "sample-contact", fields };
}
export function contactMetadata(fields: readonly FieldDefinition[] = []): ModuleMetadata {
  return {
    apiName: "Contacts",
    singularLabel: "Contact",
    pluralLabel: "Contacts",
    fields,
    businessCardFields: [],
    layout: [],
  };
}
