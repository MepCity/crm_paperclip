import { expect, test } from "vitest";
import { getModuleScreens } from "../registry";
import { solutionsScreenDefinition } from "./definition";

test("exports the Solutions definition without registering it", () => {
  expect(solutionsScreenDefinition).toMatchObject({
    apiName: "Solutions",
    tab: "Solutions",
    singularLabel: "Solution",
    pluralLabel: "Solutions",
    pageTitle: "Solutions",
    navigation: { id: "solutions" },
  });
  expect(solutionsScreenDefinition.detail.hasPortrait).toBe(false);
  expect(solutionsScreenDefinition.detail.recordNavigation).toBe(false);
  expect(getModuleScreens().some((d) => d.apiName === "Solutions")).toBe(false);
});
