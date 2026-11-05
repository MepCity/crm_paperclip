import { expect, test } from "vitest";
import { productsScreenDefinition } from "./definition";
import { formatProductsLastUpdateLabel } from "./products-last-update";
import { productRecord } from "./test-metadata";

test("uses the shared last-update format and omits absent timestamps", () => {
  const now = new Date("2026-01-02T12:00:00Z");
  expect(
    formatProductsLastUpdateLabel(productRecord(), now, { locale: "en-US", timeZone: "UTC" }),
  ).toBeNull();
  expect(
    formatProductsLastUpdateLabel(productRecord({ Modified_Time: "2026-01-01T12:00:00Z" }), now, {
      locale: "en-US",
      timeZone: "UTC",
    }),
  ).toMatch(/^Last Update : /);
});

test("binds products last-update formatter to record detail header", () => {
  expect(productsScreenDefinition.detail.lastUpdate).toBe(formatProductsLastUpdateLabel);
  expect(productsScreenDefinition.detail.lastUpdatePlacement).toBe("tab-row");
});
