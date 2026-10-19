import { expect, test } from "vitest";
import { getModuleScreens } from "../registry";
import { solutionsScreenDefinition } from "./definition";

test("exports the Solutions definition and registers it", () => {
  expect(solutionsScreenDefinition).toMatchObject({
    apiName: "Solutions",
    tab: "Solutions",
    singularLabel: "Solution",
    pluralLabel: "Solutions",
    pageTitle: "Solutions",
    navigation: { id: "solutions" },
  });
  expect(solutionsScreenDefinition.detail.hasPortrait).toBe(false);
  expect(solutionsScreenDefinition.detail.recordNavigation).toBe(true);
  expect(solutionsScreenDefinition.detail.relatedLists?.length).toBeGreaterThan(0);
  expect(solutionsScreenDefinition.detail.relatedListRail).toBeDefined();
  expect(getModuleScreens().some((d) => d.apiName === "Solutions")).toBe(true);
});
