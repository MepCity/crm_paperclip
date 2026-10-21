import { join } from "node:path";
import { signUpNewUser } from "./support/auth";
import { moduleListDefaultPath } from "./support/crm-paths";
import { createOrganization } from "./support/org";
import { expect, test } from "./support/test";
import { exerciseTouchedFilter } from "./support/touched-filter";

test("Meetings shell entry, single tab, view menu with search, columns and sorting", async ({
  page,
}) => {
  await signUpNewUser(page);
  const org = await createOrganization(page);
  await page.goto(moduleListDefaultPath(org.slug, "Leads"));

  // SH-19, SH-21: Meetings is an entry of the Activities group in the main navigation
  const nav = page.getByRole("navigation", { name: "Main navigation" });
  await expect(nav.getByRole("button", { name: "Activities" })).toHaveAttribute(
    "aria-expanded",
    "true",
  );
  await nav.getByRole("link", { name: "Meetings", exact: true }).click();
  await expect(page).toHaveURL(/\/tab\/Meetings\/list$/);
  const list = page.locator(".module-list-page");

  // ML-01: a single All Meetings tab
  await expect(list.locator("[data-view-pill]")).toHaveText("All Meetings");
  await expect(list.locator("[data-view-pill]")).toHaveCount(1);

  // ML-05 – ML-09: four view type tiles and the arrow, no Sheet or Timeline tile
  const switcher = list.locator("[data-view-type-switcher]");
  await expect(switcher.getByRole("button")).toHaveCount(5);
  await expect(switcher.getByRole("button", { name: "Grid presentation" })).toHaveCount(0);
  await expect(switcher.getByRole("button", { name: "Connected presentation" })).toHaveCount(0);
  await expect(switcher.getByRole("button", { name: "List presentation" })).toHaveAttribute(
    "data-active",
    "true",
  );

  // Default columns (view order for all-meetings: Title, From, To, Related To)
  for (const name of ["Title", "From", "To", "Related To"]) {
    await expect(list.getByRole("columnheader", { name, exact: true })).toBeVisible();
  }
  // MEP-509: Create Meeting opens the Meeting Information window instead of the create page.
  await list.getByRole("button", { name: "Create Meeting", exact: true }).click();
  const information = page.getByRole("dialog", { name: "Meeting Information" });
  await expect(information).toBeVisible();
  await information.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(information).toBeHidden();

  // ML-02: view menu
  await list.getByRole("button", { name: "Custom views" }).click();
  const search = page.getByRole("textbox", { name: "Search views" });
  await expect(search).toBeVisible();
  await search.fill("completed");
  await expect(
    page.getByRole("menuitem", { name: "Completed Meetings", exact: true }),
  ).toBeVisible();
  await search.fill("");
  await expect(page.getByRole("menuitem", { name: "All Meetings", exact: true })).toBeVisible();

  // Switch to Completed Meetings
  await page.getByRole("menuitem", { name: "Completed Meetings", exact: true }).click();
  await expect(page).toHaveURL(/\/custom-view\/completed-meetings\/list/);
  await expect(list.locator("[data-view-pill]")).toHaveText("Completed Meetings");

  // Sort by Title (ML-04)
  await list.getByRole("button", { name: "Title column options" }).click();
  await page.getByRole("menuitem", { name: "Asc", exact: true }).click();
  await expect(page).toHaveURL(/sort_by=Event_Title/);
});

