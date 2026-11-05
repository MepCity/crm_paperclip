import type { FieldValue } from "@crm/core/records";
import type { FormRules } from "@/components/records/form/form-model";

export const PRODUCTS_FORM_CREATE_TITLE = "Create Product";
export const PRODUCTS_FORM_EDIT_TITLE = "Edit Product";
export const PRODUCTS_DELETE_CONFIRM_TITLE = "Delete Product";
export const PRODUCTS_DELETE_CONFIRM_MESSAGE = "Are you sure you want to delete this Product?";
export const PRODUCTS_FORM_PICKLIST_NONE = "-None-";

/** System fields are never drawn in the form. */
export const PRODUCTS_FORM_SYSTEM_FIELDS = [
  "Created_By",
  "Modified_By",
  "Created_Time",
  "Modified_Time",
  "id",
  "Last_Activity_Time",
] as const;

export function buildProductsFormDefaults(): Record<string, FieldValue> {
  return {
    Product_Active: true,
    Manufacturer: PRODUCTS_FORM_PICKLIST_NONE,
    Product_Category: PRODUCTS_FORM_PICKLIST_NONE,
    Usage_Unit: PRODUCTS_FORM_PICKLIST_NONE,
    Taxable: false,
    Tax: null,
  };
}

/**
 * Product Name is required by metadata. Vendor_Name is hidden per ADR 0016 §8.
 * Owner defaults to the signed-in user. Unit Price is displayed as List Price.
 */
export const productsFormRules: FormRules = {
  owner: "Owner",
  currencies: ["Unit_Price", "Commission_Rate"],
  labelOverrides: {
    Unit_Price: "List Price",
  },
  omitted: ["Vendor_Name", "Connected_To__s", "Tag", "Locked__s", ...PRODUCTS_FORM_SYSTEM_FIELDS],
  defaultValues: buildProductsFormDefaults,
};
