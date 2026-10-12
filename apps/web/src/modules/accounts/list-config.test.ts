import { expect, test } from "vitest";
import { ACCOUNTS_SORT_FIELD_LABELS, accountsListPageConfig } from "./list-config";

test("defines Accounts identity labels and routes using the Account_Name link column", () => {
  expect(accountsListPageConfig.linkField).toBe("Account_Name");
  expect(accountsListPageConfig.linkFieldLabel).toBe("Account Name");
  expect(accountsListPageConfig.createLabel).toBe("Create Account");
  expect(accountsListPageConfig.pinnedViews).toEqual(["All Accounts", "All Locked Accounts"]);
  expect(accountsListPageConfig.phoneLaterModule).toBe("M5");
  expect(accountsListPageConfig.paths.create("sample-org", "Accounts")).toContain(
    "/tab/Accounts/create",
  );
  expect(ACCOUNTS_SORT_FIELD_LABELS).toContain("Account Name");
  expect(ACCOUNTS_SORT_FIELD_LABELS).toContain("Billing Address - City");
  expect(ACCOUNTS_SORT_FIELD_LABELS).toContain("Annual Revenue");
  expect(ACCOUNTS_SORT_FIELD_LABELS).not.toContain("Lead Status");
  expect(ACCOUNTS_SORT_FIELD_LABELS).not.toContain("Contact Name");
});

test("keeps the Accounts Actions inventory in reference order (AL-14.1 - AL-14.10) and assigns later modules", () => {
  expect(accountsListPageConfig.inventory?.actions.map((item) => item.label)).toEqual([
    "Mass Transfer",
    "Mass Delete",
    "Mass Update",
    "Manage Tags",
    "Drafts",
    "Deduplicate Accounts",
    "Create Client Script",
    "Export Accounts",
    "Sheet view",
    "Print View",
  ]);
  expect(
    accountsListPageConfig.inventory?.actions.find((item) => item.id === "sheet")?.laterModule,
  ).toBe("P3");
  expect(
    accountsListPageConfig.inventory?.actions.find((item) => item.id === "tags")?.laterModule,
  ).toBe("M6");
  expect(
    accountsListPageConfig.inventory?.actions.find((item) => item.id === "export")?.laterModule,
  ).toBe("M6");
  expect(
    accountsListPageConfig.inventory?.actions.find((item) => item.id === "client-script")
      ?.laterModule,
  ).toBe("M11");
  expect(
    accountsListPageConfig.inventory?.actions.find((item) => item.id === "print")?.submenuIndicator,
  ).toBe(true);
  expect(accountsListPageConfig.inventory?.createItems).toBeUndefined();
});
