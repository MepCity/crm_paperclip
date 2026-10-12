import type { FieldDefinition, ModuleMetadata, RecordData } from "@crm/core/records";

/** Synthetic metadata, restricted to fields exercised by the definition tests. */
export function accountField(
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

export function accountRecord(fields: RecordData["fields"] = {}): RecordData {
  return { id: "sample-account", fields };
}

export function accountMetadata(fields: readonly FieldDefinition[] = []): ModuleMetadata {
  return {
    apiName: "Accounts",
    singularLabel: "Account",
    pluralLabel: "Accounts",
    fields,
    businessCardFields: [],
    layout: [],
  };
}
