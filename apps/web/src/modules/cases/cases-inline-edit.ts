import type { FieldDefinition } from "@crm/core/records";
import { isLeadInlineEditable } from "../leads/leads-inline-edit";
import { CASES_FORM_SYSTEM_FIELDS } from "./cases-form-rules";

/** Shared editing policy; system fields and autonumber are never editable inline. */
export function isCaseInlineEditable(field: FieldDefinition): boolean {
  return (
    field.apiName !== "Case_Number" &&
    !(CASES_FORM_SYSTEM_FIELDS as readonly string[]).includes(field.apiName) &&
    isLeadInlineEditable(field)
  );
}
