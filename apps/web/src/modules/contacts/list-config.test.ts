import { expect, test } from "vitest";
import { CONTACTS_SORT_FIELD_LABELS, contactsListPageConfig } from "./list-config";

test("defines Contacts identity labels and routes using the Full_Name link column", () => {
  expect(contactsListPageConfig.linkField).toBe("Full_Name");
  expect(contactsListPageConfig.linkFieldLabel).toBe("Contact Name");
  expect(contactsListPageConfig.createLabel).toBe("Create Contact");
  expect(contactsListPageConfig.paths.create("sample-org", "Contacts")).toContain(
    "/tab/Contacts/create",
  );
  expect(CONTACTS_SORT_FIELD_LABELS).toContain("Contact Name");
  expect(CONTACTS_SORT_FIELD_LABELS).toContain("Date of Birth");
  expect(CONTACTS_SORT_FIELD_LABELS).not.toContain("Lead Status");
});

test("keeps the Contacts Actions inventory in reference order and assigns later modules", () => {
  expect(contactsListPageConfig.inventory?.actions.map((item) => item.label)).toEqual([
    "Mass Transfer",
    "Mass Delete",
    "Mass Update",
    "Manage Tags",
    "Drafts",
    "Mass Email",
    "Approve Contacts",
    "Deduplicate Contacts",
    "Add to Campaigns",
    "Create Client Script",
    "Export Contacts",
    "Sheet view",
    "Print View",
  ]);
  expect(
    contactsListPageConfig.inventory?.actions.find((item) => item.id === "sheet")?.laterModule,
  ).toBe("P3");
});
