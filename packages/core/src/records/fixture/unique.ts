import { ConflictError } from "../../errors";
import type { FieldDefinition, FieldValue, RecordData } from "../contract";

const uniqueComparableKey = (field: FieldDefinition, value: FieldValue): string | null => {
  if (value == null) return null;
  if (typeof value === "string") {
    return field.dataType === "email" ? value.toLowerCase() : value;
  }
  if (typeof value === "object" && "id" in value && typeof value.id === "string") return value.id;
  return String(value);
};

/** Rejects duplicate values for metadata `unique` fields within one module store. */
export function assertUniqueFieldValues(
  fields: readonly FieldDefinition[],
  records: Iterable<RecordData>,
): void {
  const uniqueFields = fields.filter((field) => field.unique);
  if (!uniqueFields.length) return;
  for (const field of uniqueFields) {
    const seen = new Map<string, string>();
    for (const record of records) {
      const value = record.fields[field.apiName] ?? null;
      const key = uniqueComparableKey(field, value);
      if (key === null) continue;
      const existing = seen.get(key);
      if (existing && existing !== record.id)
        throw new ConflictError(`${field.label} is already in use.`);
      seen.set(key, record.id);
    }
  }
}

export function projectRecordsWithOverrides(
  records: Map<string, RecordData>,
  overrides: ReadonlyMap<string, Record<string, FieldValue>>,
): RecordData[] {
  const projected = [...records.values()].map((record) => {
    const patch = overrides.get(record.id);
    if (!patch) return record;
    return { id: record.id, fields: { ...record.fields, ...patch } };
  });
  for (const [id, fields] of overrides) {
    if (!records.has(id)) projected.push({ id, fields });
  }
  return projected;
}
