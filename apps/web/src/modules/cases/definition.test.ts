import { expect, test } from "vitest";
import { getModuleScreens } from "../registry";
import { casesScreenDefinition } from "./definition";

test("exports the Cases definition and registers it", () => {
  expect(casesScreenDefinition).toMatchObject({
    apiName: "Cases",
    tab: "Cases",
    singularLabel: "Case",
    pluralLabel: "Cases",
    pageTitle: "Cases",
    navigation: { id: "cases" },
  });
  expect(casesScreenDefinition.detail.hasPortrait).toBe(false);
  expect(casesScreenDefinition.detail.recordNavigation).toBe(true);
  expect(casesScreenDefinition.detail.relatedLists?.length).toBeGreaterThan(0);
  expect(casesScreenDefinition.detail.relatedListRail).toBeDefined();
  expect(getModuleScreens().some((d) => d.apiName === "Cases")).toBe(true);
});
