import type { FieldDefinition } from "@crm/core/records";

// Interim: composites remain page/form edits; system fields are never writable.
const excluded = new Set([
  "Address",
  "Full_Name",
  "Created_By",
  "Modified_By",
  "Created_Time",
  "Modified_Time",
]);
export function isLeadInlineEditable(field: FieldDefinition): boolean {
  return (
    field.views.edit &&
    !field.readOnly &&
    !excluded.has(field.apiName) &&
    !["profileimage", "lookup", "multi_module_lookup", "datetime", "bigint"].includes(
      field.dataType,
    )
  );
}
