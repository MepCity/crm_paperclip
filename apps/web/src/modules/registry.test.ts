import { expect, test } from "vitest";
import { accountsScreenDefinition } from "./accounts/definition";
import { callsScreenDefinition } from "./calls/definition";
import { dealsScreenDefinition } from "./deals/definition";
import { leadsScreenDefinition } from "./leads/definition";
import { meetingsScreenDefinition } from "./meetings/definition";
import { getModuleScreens, resolveModuleScreen } from "./registry";
import { tasksScreenDefinition } from "./tasks/definition";

test("the shipped modules is registered", () => {
  expect(getModuleScreens().map((definition) => definition.tab)).toEqual([
    "Leads",
    "Contacts",
    "Accounts",
    "Deals",
    "Tasks",
    "Meetings",
    "Calls",
  ]);
  expect(resolveModuleScreen("Leads")).toBe(leadsScreenDefinition);
  expect(resolveModuleScreen("Accounts")).toBe(accountsScreenDefinition);
  expect(resolveModuleScreen("Deals")).toBe(dealsScreenDefinition);
  expect(resolveModuleScreen("Tasks")).toBe(tasksScreenDefinition);
  expect(resolveModuleScreen("Meetings")).toBe(meetingsScreenDefinition);
  expect(resolveModuleScreen("Calls")).toBe(callsScreenDefinition);
  expect(resolveModuleScreen("Unknown")).toBeUndefined();
});

test("the module maps event kinds before the shared timeline draws them", () => {
  expect(leadsScreenDefinition.detail.timeline.normalizeEventKind("lead_image_upload")).toBe(
    "image_upload",
  );
  expect(leadsScreenDefinition.detail.timeline.normalizeEventKind("other")).toBe("other");
});
