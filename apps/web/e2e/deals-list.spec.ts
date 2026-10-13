import { signUpNewUser } from "./support/auth";
import { moduleListDefaultPath } from "./support/crm-paths";
import { createOrganization } from "./support/org";
import { expect, test } from "./support/test";

test("Deals shell, pinned tab, views, switcher and sorting", async ({ page }) => {
  await signUpNewUser(page);
  const org = await createOrganization(page);
  await page.goto(moduleListDefaultPath(org.slug, "Leads"));
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("link", { name: "Deals", exact: true })
    .click();
  await expect(page).toHaveURL(/\/tab\/Deals\/list$/);
  const list = page.locator(".module-list-page");

  // Single pinned tab DL-01 (All Deals; no second tab unlike Accounts)
  await expect(list.locator("[data-view-pill]")).toHaveText("All Deals");
  await expect(list.locator("[data-view-pill]")).toHaveCount(1);

  // Column headers in reference order
  await expect(list.getByRole("columnheader", { name: "Deal Name", exact: true })).toBeVisible();
  await expect(list.getByRole("columnheader", { name: "Amount", exact: true })).toBeVisible();
  await expect(list.getByRole("columnheader", { name: "Stage", exact: true })).toBeVisible();
  await expect(list.getByRole("columnheader", { name: "Closing Date", exact: true })).toBeVisible();
  await expect(list.getByRole("columnheader", { name: "Account Name", exact: true })).toBeVisible();
  await expect(list.getByRole("columnheader", { name: "Contact Name", exact: true })).toBeVisible();
  await expect(list.getByRole("columnheader", { name: "Deal Owner", exact: true })).toBeVisible();

  // View type switcher DL-05–DL-11
  const switcher = list.locator("[data-view-type-switcher]");
  await expect(switcher).toBeVisible();
  await expect(switcher.getByRole("button", { name: "List presentation" })).toHaveAttribute(
    "data-active",
    "true",
  );
  await expect(switcher.getByRole("button", { name: "Split presentation" })).toHaveAttribute(
    "aria-disabled",
    "true",
  );
  await expect(switcher.getByRole("button", { name: "More presentations" })).toHaveAttribute(
    "aria-disabled",
    "true",
  );

  // Ellipsis menu DL-02 (11 stock views + 4 menu controls = 15 items)
  await list.getByRole("button", { name: "Custom views" }).click();
  await expect(page.getByRole("menuitem")).toHaveCount(15);

  // Switch to "My Deals" (DL-02.5: Owner column is omitted)
  await page.getByRole("menuitem", { name: "My Deals", exact: true }).click();
  await expect(page).toHaveURL(/\/custom-view\/my-deals\/list$/);
  await expect(list.locator("[data-view-pill]")).toHaveText("My Deals");
  await expect(list.getByRole("columnheader", { name: "Deal Owner", exact: true })).toHaveCount(0);

  // Switch back to "All Deals" (Owner column restored)
  await list.getByRole("button", { name: "Custom views" }).click();
  await page.getByRole("menuitem", { name: "All Deals", exact: true }).click();
  await expect(page).toHaveURL(/\/custom-view\/all-deals\/list$/);
  await expect(list.locator("[data-view-pill]")).toHaveText("All Deals");
  await expect(list.getByRole("columnheader", { name: "Deal Owner", exact: true })).toBeVisible();

  // Sort by Deal Name (DL-04)
  await list.getByRole("button", { name: "Deal Name column options" }).click();
  await page.getByRole("menuitem", { name: "Asc", exact: true }).click();
  await expect(page).toHaveURL(/sort_by=Deal_Name/);
});

