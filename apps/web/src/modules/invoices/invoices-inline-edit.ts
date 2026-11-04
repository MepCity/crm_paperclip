import type { FieldDefinition } from "@crm/core/records";
import { isLeadInlineEditable } from "../leads/leads-inline-edit";
import { INVOICES_FORM_SYSTEM_FIELDS } from "./invoices-form-rules";

/** Shared editing policy; system, calculated and subform fields are never editable inline. */
export function isInvoiceInlineEditable(field: FieldDefinition): boolean {
  return (
    field.dataType !== "subform" &&
    !(INVOICES_FORM_SYSTEM_FIELDS as readonly string[]).includes(field.apiName) &&
    isLeadInlineEditable(field)
  );
}
