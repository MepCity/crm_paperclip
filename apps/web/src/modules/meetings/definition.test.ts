import { expect, test } from "vitest";
import { moduleScreens, resolveModuleScreen } from "../registry";
import { meetingsScreenDefinition } from "./definition";
import { meetingsListPageConfig } from "./list-config";

test("exports a complete Meetings module screen definition not added to the registry", () => {
  expect(meetingsScreenDefinition).toMatchObject({
    apiName: "Events",
    tab: "Meetings",
    singularLabel: "Meeting",
    pluralLabel: "Meetings",
    pageTitle: "Meetings",
    navigation: { id: "meetings" },
  });
  expect(meetingsScreenDefinition.list).toBe(meetingsListPageConfig);
  expect(meetingsScreenDefinition.listCurrencyCode).toBe("TRY");
  expect(meetingsScreenDefinition.detail.hasPortrait).toBe(false);
  expect(meetingsScreenDefinition.detail.recordNavigation).toBe(false);

  // Tanım bu görevde kayıt tablosuna (registry.ts) eklenmez.
  expect(resolveModuleScreen("Meetings")).toBeUndefined();
  expect(moduleScreens.some((definition) => definition.tab === "Meetings")).toBe(false);
  expect(moduleScreens.some((definition) => definition.apiName === "Events")).toBe(false);
});
