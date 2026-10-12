import type { FieldDefinition } from "@crm/core/records";
import { isLeadInlineEditable } from "../leads/leads-inline-edit";

/** Shared editing policy; both Accounts address composites stay in the form. */
export function isAccountInlineEditable(field: FieldDefinition): boolean {
  return (
    ![
      "Billing_Address",
      "Shipping_Address",
      "Billing_Coordinates",
      "Shipping_Coordinates",
    ].includes(field.apiName) && isLeadInlineEditable(field)
  );
}
