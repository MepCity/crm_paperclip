import type { FieldDefinition } from "@crm/core/records";
import { isLeadInlineEditable } from "../leads/leads-inline-edit";
import { SOLUTIONS_FORM_SYSTEM_FIELDS } from "./solutions-form-rules";

/** Shared editing policy; system fields and autonumber are never editable inline. */
export function isSolutionInlineEditable(field: FieldDefinition): boolean {
  return (
    !(SOLUTIONS_FORM_SYSTEM_FIELDS as readonly string[]).includes(field.apiName) &&
    isLeadInlineEditable(field)
  );
}
