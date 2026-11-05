import { expect, test } from "vitest";
import {
  buildProductsBusinessCardFields,
  buildProductsDetailSections,
} from "./products-detail-sections";
import { productField, productMetadata, productRecord } from "./test-metadata";

test("products business card is empty", () => {
  const meta = productMetadata();
  const record = productRecord();
  expect(buildProductsBusinessCardFields(meta, record)).toEqual([]);
});

test("products detail sections omit Vendor_Name and project layout columns", () => {
  const meta = productMetadata([
    productField("Product_Name", {
      views: { view: true, create: true, edit: true, quickCreate: false },
    }),
    productField("Vendor_Name", {
      views: { view: true, create: true, edit: true, quickCreate: false },
    }),
    productField("Unit_Price", {
      views: { view: true, create: true, edit: true, quickCreate: false },
    }),
  ]);
  meta.layout = [
    {
      label: "Product Information",
      columnCount: 2,
      columns: [["Product_Name"], ["Vendor_Name"]],
      fields: ["Product_Name", "Vendor_Name"],
    },
    {
      label: "Price Information",
      columnCount: 2,
      columns: [["Unit_Price"], []],
      fields: ["Unit_Price"],
    },
  ];

  const record = productRecord({
    Product_Name: "Sample",
    Vendor_Name: "Vendor X",
    Unit_Price: 100,
  });

  const sections = buildProductsDetailSections(meta, record);
  expect(sections).toHaveLength(2);
  const infoSection = sections[0];
  expect(infoSection).toBeDefined();
  if (!infoSection) throw new Error("Missing info section");
  expect(infoSection.title).toBe("Product Information");
  expect(infoSection.fields).toHaveLength(1);
  const firstField = infoSection.fields[0];
  expect(firstField).toBeDefined();
  if (!firstField) throw new Error("Missing first field");
  expect(firstField.field.apiName).toBe("Product_Name");
  expect(infoSection.fields.some((f) => f.field.apiName === "Vendor_Name")).toBe(false);
});
