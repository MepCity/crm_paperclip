import type { FieldDefinition, ModuleMetadata } from "@crm/core/records";

/** Mass-update eligible fields in layout order (first occurrence per api name). */
export function massUpdateFieldsInLayoutOrder(metadata: ModuleMetadata): FieldDefinition[] {
  const byName = new Map(metadata.fields.map((field) => [field.apiName, field]));
  const ordered: FieldDefinition[] = [];
  const seen = new Set<string>();
  for (const section of metadata.layout) {
    for (const column of section.columns) {
      for (const name of column.flat()) {
        if (seen.has(name)) continue;
        const field = byName.get(name);
        if (!field?.massUpdate) continue;
        ordered.push(field);
        seen.add(name);
      }
    }
  }
  return ordered;
}
