import type { FieldDefinition, FieldValue, ModuleMetadata, RecordInput } from "@crm/core/records";

const CLONE_EXCLUDED_FIELD_NAMES = new Set([
  "Record_Image",
  "Created_By",
  "Created_Time",
  "Modified_By",
  "Modified_Time",
]);

function isCloneableField(field: FieldDefinition): boolean {
  if (!field.views.create) return false;
  if (field.readOnly) return false;
  if (field.dataType === "profileimage") return false;
  if (CLONE_EXCLUDED_FIELD_NAMES.has(field.apiName)) return false;
  return true;
}

/** Maps a source record into create-form field values for cloning. */
export function buildCloneInput(metadata: ModuleMetadata, source: RecordInput): RecordInput {
  const output: Record<string, FieldValue> = {};
  for (const field of metadata.fields) {
    if (!isCloneableField(field)) continue;
    const value = source[field.apiName];
    if (value !== undefined) output[field.apiName] = value;
  }
  return output;
}
