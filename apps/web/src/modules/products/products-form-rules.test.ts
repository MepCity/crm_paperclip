import { expect, test } from "vitest";
import {
  buildProductsFormDefaults,
  PRODUCTS_DELETE_CONFIRM_MESSAGE,
  PRODUCTS_DELETE_CONFIRM_TITLE,
  PRODUCTS_FORM_CREATE_TITLE,
  PRODUCTS_FORM_EDIT_TITLE,
  PRODUCTS_FORM_SYSTEM_FIELDS,
  productsFormRules,
} from "./products-form-rules";

test("products form defaults and titles match specification", () => {
  expect(PRODUCTS_FORM_CREATE_TITLE).toBe("Create Product");
  expect(PRODUCTS_FORM_EDIT_TITLE).toBe("Edit Product");
  expect(PRODUCTS_DELETE_CONFIRM_TITLE).toBe("Delete Product");
  expect(PRODUCTS_DELETE_CONFIRM_MESSAGE).toBe("Are you sure you want to delete this Product?");

  const defaults = buildProductsFormDefaults();
  expect(defaults).toMatchObject({
    Product_Active: true,
    Manufacturer: "-None-",
    Product_Category: "-None-",
    Usage_Unit: "-None-",
    Taxable: false,
    Tax: null,
  });
});

test("products form rules omit vendor name and system fields", () => {
  expect(productsFormRules.owner).toBe("Owner");
  expect(productsFormRules.currencies).toEqual(["Unit_Price", "Commission_Rate"]);
  expect(productsFormRules.labelOverrides).toEqual({ Unit_Price: "List Price" });
  expect(productsFormRules.omitted).toContain("Vendor_Name");
  for (const sysField of PRODUCTS_FORM_SYSTEM_FIELDS) {
    expect(productsFormRules.omitted).toContain(sysField);
  }
});
