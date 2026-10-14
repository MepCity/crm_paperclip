import type { FieldDefinition } from "@crm/core/records";

/** Synthetic metadata, restricted to fields exercised by the definition tests. */
export function taskField(apiName: string, extra: Partial<FieldDefinition> = {}): FieldDefinition {
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
