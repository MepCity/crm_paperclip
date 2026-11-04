import { expect, test } from "vitest";
import { getModuleScreens } from "../registry";
import { productsScreenDefinition } from "./definition";

test("products screen definition matches registered contract", () => {
  expect(productsScreenDefinition).toMatchObject({
    apiName: "Products",
    tab: "Products",
    singularLabel: "Product",
    pluralLabel: "Products",
    pageTitle: "Products",
    navigation: { id: "products", group: "flat" },
  });
  expect(productsScreenDefinition.detail.hasPortrait).toBe(false);
  expect(productsScreenDefinition.detail.recordNavigation).toBe(true);
  expect(productsScreenDefinition.detail.relatedLists?.length).toBeGreaterThan(0);
  expect(productsScreenDefinition.detail.relatedListRail).toBeDefined();
});

test("products screen definition is exposed in module screens registry", () => {
  expect(getModuleScreens().some((d) => d.apiName === "Products")).toBe(true);
});
