import type { FieldDefinition } from "@crm/core/records";
import { isLeadInlineEditable } from "../leads/leads-inline-edit";

/** Interim shared editing policy; both Contacts address composites stay in the form. */
export function isContactInlineEditable(field: FieldDefinition): boolean {
  return (
    !["Mailing_Address", "Other_Address", "Mailing_Coordinates", "Other_Coordinates"].includes(
      field.apiName,
    ) && isLeadInlineEditable(field)
  );
}
