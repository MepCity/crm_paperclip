import { expect, test } from "vitest";
import { moduleScreens, resolveModuleScreen } from "../registry";
import { meetingsScreenDefinition } from "./definition";
import { meetingsListPageConfig } from "./list-config";

test("exports a complete Meetings module screen definition registered in the module table", () => {
  expect(meetingsScreenDefinition).toMatchObject({
    apiName: "Events",
    tab: "Meetings",
    singularLabel: "Meeting",
    pluralLabel: "Meetings",
    pageTitle: "Meetings",
    navigation: { id: "meetings", group: "activities" },
  });
  expect(meetingsScreenDefinition.list).toBe(meetingsListPageConfig);
  expect(meetingsScreenDefinition.listCurrencyCode).toBe("TRY");
  expect(meetingsScreenDefinition.detail.hasPortrait).toBe(false);
  expect(meetingsScreenDefinition.detail.recordNavigation).toBe(true);
  expect(meetingsScreenDefinition.detail.layout).toBe("activity");
  expect(meetingsScreenDefinition.detail.lastUpdatePlacement).toBe("tab-row");
  expect(meetingsScreenDefinition.detail.addTags).toEqual({ label: "Add Tags", laterModule: "M5" });
  expect(meetingsScreenDefinition.detail.BetweenCards).toBeDefined();
  expect(meetingsScreenDefinition.detail.SidePanel).toBeDefined();

  expect(resolveModuleScreen("Meetings")).toBe(meetingsScreenDefinition);
  expect(moduleScreens.some((definition) => definition.tab === "Meetings")).toBe(true);
  expect(moduleScreens.some((definition) => definition.apiName === "Events")).toBe(true);
});

test("binds the Meetings detail screen without a portrait, rail or completion command", () => {
  const detail = meetingsScreenDefinition.detail;
  expect(detail.hasPortrait).toBe(false);
  expect(detail.recordNavigation).toBe(true);
  expect(detail.lastUpdatePlacement).toBe("tab-row");
  expect(detail.addTags).toEqual({ label: "Add Tags", laterModule: "M5" });
  expect(detail.relatedLists).toBeUndefined();
  expect(detail.relatedListRail).toBeUndefined();
  expect(detail.headerCommands).toBeUndefined();
  expect(
    detail.header({ id: "meeting-sample", fields: { Event_Title: "Planning Meeting" } }).title,
  ).toBe("Planning Meeting");
});
