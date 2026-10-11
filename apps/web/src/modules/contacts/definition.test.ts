import { expect, test } from "vitest";
import { moduleScreens, resolveModuleScreen } from "../registry";
import { contactsScreenDefinition } from "./definition";

test("exports a complete definition without registering Contacts in production", () => {
  expect(contactsScreenDefinition).toMatchObject({
    apiName: "Contacts",
    tab: "Contacts",
    singularLabel: "Contact",
    pluralLabel: "Contacts",
    pageTitle: "Contacts",
    navigation: { id: "contacts" },
  });
  expect(contactsScreenDefinition.detail.statusRibbon).toBeUndefined();
  expect(contactsScreenDefinition.form.addressGroups).toHaveLength(2);
  expect(resolveModuleScreen("Contacts")).toBeUndefined();
  expect(moduleScreens.some((definition) => definition.apiName === "Contacts")).toBe(false);
});
