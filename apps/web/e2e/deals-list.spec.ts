import { signUpNewUser } from "./support/auth";
import { moduleDraftsPath, moduleListDefaultPath, moduleTagsPath } from "./support/crm-paths";
import { createOrganization } from "./support/org";
import { expect, test } from "./support/test";
import { exerciseTouchedFilter } from "./support/touched-filter";

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

  // View type switcher DL-05–DL-11: Deals defaults to Board presentation (DP-06)
  const switcher = list.locator("[data-view-type-switcher]");
  await expect(switcher).toBeVisible();
  await expect(switcher.getByRole("button", { name: "Board presentation" })).toHaveAttribute(
    "data-active",
    "true",
  );
  await expect(switcher.getByRole("button", { name: "Grid presentation" })).toHaveAttribute(
    "aria-disabled",
    "true",
  );
  await expect(switcher.getByRole("button", { name: "More presentations" })).toHaveAttribute(
    "aria-disabled",
    "true",
  );

  // Switch to List presentation (table)
  await switcher.getByRole("button", { name: "List presentation" }).click();
  await expect(switcher.getByRole("button", { name: "List presentation" })).toHaveAttribute(
    "data-active",
    "true",
  );

  // Table presentation keeps the refresh button; Amount cells carry the TL prefix and decimals
  await expect(list.getByRole("button", { name: "Refresh Custom View" })).toBeVisible();
  await expect(
    list
      .locator("tbody")
      .getByText(/^TL\s[\d.]+,[\d]{2}$/)
      .first(),
  ).toBeVisible();

  // Column headers in reference order
  await expect(list.getByRole("columnheader", { name: "Deal Name", exact: true })).toBeVisible();
  await expect(list.getByRole("columnheader", { name: "Amount", exact: true })).toBeVisible();
  await expect(list.getByRole("columnheader", { name: "Stage", exact: true })).toBeVisible();
  await expect(list.getByRole("columnheader", { name: "Closing Date", exact: true })).toBeVisible();
  await expect(list.getByRole("columnheader", { name: "Account Name", exact: true })).toBeVisible();
  await expect(list.getByRole("columnheader", { name: "Contact Name", exact: true })).toBeVisible();
  await expect(list.getByRole("columnheader", { name: "Deal Owner", exact: true })).toBeVisible();
  await expect(list.getByRole("link", { name: "Create Deal" })).toHaveAttribute(
    "href",
    /\/tab\/Deals\/create$/,
  );

  // Ellipsis menu DL-02 (11 stock views + 4 menu controls = 15 items)
  await list.getByRole("button", { name: "Custom views" }).click();
  await expect(page.getByRole("menuitem")).toHaveCount(15);

  // Switch to "My Deals" (DL-02.5: Owner column is omitted)
  await page.getByRole("menuitem", { name: "My Deals", exact: true }).click();
  await expect(page).toHaveURL(/\/custom-view\/my-deals\/list/);
  await expect(list.locator("[data-view-pill]")).toHaveText("My Deals");
  await expect(list.getByRole("columnheader", { name: "Deal Owner", exact: true })).toHaveCount(0);

  // Switch back to "All Deals" (Owner column restored)
  await list.getByRole("button", { name: "Custom views" }).click();
  await page.getByRole("menuitem", { name: "All Deals", exact: true }).click();
  await expect(page).toHaveURL(/\/custom-view\/all-deals\/list/);
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
  await page.goto(`${moduleListDefaultPath(org.slug, "Deals")}?presentation=table`);
  const list = page.locator(".module-list-page");
  await expect(list.getByRole("table", { name: "Records" })).toBeVisible();

  // Alphabet filter
  await list.getByRole("button", { name: "Filter by first letter" }).click();
  await page.getByRole("option", { name: "D", exact: true }).click();
  await expect(list.getByRole("button", { name: "Filter by first letter" })).toContainText("D");
  await list.getByRole("button", { name: "Filter by first letter" }).click();
  await page.getByRole("option", { name: "All", exact: true }).click();

  // Visible filter inventory (DL-15–DL-27, DL-65–DL-69). Board controls stay out of this screen.
  // Locked also exists as a field row, so system and field groups are scoped separately.
  await expect(list.getByRole("heading", { name: "Filter Deals by" })).toBeVisible();
  await expect(list.getByRole("textbox", { name: "Search filter choices" })).toBeVisible();
  const systemFilters = list.getByRole("group", { name: "System Defined Filters" });
  for (const label of [
    "Activities",
    "Latest Email Status",
    "Locked",
    "Record Action",
    "Related Records Action",
    "Touched Records",
    "Untouched Records",
    "Cadences",
  ]) {
    const row = systemFilters.getByRole("checkbox", { name: label, exact: true });
    await row.scrollIntoViewIfNeeded();
    await expect(row).toBeVisible();
  }
  const fieldFilters = list.getByRole("group", { name: "Filter By Fields" });
  for (const label of [
    "Account Name",
    "Amount",
    "Campaign Source",
    "Closing Date",
    "Connected To",
    "Contact Name",
  ]) {
    const row = fieldFilters.getByRole("checkbox", { name: label, exact: true });
    await row.scrollIntoViewIfNeeded();
    await expect(row).toBeVisible();
  }

  // Amount field filter (DL-65). Seed amounts are multiples of 100, so 1 matches nothing.
  // The number field commits on blur; Apply stays disabled until then.
  const amount = fieldFilters.getByRole("checkbox", { name: "Amount", exact: true });
  await amount.scrollIntoViewIfNeeded();
  await amount.check({ force: true });
  const amountValue = fieldFilters.getByRole("textbox", { name: "Amount value" });
  await amountValue.click();
  await amountValue.fill("1");
  await amountValue.press("Tab");
  const apply = list.getByRole("button", { name: "Apply Filter" });
  await expect(apply).toBeEnabled();
  await apply.click();
  await expect(list.getByText("No Deals found.")).toBeVisible();
  await list.getByRole("button", { name: "Clear", exact: true }).click();
  await expect(list.locator("tbody tr").first()).toBeVisible();

  // DL-66: Campaign Source field filter is live; filtering by campaign leaves matching deals.
  const campaignSourceFilter = fieldFilters.getByRole("checkbox", {
    name: "Campaign Source",
    exact: true,
  });
  await campaignSourceFilter.scrollIntoViewIfNeeded();
  await campaignSourceFilter.focus();
  await page.keyboard.press("Space");
  const campaignSourceValue = fieldFilters.getByRole("textbox", { name: "Campaign Source value" });
  await campaignSourceValue.click();
  await campaignSourceValue.fill("Campaign 001");
  await campaignSourceValue.press("Tab");
  await expect(apply).toBeEnabled();
  await apply.click();
  // Exactly 2 seeded deals match Campaign 001 (indices 0 and 3)
  await expect(list.locator("tbody tr")).toHaveCount(2);
  await list.getByRole("button", { name: "Clear", exact: true }).click();
  await expect(list.locator("tbody tr").first()).toBeVisible();

  // Account Name cell opens the related account (M3). Contact Name stays a Contacts link (M2).
  const accountLink = list
    .locator("tbody tr")
    .getByRole("link", { name: /Account \d+/ })
    .first();
  await expect(accountLink).toBeVisible();
  const accountName = (await accountLink.innerText()).trim();
  await expect(
    list
      .locator("tbody tr")
      .getByRole("link", { name: /Contact / })
      .first(),
  ).toHaveAttribute("href", /\/tab\/Contacts\/[^/?]+$/);
  await accountLink.click();
  await expect(page).toHaveURL(/\/tab\/Accounts\/[^/?]+/);
  await expect(page.locator("[data-record-frame]")).toBeVisible();
  await expect(page.locator("[data-record-header]")).toContainText(accountName);

  await page.goto(`${moduleListDefaultPath(org.slug, "Deals")}?presentation=table`);
  await expect(list.getByRole("table", { name: "Records" })).toBeVisible();

  // Paging
  await list.getByRole("link", { name: "Next" }).click();
  await expect(page).toHaveURL(/page=2/);

  // Deal Name opens the deal record. Board card numbers DL-70–DL-81 are a later task.
  await list
    .locator("tbody tr")
    .first()
    .getByRole("link", { name: /Deal \d+/ })
    .click();
  await expect(page).toHaveURL(/\/tab\/Deals\/[^/?]+/);
  await expect(page.locator("[data-record-frame]")).toBeVisible();
});

