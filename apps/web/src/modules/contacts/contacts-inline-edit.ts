import type { FieldDefinition } from "@crm/core/records";
import { isLeadInlineEditable } from "../leads/leads-inline-edit";

/** Contacts inline edit policy: Account_Name lookup is editable in M3; address composites stay in the form. */
export function isContactInlineEditable(field: FieldDefinition): boolean {
  if (field.apiName === "Account_Name") {
    return Boolean(field.views?.edit && !field.readOnly);
  }
  return (
    !["Mailing_Address", "Other_Address", "Mailing_Coordinates", "Other_Coordinates"].includes(
      field.apiName,
    ) && isLeadInlineEditable(field)
  );
}
