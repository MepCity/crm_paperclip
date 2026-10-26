import { expect, test } from "vitest";
import { translator } from "./catalogs";
import { builtInViewLabel } from "./record-labels";

test("translates built-in view names and preserves user-created names", () => {
  const t = translator("tr");
  expect(
    builtInViewLabel(
      { name: "All Leads", systemDefined: true, isDefault: true },
      "Leads",
      "Müşteri Adayları",
      t,
    ),
  ).toBe("Tüm Müşteri Adayları");
  expect(
    builtInViewLabel(
      { name: "All Leads", systemDefined: false, isDefault: false },
      "Leads",
      "Müşteri Adayları",
      t,
    ),
  ).toBe("All Leads");
  expect(
    builtInViewLabel(
      { name: "My Contacts", systemDefined: true, isDefault: false },
      "Contacts",
      "Kişiler",
      t,
    ),
  ).toBe("Bana Ait Kişiler");
});