test("Deals filters, alphabet, paging and record route", async ({ page }) => {
  await signUpNewUser(page);
  const org = await createOrganization(page);
  await page.goto(moduleListDefaultPath(org.slug, "Deals"));
  const list = page.locator(".module-list-page");
  await expect(list.getByRole("table", { name: "Records" })).toBeVisible();

  // Alphabet filter
  await list.getByRole("button", { name: "Filter by first letter" }).click();
  await page.getByRole("option", { name: "D", exact: true }).click();
  await expect(list.getByRole("button", { name: "Filter by first letter" })).toContainText("D");
  await list.getByRole("button", { name: "Filter by first letter" }).click();
  await page.getByRole("option", { name: "All", exact: true }).click();

  // Field filter (DL-26, DL-27, DL-65-DL-69)
  const filter = list.getByRole("checkbox", { name: "Account Name", exact: true });
  await filter.check({ force: true });
  await list
    .getByRole("textbox", { name: "Account Name value" })
    .fill("Synthetic unmatched account");
  await list.getByRole("button", { name: "Apply Filter" }).click();
  await expect(list.getByText("No Deals found.")).toBeVisible();
  await list.getByRole("button", { name: "Clear", exact: true }).click();
  await expect(list.locator("tbody tr").first()).toBeVisible();

  // Paging
  await list.getByRole("link", { name: "Next" }).click();
  await expect(page).toHaveURL(/page=2/);

  // Row link navigation to detail (DL-78)
  await list.locator("tbody tr").first().getByRole("link").first().click();
  await expect(page).toHaveURL(/\/tab\/Deals\/[^/?]+/);
  await expect(page.locator("[data-record-frame]")).toBeVisible();
});

test("Deals later-module inventory stays inert and mass flows reuse selection dialogs", async ({
  page,
}) => {
  await signUpNewUser(page);
  const org = await createOrganization(page);
  await page.goto(moduleListDefaultPath(org.slug, "Deals"));
  const list = page.locator(".module-list-page");
  await expect(list.getByRole("table", { name: "Records" })).toBeVisible();
  const before = page.url();

  // DL-13: Create Deal arrow attached dropdown (M6)
  await list.getByRole("button", { name: "More", exact: true }).click({ force: true });
  await expect(page.getByRole("menu")).toHaveCount(0);
  expect(page.url()).toBe(before);

  // View Settings (M11)
  await list.getByRole("button", { name: "View Settings" }).click({ force: true });
  await expect(page.getByRole("menu")).toHaveCount(0);

  // DL-25: Cadences system filter (P3)
  const cadences = list.locator('[data-later-module="P3"]', { hasText: "Cadences" }).first();
  await expect(cadences).toBeVisible();

  // DL-17: Activities system filter (M5)
  const activities = list.locator('[data-later-module="M5"]', { hasText: "Activities" }).first();
  await expect(activities).toBeVisible();

  // DL-19: Latest Email Status system filter (M10)
  const latestEmail = list
    .locator('[data-later-module="M10"]', { hasText: "Latest Email Status" })
    .first();
  await expect(latestEmail).toBeVisible();

  // DL-66: Campaign Source field filter (M7)
  const campaignSource = list
    .locator('[data-later-module="M7"]', { hasText: "Campaign Source" })
    .first();
  await expect(campaignSource).toBeVisible();

  // DL-14: Actions menu (10 items in reference order)
  await list.getByRole("button", { name: "Actions", exact: true }).click();
  await expect(page.getByRole("menuitem")).toHaveText([
    "Mass Transfer",
    "Mass Delete",
    "Mass Update",
    "Manage Tags",
    "Drafts",
    "Deduplicate Deals",
    "Create Client Script",
    "Export Deals",
    "Sheet view",
    "Print View",
  ]);

  // Inert action items
  await page.getByRole("menuitem", { name: "Manage Tags", exact: true }).click({ force: true });
  await expect(page.getByRole("menu")).toBeVisible();
  expect(page.url()).toBe(before);

  // Print View
  const print = page.getByRole("menuitem", { name: "Print View", exact: true });
  await expect(print.locator("svg")).toBeVisible();
  await print.click();
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

  // Row selection
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
    ["Delete", "alertdialog", "Delete Deal"],
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
