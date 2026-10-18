import type { FieldDefinition, ModuleMetadata, RecordData } from "@crm/core/records";

/** Synthetic Solutions metadata, restricted to what the definition tests exercise. */
export function solutionField(
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

export function solutionRecord(fields: RecordData["fields"] = {}): RecordData {
  return { id: "sample-solution", fields };
}

export function solutionMetadata(fields: readonly FieldDefinition[] = []): ModuleMetadata {
  return {
    apiName: "Solutions",
    singularLabel: "Solution",
    pluralLabel: "Solutions",
    fields,
    businessCardFields: [],
    layout: [],
  };
}
