import { expect, test } from "vitest";
import { accountsScreenDefinition } from "./accounts/definition";
import { contactsScreenDefinition } from "./contacts/definition";
import { formatModuleSearchSecondaryLine } from "./global-search-format";
import { leadsScreenDefinition } from "./leads/definition";

test("secondary line joins configured module fields", () => {
  expect(
    formatModuleSearchSecondaryLine(
      { id: "1", fields: { Email: "a@b.test", Phone: "555" } },
      leadsScreenDefinition,
    ),
  ).toBe("a@b.test · 555");
  expect(
    formatModuleSearchSecondaryLine(
      { id: "1", fields: { Phone: "555", Website: "https://example.com" } },
      accountsScreenDefinition,
    ),
  ).toBe("555 · https://example.com");
});

test("returns null when the module omits search config or values are empty", () => {
  expect(
    formatModuleSearchSecondaryLine(
      { id: "1", fields: { Email: "a@b.test" } },
      {
        ...contactsScreenDefinition,
        search: undefined,
      },
    ),
  ).toBeNull();
  expect(
    formatModuleSearchSecondaryLine({ id: "1", fields: {} }, contactsScreenDefinition),
  ).toBeNull();
});
