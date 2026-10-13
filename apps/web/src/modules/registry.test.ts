import { expect, test } from "vitest";
import { accountsScreenDefinition } from "./accounts/definition";
import { leadsScreenDefinition } from "./leads/definition";
import { moduleScreens, resolveModuleScreen } from "./registry";

test("the shipped modules is registered", () => {
  expect(moduleScreens.map((definition) => definition.tab)).toEqual([
    "Leads",
    "Contacts",
    "Accounts",
  ]);
  expect(resolveModuleScreen("Leads")).toBe(leadsScreenDefinition);
  expect(resolveModuleScreen("Accounts")).toBe(accountsScreenDefinition);
  expect(resolveModuleScreen("Unknown")).toBeUndefined();
});

test("the module maps event kinds before the shared timeline draws them", () => {
  expect(leadsScreenDefinition.detail.timeline.normalizeEventKind("lead_image_upload")).toBe(
    "image_upload",
  );
  expect(leadsScreenDefinition.detail.timeline.normalizeEventKind("other")).toBe("other");
});
