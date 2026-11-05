import { expect, test } from "vitest";
import { productsRecordHeaderIdentity } from "./products-record-header";
import { productRecord } from "./test-metadata";

test("products record header identity extracts Product_Name", () => {
  const header = productsRecordHeaderIdentity(productRecord({ Product_Name: "Widget A" }));
  expect(header).toEqual({
    title: "Widget A",
    hasPortrait: false,
    recordNavigation: true,
  });
});

test("products record header identity handles missing Product_Name", () => {
  const header = productsRecordHeaderIdentity(productRecord({}));
  expect(header.title).toBe("");
});
