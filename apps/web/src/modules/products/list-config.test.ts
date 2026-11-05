import { expect, test } from "vitest";
import {
  PRODUCTS_EMPTY_TEXT,
  PRODUCTS_LIST_CURRENCY_CODE,
  PRODUCTS_SORT_FIELD_LABELS,
  productsListPageConfig,
} from "./list-config";

test("products list page config matches module identity and inventory", () => {
  expect(PRODUCTS_LIST_CURRENCY_CODE).toBe("TRY");
  expect(PRODUCTS_EMPTY_TEXT).toBe("No Products found.");
  expect(productsListPageConfig.module).toBe("Products");
  expect(productsListPageConfig.linkField).toBe("Product_Name");
  expect(productsListPageConfig.linkFieldLabel).toBe("Product Name");
  expect(productsListPageConfig.pluralLabel).toBe("Products");
  expect(productsListPageConfig.singularLabel).toBe("Product");
  expect(productsListPageConfig.createLabel).toBe("Create Product");
  expect(productsListPageConfig.cellCurrencyCode).toBe("TRY");
  expect(productsListPageConfig.rowEditLink).toBe(true);
  expect(productsListPageConfig.pinnedViews).toEqual(["All Products"]);
  expect(productsListPageConfig.badgeColumn).toBe(false);
  expect(productsListPageConfig.selectionTags).toBe(true);

  expect(productsListPageConfig.zeroState).toBeDefined();
  expect(productsListPageConfig.zeroState?.description).toContain(
    "Products refer to goods or services",
  );
  expect(productsListPageConfig.zeroState?.createLabel).toBe("Create");
  expect(productsListPageConfig.zeroState?.importLabel).toBe("Import");

  expect(PRODUCTS_SORT_FIELD_LABELS).toContain("Product Name");
  expect(PRODUCTS_SORT_FIELD_LABELS).toContain("Unit Price");
  expect(PRODUCTS_SORT_FIELD_LABELS).toContain("Product Active");
});
