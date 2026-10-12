import { expect, test } from "vitest";
import { moduleScreens, resolveModuleScreen } from "../registry";
import { accountsScreenDefinition } from "./definition";

test("exports a complete definition meeting ModuleScreenDefinition", () => {
  expect(accountsScreenDefinition).toMatchObject({
    apiName: "Accounts",
    tab: "Accounts",
    singularLabel: "Account",
    pluralLabel: "Accounts",
    pageTitle: "Accounts",
    navigation: { id: "accounts" },
  });
  expect(accountsScreenDefinition.detail.statusRibbon).toBeUndefined();
  expect(accountsScreenDefinition.detail.addTags).toEqual({ label: "Add Tags", laterModule: "M6" });
  expect(accountsScreenDefinition.detail.headerCommands).toEqual([
    { id: "send-email", label: "Send Email", laterModule: "M10" },
  ]);
  expect(accountsScreenDefinition.detail.timeline.upcomingAutomatedActions).toEqual({
    label: "Show Upcoming Automated Actions",
    laterModule: "M12",
  });
  expect(accountsScreenDefinition.form.profileImageIcon).toBeDefined();
  expect(accountsScreenDefinition.detail.portraitIcon).toBeDefined();
  expect(accountsScreenDefinition.form.rules.addresses).toHaveLength(2);
  expect(resolveModuleScreen("Accounts")).toBe(accountsScreenDefinition);
  expect(moduleScreens.some((definition) => definition.apiName === "Accounts")).toBe(true);
  // Lookups that target Accounts draw the picker captured in m3f-create-parent.
  expect(accountsScreenDefinition.form.recordPickerChrome).toBe("observed");
});
