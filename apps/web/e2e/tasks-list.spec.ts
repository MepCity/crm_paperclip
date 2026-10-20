import { join } from "node:path";
import { signUpNewUser } from "./support/auth";
import { moduleListDefaultPath } from "./support/crm-paths";
import { createOrganization } from "./support/org";
import { expect, test } from "./support/test";

test("Tasks shell entry, single tab, view menu with search, columns and sorting", async ({
  page,
}) => {
  await signUpNewUser(page);
  const org = await createOrganization(page);
  await page.goto(moduleListDefaultPath(org.slug, "Leads"));
  // SH-19, SH-20: Tasks is the first entry of the Activities group in the main navigation
  const nav = page.getByRole("navigation", { name: "Main navigation" });
  await expect(nav.getByRole("button", { name: "Activities" })).toHaveAttribute(
    "aria-expanded",
    "true",
  );
  await nav.getByRole("link", { name: "Tasks", exact: true }).click();
  await expect(page).toHaveURL(/\/tab\/Tasks\/list$/);
  const list = page.locator(".module-list-page");

  // TL-01: a single All Tasks tab
  await expect(list.locator("[data-view-pill]")).toHaveText("All Tasks");
  await expect(list.locator("[data-view-pill]")).toHaveCount(1);

  // TL-05 – TL-11: five view type tiles and the arrow, no Sheet tile
  const switcher = list.locator("[data-view-type-switcher]");
  await expect(switcher.getByRole("button")).toHaveCount(6);
  await expect(switcher.getByRole("button", { name: "Grid presentation" })).toHaveCount(0);
  await expect(switcher.getByRole("button", { name: "List presentation" })).toHaveAttribute(
    "data-active",
    "true",
  );

  // Default columns (view order)
  for (const name of ["Subject", "Due Date", "Status", "Priority"]) {
    await expect(list.getByRole("columnheader", { name, exact: true })).toBeVisible();
  }
  await expect(list.getByRole("link", { name: "Create Task" })).toHaveAttribute(
    "href",
    /\/tab\/Tasks\/create$/,
  );

  // TL-02, TL-02.1 – TL-02.20: view menu (17 stock views + 3 menu controls)
  await list.getByRole("button", { name: "Custom views" }).click();
  await expect(page.getByRole("menuitem")).toHaveCount(21);
  const search = page.getByRole("textbox", { name: "Search views" });
  await expect(search).toBeVisible();
  await search.fill("overdue");
  await expect(page.getByRole("menuitem", { name: "Overdue Tasks", exact: true })).toBeVisible();
  await expect(page.getByRole("menuitem", { name: "All Tasks", exact: true })).toHaveCount(0);
  await search.fill("");
  await expect(page.getByRole("menuitem", { name: "All Tasks", exact: true })).toBeVisible();

  // Switch to Open Tasks
  await page.getByRole("menuitem", { name: "Open Tasks", exact: true }).click();
  await expect(page).toHaveURL(/\/custom-view\/open-tasks\/list/);
  await expect(list.locator("[data-view-pill]")).toHaveText("Open Tasks");

  // Sort by Subject (TL-04)
  await list.getByRole("button", { name: "Subject column options" }).click();
  await page.getByRole("menuitem", { name: "Asc", exact: true }).click();
  await expect(page).toHaveURL(/sort_by=Subject/);
});

