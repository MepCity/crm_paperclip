import { expect, test } from "vitest";
import { getModuleScreens } from "../registry";
import { campaignsScreenDefinition } from "./definition";

test("exports and registers the Campaigns definition", () => {
  expect(campaignsScreenDefinition).toMatchObject({
    apiName: "Campaigns",
    tab: "Campaigns",
    singularLabel: "Campaign",
    pluralLabel: "Campaigns",
    pageTitle: "Campaigns",
  });
  expect(campaignsScreenDefinition.detail.hasPortrait).toBe(false);
  expect(getModuleScreens().some((d) => d.apiName === "Campaigns")).toBe(true);
});

test("campaigns form pins the inventory footer to the bottom edge", () => {
  expect(campaignsScreenDefinition.form.inventoryChrome).toBe(true);
  expect(campaignsScreenDefinition.form.inventoryFooterPinned).toBe(true);
});
