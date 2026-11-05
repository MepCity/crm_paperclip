import { expect, test } from "vitest";
import { isProductInlineEditable } from "./products-inline-edit";
import { productField } from "./test-metadata";

test("products inline edit disallows Vendor_Name, Record_Image, and system fields", () => {
  expect(isProductInlineEditable(productField("Vendor_Name"))).toBe(false);
  expect(isProductInlineEditable(productField("Record_Image"))).toBe(false);
  expect(isProductInlineEditable(productField("Created_By"))).toBe(false);
  expect(isProductInlineEditable(productField("Modified_Time"))).toBe(false);
  expect(isProductInlineEditable(productField("Product_Name"))).toBe(true);
  expect(isProductInlineEditable(productField("Unit_Price", { dataType: "currency" }))).toBe(true);
});