test("Tasks filters, paging, record route and related record link", async ({ page }) => {
  await signUpNewUser(page);
  const org = await createOrganization(page);
  await page.goto(moduleListDefaultPath(org.slug, "Tasks"));
  const list = page.locator(".module-list-page");
  await expect(list.getByRole("table", { name: "Records" })).toBeVisible();

  // TL-15 – TL-26: filter panel inventory
  await expect(list.getByRole("heading", { name: "Filter Tasks by" })).toBeVisible();
  const systemFilters = list.getByRole("group", { name: "System Defined Filters" });
  for (const label of [
    "Locked",
    "Record Action",
    "Related Records Action",
    "Touched Records",
    "Untouched Records",
  ]) {
    await expect(systemFilters.getByRole("checkbox", { name: label, exact: true })).toBeVisible();
  }
  await expect(systemFilters.getByRole("checkbox", { name: "Cadences" })).toHaveCount(0);
  const fieldFilters = list.getByRole("group", { name: "Filter By Fields" });
  for (const label of ["Closed Time", "Contact Name", "Due Date", "Priority"]) {
    const row = fieldFilters.getByRole("checkbox", { name: label, exact: true });
    await row.scrollIntoViewIfNeeded();
    await expect(row).toBeVisible();
  }

  // Field filter (TL-53 – TL-61): Subject text criterion that matches nothing
  const filter = fieldFilters.getByRole("checkbox", { name: "Subject", exact: true });
  await filter.scrollIntoViewIfNeeded();
  await filter.focus();
  await page.keyboard.press("Space");
  await expect(filter).toBeChecked();
  await list.getByRole("textbox", { name: "Subject value" }).fill("Synthetic unmatched subject");
  await list.getByRole("button", { name: "Apply Filter" }).click();
  await expect(list.getByText("No Tasks found.")).toBeVisible();
  await list.getByRole("button", { name: "Clear", exact: true }).click();
  await expect(list.locator("tbody tr").first()).toBeVisible();

  // Related To cell opens the related record
  const related = list
    .locator('tbody a[href*="/tab/Accounts/"], tbody a[href*="/tab/Deals/"]')
    .first();
  await expect(related).toBeVisible();
  const relatedName = (await related.innerText()).trim();
  await related.click();
  await expect(page).toHaveURL(/\/tab\/(Accounts|Deals)\/[^/?]+/);
  await expect(page.locator("[data-record-header]")).toContainText(relatedName);

  // Paging (TL-48 – TL-51)
  await page.goto(moduleListDefaultPath(org.slug, "Tasks"));
  await expect(list.getByRole("table", { name: "Records" })).toBeVisible();
  await list.getByRole("link", { name: "Next" }).click();
  await expect(page).toHaveURL(/page=2/);

  // TL-42: Subject opens the task record route
  await list.locator("tbody tr").first().getByRole("link").first().click();
  await expect(page).toHaveURL(/\/tab\/Tasks\/[^/?]+/);
  await expect(page.locator("[data-record-frame]")).toBeVisible();
});

test("Tasks import and export open while later-module controls stay inert", async ({ page }) => {
  await signUpNewUser(page);
  const org = await createOrganization(page);
  await page.goto(moduleListDefaultPath(org.slug, "Tasks"));
  const list = page.locator(".module-list-page");
  await expect(list.getByRole("table", { name: "Records" })).toBeVisible();
  const before = page.url();

  // Import is available; View Settings remains a later-module control.
  await list.getByRole("button", { name: "More", exact: true }).click({ force: true });
  await expect(page.getByRole("menuitem", { name: "Import Tasks" })).toBeVisible();
  await page.keyboard.press("Escape");
  await list.getByRole("button", { name: "View Settings" }).click({ force: true });
  await expect(page.getByRole("menu")).toHaveCount(0);
  expect(page.url()).toBe(before);

  // TL-14: Actions menu rows in reference order
  await list.getByRole("button", { name: "Actions", exact: true }).click();
  await expect(page.getByRole("menuitem")).toHaveText([
    "Mass Transfer",
    "Mass Delete",
    "Mass Update",
    "Manage Tags",
    "Export Tasks",
    "Print View",
  ]);
  await page.getByRole("menuitem", { name: "Export Tasks", exact: true }).click({ force: true });
  await expect(page.getByRole("dialog", { name: "Export Tasks" })).toBeVisible();
  expect(page.url()).toBe(before);
});

test("Tasks list measured evidence and row configuration", async ({ page }) => {
  await page.setViewportSize({ width: 1470, height: 835 });
  await signUpNewUser(page);
  const org = await createOrganization(page);
  await page.goto(moduleListDefaultPath(org.slug, "Tasks"));
  const list = page.locator(".module-list-page");
  await expect(list.locator("tbody tr").first()).toBeVisible();
  await page.evaluate(() => document.fonts.ready);

  await expect(list.locator("[data-part=related-pictogram]")).toHaveCount(0);

  if (process.env.MEP_LIST_EVIDENCE_DIR) {
    await page.screenshot({ path: join(process.env.MEP_LIST_EVIDENCE_DIR, "tasks-list.png") });
  }
});
