import { signUpNewUser } from "./support/auth";
import { moduleListDefaultPath } from "./support/crm-paths";
import { createOrganization } from "./support/org";
import { expect, test } from "./support/test";

test("Accounts shell, pinned tabs, views and sorting", async ({ page }) => {
  await signUpNewUser(page);
  const org = await createOrganization(page);
  await page.goto(moduleListDefaultPath(org.slug, "Leads"));
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("link", { name: "Accounts", exact: true })
    .click();
  await expect(page).toHaveURL(/\/tab\/Accounts\/list$/);
  const list = page.locator(".module-list-page");

  // Pinned tabs AL-01, AL-52
  await expect(list.locator("[data-view-pill]")).toHaveText("All Accounts");
  await expect(list.getByRole("button", { name: "All Locked Accounts" })).toBeVisible();

  // Column headers AL-35, AL-39, AL-60, AL-61
  await expect(list.getByRole("columnheader", { name: "Account Name", exact: true })).toBeVisible();
  await expect(list.getByRole("columnheader", { name: "Phone", exact: true })).toBeVisible();
  await expect(list.getByRole("columnheader", { name: "Website", exact: true })).toBeVisible();
  await expect(
    list.getByRole("columnheader", { name: "Account Owner", exact: true }),
  ).toBeVisible();

  // Website values are active links (AL-63)
  const firstRow = list.locator("tbody tr").first();
  const websiteLink = firstRow.getByRole("link", { name: /^https?:\/\// });
  if ((await websiteLink.count()) > 0) {
    await expect(websiteLink).toHaveAttribute("href", /^https?:\/\//);
  }

  // Switch to pinned tab "All Locked Accounts" (AL-52)
  await list.getByRole("button", { name: "All Locked Accounts" }).click();
  await expect(page).toHaveURL(/\/custom-view\/all-locked-accounts\/list$/);
  await expect(list.locator("[data-view-pill]")).toHaveText("All Locked Accounts");
  await expect(list.getByRole("button", { name: "All Accounts" })).toBeVisible();

  // Ellipsis menu (AL-02)
  await list.getByRole("button", { name: "Custom views" }).click();
  await expect(page.getByRole("menuitem")).toHaveCount(12);

  // Switch to "My Accounts" (AL-02.4)
  await page.getByRole("menuitem", { name: "My Accounts", exact: true }).click();
  await expect(list.locator("[data-view-pill]")).toHaveText("My Accounts");

  // Switch back to "All Accounts"
  await list.getByRole("button", { name: "Custom views" }).click();
  await page.getByRole("menuitem", { name: "All Accounts", exact: true }).click();
  await expect(page).toHaveURL(/\/custom-view\/all-accounts\/list$/);
  await expect(list.locator("[data-view-pill]")).toHaveText("All Accounts");

  // Sort by Account Name (AL-04)
  await list.getByRole("button", { name: "Account Name column options" }).click();
  await page.getByRole("menuitem", { name: "Asc", exact: true }).click();
  await expect(page).toHaveURL(/sort_by=Account_Name/);
});

test("Accounts view menu: show custom views as Dropdown stays inert (AL-02.10)", async ({
  page,
}) => {
  await signUpNewUser(page);
  const org = await createOrganization(page);
  await page.goto(moduleListDefaultPath(org.slug, "Accounts"));
  const list = page.locator(".module-list-page");
  await expect(list.locator("[data-view-pill]")).toHaveText("All Accounts");
  const url = page.url();
  await list.getByRole("button", { name: "Custom views" }).click();
  await page.getByRole("menuitem", { name: "Show custom views as Dropdown" }).click();
  await expect(page.getByRole("menuitem")).toHaveCount(0);
  await expect(page).toHaveURL(url);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(list.locator("[data-view-pill]")).toHaveText("All Accounts");
  await expect(list.getByRole("button", { name: "All Locked Accounts" })).toBeVisible();
});

test("Accounts filters, alphabet, paging and record route", async ({ page }) => {
  await signUpNewUser(page);
  const org = await createOrganization(page);
  await page.goto(moduleListDefaultPath(org.slug, "Accounts"));
  const list = page.locator(".module-list-page");
  await expect(list.getByRole("table", { name: "Records" })).toBeVisible();

  // Alphabet filter (AL-36)
  await list.getByRole("button", { name: "Filter by first letter" }).click();
  await page.getByRole("option", { name: "A", exact: true }).click();
  await expect(list.getByRole("button", { name: "Filter by first letter" })).toContainText("A");
  await list.getByRole("button", { name: "Filter by first letter" }).click();
  await page.getByRole("option", { name: "All", exact: true }).click();

  // Field filter (AL-27, AL-53-AL-59)
  const filter = list.getByRole("checkbox", { name: "Account Site", exact: true });
  await filter.scrollIntoViewIfNeeded();
  await filter.check({ force: true });
  await list.getByRole("textbox", { name: "Account Site value" }).fill("Synthetic unmatched site");
  await list.getByRole("button", { name: "Apply Filter" }).click();
  await expect(list.getByText("No Accounts found.")).toBeVisible();
  await list.getByRole("button", { name: "Clear", exact: true }).click();
  await expect(list.locator("tbody tr").first()).toBeVisible();

  // Paging (AL-48–AL-51)
  await list.getByRole("link", { name: "Next" }).click();
  await expect(page).toHaveURL(/page=2/);

  // Row link navigation to detail (AL-42)
  await list.locator("tbody tr").first().getByRole("link").first().click();
  await expect(page).toHaveURL(/\/tab\/Accounts\/[^/?]+/);
  await expect(page.locator("[data-record-frame]")).toBeVisible();
});

test("Accounts later-module inventory stays inert and mass flows reuse selection dialogs", async ({
  page,
}) => {
  await signUpNewUser(page);
  const org = await createOrganization(page);
  await page.goto(moduleListDefaultPath(org.slug, "Accounts"));
  const list = page.locator(".module-list-page");
  await expect(list.getByRole("table", { name: "Records" })).toBeVisible();
  const before = page.url();

  // AL-13: Create Account dropdown opens the CSV import wizard
  await list.getByRole("button", { name: "More", exact: true }).click();
  await page.getByRole("menuitem", { name: "Import Accounts", exact: true }).click();
  await expect(page).toHaveURL(/\/tab\/Accounts\/import$/);
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(page).toHaveURL(before);
  await expect(list.getByRole("table", { name: "Records" })).toBeVisible();

  // AL-33: View Settings (M11)
  await list.getByRole("button", { name: "View Settings" }).click({ force: true });
  await expect(page.getByRole("menu")).toHaveCount(0);

  // AL-25: Cadences system filter (P3)
  const cadences = list.locator('[data-later-module="P3"]', { hasText: "Cadences" }).first();
  await expect(cadences).toBeVisible();

  // AL-62: Handset icon button (M5)
  const handset = list.locator('button[data-later-module="M5"][aria-label="Call"]');
  if ((await handset.count()) > 0) {
    await handset.first().click({ force: true });
    expect(page.url()).toBe(before);
  }

  // AL-46: Note bubble (M6)
  const noteBtn = list.locator('button[data-later-module="M6"][aria-label="Notes"]');
  if ((await noteBtn.count()) > 0) {
    await noteBtn.first().click({ force: true });
    expect(page.url()).toBe(before);
  }

  // L-47 pulse icon and badge column are absent in Accounts
  await expect(list.locator('button[aria-label="Record activity"]')).toHaveCount(0);
  await expect(list.locator('[data-part="badge"]')).toHaveCount(0);

  // AL-14: Actions menu (10 items in reference order)
  await list.getByRole("button", { name: "Actions", exact: true }).click();
  await expect(page.getByRole("menuitem")).toHaveText([
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

  // Inert action items
  await page.getByRole("menuitem", { name: "Manage Tags", exact: true }).click({ force: true });
  await expect(page.getByRole("menu")).toBeVisible();
  expect(page.url()).toBe(before);

  // Print View (AL-14.10)
  const print = page.getByRole("menuitem", { name: "Print View", exact: true });
  await expect(print.locator("svg")).toBeVisible();
  await print.click();
  const printMenu = page.getByRole("menu", { name: "Print View", exact: true });
  await expect(printMenu.getByRole("menuitem")).toHaveText([
    "Print Default view",
    "Print Using Canvas",
  ]);
  for (const name of ["Print Using Canvas"]) {
    const item = printMenu.getByRole("menuitem", { name, exact: true });
    await expect(item).toHaveAttribute("data-later-module", "M6");
    // Placeholder rows stay inert and leave the submenu open.
    await item.click({ force: true });
    await expect(printMenu).toBeVisible();
    expect(page.url()).toBe(before);
  }
  await printMenu.getByRole("menuitem", { name: "Print Default view", exact: true }).focus();
  await page.keyboard.press("Escape");
  await expect(printMenu).toHaveCount(0);
  await expect(print).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("menu")).toHaveCount(0);
  expect(page.url()).toBe(before);

  // Mass actions without selection do not open dialogs
  for (const action of ["Mass Transfer", "Mass Delete", "Mass Update"]) {
    await list.getByRole("button", { name: "Actions", exact: true }).click();
    await page.getByRole("menuitem", { name: action, exact: true }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.getByRole("alertdialog")).toHaveCount(0);
    await expect(list.locator("[data-selection-bar]")).toHaveCount(0);
    await expect(
      list
        .locator("tbody")
        .getByRole("checkbox", { name: /Select / })
        .first(),
    ).not.toBeChecked();
  }

  // Row selection (AL-34, AL-40)
  await list
    .locator("tbody")
    .getByRole("checkbox", { name: /Select / })
    .first()
    .check({ force: true });
  await expect(list.locator("[data-selection-bar]")).toContainText("1 Record Selected.");

  // Mass Update dialog
  await list.getByRole("button", { name: "Mass Update", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Mass Update" })).toBeVisible();
  await page.getByRole("dialog").getByRole("button", { name: "Cancel" }).click();

  // Change Owner & Delete dialogs
  for (const [action, role, title] of [
    ["Change Owner", "dialog", "Change Owner"],
    ["Delete", "alertdialog", "Delete Account"],
  ] as const) {
    await list.getByRole("button", { name: "Actions", exact: true }).click();
    await page.getByRole("menuitem", { name: action, exact: true }).click();
    const dialog = page.getByRole(role, { name: title });
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "Cancel" }).click();
    await expect(list.locator("[data-selection-bar]")).toContainText("1 Record Selected.");
    await expect(
      list
        .locator("tbody")
        .getByRole("checkbox", { name: /Select / })
        .nth(1),
    ).not.toBeChecked();
  }
});
