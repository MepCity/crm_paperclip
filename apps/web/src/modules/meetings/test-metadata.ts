import type { FieldDefinition, ModuleMetadata, RecordData } from "@crm/core/records";

/** Synthetic metadata, restricted to fields exercised by the definition tests. */
export function meetingField(
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

export function meetingRecord(fields: RecordData["fields"] = {}): RecordData {
  return { id: "sample-meeting", fields };
}

export function meetingMetadata(
  fields: readonly FieldDefinition[] = [],
  extra: Partial<ModuleMetadata> = {},
): ModuleMetadata {
  return {
    apiName: "Events",
    singularLabel: "Meeting",
    pluralLabel: "Meetings",
    fields,
    businessCardFields: [],
    layout: [],
    ...extra,
  };
}
