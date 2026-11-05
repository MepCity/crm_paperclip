import type { FieldDefinition, ModuleMetadata, RecordData } from "@crm/core/records";

/** Synthetic Products metadata, restricted to what the definition tests exercise. */
export function productField(
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

export function productRecord(fields: RecordData["fields"] = {}): RecordData {
  return { id: "sample-product", fields };
}

export function productMetadata(fields: readonly FieldDefinition[] = []): ModuleMetadata {
  return {
    apiName: "Products",
    singularLabel: "Product",
    pluralLabel: "Products",
    fields,
    businessCardFields: [],
    layout: [],
  };
}
