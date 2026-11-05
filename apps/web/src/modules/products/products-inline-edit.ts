import type { FieldDefinition } from "@crm/core/records";
import { isLeadInlineEditable } from "../leads/leads-inline-edit";
import { PRODUCTS_FORM_SYSTEM_FIELDS } from "./products-form-rules";

/** Shared editing policy; system fields, profile image and Vendor_Name are never editable inline. */
export function isProductInlineEditable(field: FieldDefinition): boolean {
  return (
    field.apiName !== "Vendor_Name" &&
    field.apiName !== "Record_Image" &&
    field.apiName !== "Connected_To__s" &&
    !(PRODUCTS_FORM_SYSTEM_FIELDS as readonly string[]).includes(field.apiName) &&
    isLeadInlineEditable(field)
  );
}
