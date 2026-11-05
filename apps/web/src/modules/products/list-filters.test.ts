import { expect, test } from "vitest";
import { buildProductsFilterGroups, productsFilterGroups } from "./list-filters";
import { productField } from "./test-metadata";

test("products filter groups contain system, fields and related sections", () => {
  expect(productsFilterGroups.map((g) => g.id)).toEqual(["system", "fields", "related"]);
  const system = productsFilterGroups.find((g) => g.id === "system");
  expect(system?.items.map((i) => i.label)).toContain("Locked");
  expect(system?.items.map((i) => i.label)).toContain("Touched Records");

  const fields = buildProductsFilterGroups({
    fields: [
      productField("Product_Name", { label: "Product Name" }),
      productField("Unit_Price", { label: "Unit Price", dataType: "currency" }),
      productField("Tax", {
        label: "Tax",
        dataType: "multiselectpicklist",
        picklist: [{ storedValue: "Vat", displayValue: "Vat - 20 %" }],
      }),
    ],
    linkField: "Product_Name",
    users: [{ userId: "u1", name: "User One" }],
    currencyCode: "TRY",
  });
  const fieldsGroup = fields.find((g) => g.id === "fields");
  expect(fieldsGroup?.items.some((i) => i.label === "Product Name")).toBe(true);
  expect(fieldsGroup?.items.some((i) => i.label === "Unit Price")).toBe(true);
  expect(fieldsGroup?.items.some((i) => i.label === "Tax")).toBe(true);
});