test("Meetings filters, paging, record route and related record link", async ({ page }) => {
  await signUpNewUser(page);
  const org = await createOrganization(page);
  await page.goto(moduleListDefaultPath(org.slug, "Meetings"));
  const list = page.locator(".module-list-page");
  await expect(list.getByRole("table", { name: "Records" })).toBeVisible();

  // ML-13 – ML-29: filter panel inventory
  await expect(list.getByRole("heading", { name: "Filter Meetings by" })).toBeVisible();
  const systemFilters = list.getByRole("group", { name: "System Defined Filters" });
  for (const label of [
    "Record Action",
    "Related Records Action",
    "Touched Records",
    "Untouched Records",
  ]) {
    await expect(systemFilters.getByRole("checkbox", { name: label, exact: true })).toBeVisible();
  }
  await expect(systemFilters.getByRole("checkbox", { name: "Cadences" })).toHaveCount(0);
  await expect(systemFilters.getByRole("checkbox", { name: "Locked" })).toHaveCount(0);

  const fieldFilters = list.getByRole("group", { name: "Filter By Fields" });
  for (const label of [
    "All day",
    "Check-In Address",
    "Check-In By",
    "Check-In City",
    "Contact Name",
  ]) {
    const row = fieldFilters.getByRole("checkbox", { name: label, exact: true });
    await row.scrollIntoViewIfNeeded();
    await expect(row).toBeVisible();
  }

  // Field filter: Title text criterion matching nothing
  const filter = fieldFilters.getByRole("checkbox", { name: "Title", exact: true });
  await filter.scrollIntoViewIfNeeded();
  await filter.focus();
  await page.keyboard.press("Space");
  await expect(filter).toBeChecked();
  await list
    .getByRole("textbox", { name: "Title value" })
    .fill("Synthetic unmatched meeting title");
  await list.getByRole("button", { name: "Apply Filter" }).click();
  await expect(list.getByText("No Meetings found.")).toBeVisible();
  await list.getByRole("button", { name: "Clear", exact: true }).click();
  await expect(list.locator("tbody tr").first()).toBeVisible();

  // Related To cell opens the related record (ML-39)
  const related = list
    .locator('tbody a[href*="/tab/Accounts/"], tbody a[href*="/tab/Deals/"]')
    .first();
  await expect(related).toBeVisible();
  const relatedName = (await related.innerText()).trim();
  await related.click();
  await expect(page).toHaveURL(/\/tab\/(Accounts|Deals)\/[^/?]+/);
  await expect(page.locator("[data-record-header]")).toContainText(relatedName);

  // Paging (ML-42 – ML-45)
  await page.goto(moduleListDefaultPath(org.slug, "Meetings"));
  await expect(list.getByRole("table", { name: "Records" })).toBeVisible();
  await list.getByRole("link", { name: "Next" }).click();
  await expect(page).toHaveURL(/page=2/);

  // ML-38: Title opens the meeting record route
  await list
    .locator("tbody tr")
    .first()
    .locator('td[data-part="column"]')
    .first()
    .getByRole("link")
    .click();
  await expect(page).toHaveURL(/\/tab\/Meetings\/[^/?]+/);
  await expect(page.locator("[data-record-frame]")).toBeVisible();
});

test("Meetings import and export open while later-module controls stay inert", async ({ page }) => {
  await signUpNewUser(page);
  const org = await createOrganization(page);
  await page.goto(moduleListDefaultPath(org.slug, "Meetings"));
  const list = page.locator(".module-list-page");
  await expect(list.getByRole("table", { name: "Records" })).toBeVisible();
  const before = page.url();

  // Import is available; View Settings remains a later-module control.
  await list.getByRole("button", { name: "More", exact: true }).click({ force: true });
  await expect(page.getByRole("menuitem", { name: "Import Meetings" })).toBeVisible();
  await page.keyboard.press("Escape");
  await list.getByRole("button", { name: "View Settings" }).click({ force: true });
  await expect(page.getByRole("menu")).toHaveCount(0);
  expect(page.url()).toBe(before);

  // ML-12: Actions menu rows in reference order
  await list.getByRole("button", { name: "Actions", exact: true }).click();
  await expect(page.getByRole("menuitem")).toHaveText([
    "Mass Transfer",
    "Mass Delete",
    "Mass Update",
    "Manage Tags",
    "Export Meetings",
    "Print View",
  ]);
  await page.getByRole("menuitem", { name: "Export Meetings", exact: true }).click({ force: true });
  await expect(page.getByRole("dialog", { name: "Export Meetings" })).toBeVisible();
  expect(page.url()).toBe(before);
});

test("Meetings list measured evidence and row configuration", async ({ page }) => {
  await page.setViewportSize({ width: 1470, height: 835 });
  await signUpNewUser(page);
  const org = await createOrganization(page);
  await page.goto(
    `${moduleListDefaultPath(org.slug, "Meetings")}?sort_by=Event_Title&sort_order=asc`,
  );
  const list = page.locator(".module-list-page");
  await expect(list.locator("tbody tr").first()).toBeVisible();
  await page.evaluate(() => document.fonts.ready);

  const row = list.locator("tbody tr").first();
  await row.hover();
  const edit = row.getByRole("link", { name: "Edit record" });
  await expect(edit).toHaveAttribute("href", /\/edit$/);

  const dates = row.locator("td[data-part=column]");
  await expect(dates.nth(1)).toHaveText(/^\d{2}\.\d{2}\.\d{4}$/);
  await expect(dates.nth(2)).toHaveText(/^\d{2}\.\d{2}\.\d{4}$/);
  await expect(list.locator("tbody tr").nth(1).locator("td[data-part=column]").nth(1)).toHaveText(
    /^\d{2}\.\d{2}\.\d{4} \d{1,2}:\d{2} (AM|PM)$/,
  );
  await expect(list.locator("[data-part=related-pictogram]").first()).toBeVisible();

  if (process.env.MEP_LIST_EVIDENCE_DIR) {
    await page.screenshot({ path: join(process.env.MEP_LIST_EVIDENCE_DIR, "meetings-list.png") });
  }

  await edit.click();
  await expect(page).toHaveURL(/\/tab\/Meetings\/[^/]+\/edit$/);
  await expect(page.getByRole("button", { name: "Save", exact: true })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Title", exact: true })).not.toHaveValue("");
});

test("Meetings applies the Touched Records system filter and restores on Clear", async ({
  page,
}) => {
  await signUpNewUser(page);
  const org = await createOrganization(page);
  await exerciseTouchedFilter(page, org.slug, "Events");
});
