import type { FieldDefinition } from "@crm/core/records";
import { isLeadInlineEditable } from "../leads/leads-inline-edit";
import { QUOTES_FORM_SYSTEM_FIELDS } from "./quotes-form-rules";

/** Shared editing policy; system, calculated and subform fields are never editable inline. */
export function isQuoteInlineEditable(field: FieldDefinition): boolean {
  return (
    field.dataType !== "subform" &&
    !(QUOTES_FORM_SYSTEM_FIELDS as readonly string[]).includes(field.apiName) &&
    isLeadInlineEditable(field)
  );
}
