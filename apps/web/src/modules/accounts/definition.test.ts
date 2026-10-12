import { expect, test } from "vitest";
import { moduleScreens, resolveModuleScreen } from "../registry";
import { accountsScreenDefinition } from "./definition";

test("exports a complete definition meeting ModuleScreenDefinition without registry addition", () => {
  expect(accountsScreenDefinition).toMatchObject({
    apiName: "Accounts",
    tab: "Accounts",
    singularLabel: "Account",
    pluralLabel: "Accounts",
    pageTitle: "Accounts",
    navigation: { id: "accounts" },
  });
  expect(accountsScreenDefinition.detail.statusRibbon).toBeUndefined();
  expect(accountsScreenDefinition.form.rules.addresses).toHaveLength(2);
  expect(resolveModuleScreen("Accounts")).toBeUndefined();
  expect(moduleScreens.some((definition) => definition.apiName === "Accounts")).toBe(false);
});