test("Deals later-module inventory stays inert and mass flows reuse selection dialogs", async ({
  page,
}) => {
  await signUpNewUser(page);
  const org = await createOrganization(page);
  await page.goto(`${moduleListDefaultPath(org.slug, "Deals")}?presentation=table`);
  const list = page.locator(".module-list-page");
  await expect(list.getByRole("table", { name: "Records" })).toBeVisible();
  const before = page.url();

  // DL-13: Create Deal dropdown opens the CSV import wizard
  await list.getByRole("button", { name: "More", exact: true }).click();
  await page.getByRole("menuitem", { name: "Import Deals", exact: true }).click();
  await expect(page).toHaveURL(/\/tab\/Deals\/import$/);
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(page).toHaveURL(moduleListDefaultPath(org.slug, "Deals"));
  // Restore the explicit table presentation for the selection checks below.
  await page.goto(before);
  await expect(list.getByRole("table", { name: "Records" })).toBeVisible();

  // View Settings (M11)
  await list.getByRole("button", { name: "View Settings" }).click({ force: true });
  await expect(page.getByRole("menu")).toHaveCount(0);

  // DL-25: Cadences system filter (P3)
  const cadences = list.locator('[data-later-module="P3"]', { hasText: "Cadences" }).first();
  await expect(cadences).toBeVisible();

  // DL-17: Activities system filter (live in M5)
  const activities = list.getByRole("checkbox", { name: "Activities" });
  await expect(activities).toBeVisible();

  // DL-19: Latest Email Status system filter (M10)
  const latestEmail = list
    .locator('[data-later-module="M10"]', { hasText: "Latest Email Status" })
    .first();
  await expect(latestEmail).toBeVisible();

  // DL-66: Campaign Source field filter is live (Campaigns, M7)
  const campaignSource = list.getByRole("checkbox", { name: "Campaign Source" });
  await expect(campaignSource).toBeVisible();
  await expect(list.locator('[data-later-module="M7"]')).toHaveCount(0);

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

  // TAG-02 / PS-05: these entries now navigate instead of remaining inert.
  for (const [label, path] of [
    ["Manage Tags", moduleTagsPath],
    ["Drafts", moduleDraftsPath],
  ] as const) {
    await page.getByRole("menuitem", { name: label, exact: true }).click();
    await expect(page).toHaveURL(path(org.slug, "Deals"));
    await expect(page.getByRole("heading", { name: label, exact: true })).toBeVisible();
    await expect(page.getByRole("menu")).toHaveCount(0);
    if (label === "Manage Tags") {
      await expect(page.locator("#main-content").getByText("Deals", { exact: true })).toBeVisible();
      await expect(page.getByRole("table", { name: "Tags table" })).toBeVisible();
    } else {
      await expect(page.getByRole("heading", { name: "Criteria", exact: true })).toBeVisible();
    }
    await page.getByRole("button", { name: "Back", exact: true }).click();
    await expect(page).toHaveURL(moduleListDefaultPath(org.slug, "Deals"));
    // Back returns to the default list; selection checks require table presentation.
    await page.goto(before);
    await expect(list.getByRole("table", { name: "Records" })).toBeVisible();
    await list.getByRole("button", { name: "Actions", exact: true }).click();
    await expect(page.getByRole("menu")).toBeVisible();
  }

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

test("Deals applies the Touched Records system filter and restores on Clear", async ({ page }) => {
  await signUpNewUser(page);
  const org = await createOrganization(page);
  await exerciseTouchedFilter(page, org.slug, "Deals");
});
