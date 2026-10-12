import type { FieldDefinition, FieldValue, RecordData, RecordId } from "@crm/core/records";

export function valuesConflict(values: readonly FieldValue[]): boolean {
  const keys = values.map(fieldValueKey);
  const nonEmpty = keys.filter((key) => key !== "");
  if (nonEmpty.length <= 1) return false;
  return new Set(nonEmpty).size > 1;
}

export function fieldValueKey(value: FieldValue | undefined): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return JSON.stringify(value);
  return JSON.stringify(value);
}

export function isMergeValueSelectable(field: FieldDefinition): boolean {
  return !field.readOnly;
}

export function comparisonFields(
  fields: readonly FieldDefinition[],
  records: readonly RecordData[],
): FieldDefinition[] {
  return fields.filter((field) => {
    if (field.apiName === "id") return false;
    return records.some((record) => fieldValueKey(record.fields[field.apiName]) !== "");
  });
}

export function buildMergeValues(
  fields: readonly FieldDefinition[],
  records: readonly RecordData[],
  choices: Readonly<Record<string, RecordId>>,
): Record<string, FieldValue> {
  const byId = new Map(records.map((record) => [record.id, record]));
  const values: Record<string, FieldValue> = {};
  for (const field of fields) {
    if (!isMergeValueSelectable(field)) continue;
    const sourceId = choices[field.apiName];
    if (!sourceId) continue;
    const record = byId.get(sourceId);
    if (!record) continue;
    const value = record.fields[field.apiName];
    if (value !== undefined) values[field.apiName] = value;
  }
  return values;
}

export function defaultFieldChoices(
  fields: readonly FieldDefinition[],
  records: readonly RecordData[],
  masterId: RecordId,
): Record<string, RecordId> {
  const choices: Record<string, RecordId> = {};
  for (const field of fields) {
    if (!isMergeValueSelectable(field)) continue;
    const masterValue = records.find((record) => record.id === masterId)?.fields[field.apiName];
    if (fieldValueKey(masterValue) !== "") {
      choices[field.apiName] = masterId;
      continue;
    }
    const fallback = records.find((record) => fieldValueKey(record.fields[field.apiName]) !== "");
    if (fallback) choices[field.apiName] = fallback.id;
  }
  return choices;
}
