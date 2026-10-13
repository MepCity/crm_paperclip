import { expect, test } from "vitest";
import { getModuleScreens, resolveModuleScreen } from "../registry";
import { contactsScreenDefinition } from "./definition";

test("exports a complete definition and registers Contacts in production", () => {
  expect(contactsScreenDefinition).toMatchObject({
    apiName: "Contacts",
    tab: "Contacts",
    singularLabel: "Contact",
    pluralLabel: "Contacts",
    pageTitle: "Contacts",
    navigation: { id: "contacts" },
  });
  expect(contactsScreenDefinition.detail.statusRibbon).toBeUndefined();
  expect(contactsScreenDefinition.detail.headerCommands).toEqual([
    {
      id: "send-email",
      label: "Send Email",
      laterModule: "M10",
      variant: "primary",
    },
  ]);
  expect(contactsScreenDefinition.form.rules.addresses).toHaveLength(2);
  expect(resolveModuleScreen("Contacts")).toBe(contactsScreenDefinition);
  expect(getModuleScreens().some((definition) => definition.apiName === "Contacts")).toBe(true);
});
