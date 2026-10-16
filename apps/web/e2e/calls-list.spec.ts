import { join } from "node:path";
import { signUpNewUser } from "./support/auth";
import { moduleListDefaultPath } from "./support/crm-paths";
import { createOrganization } from "./support/org";
import { expect, test } from "./support/test";

test("Calls shell entry, single tab, view menu with search, columns and sorting", async ({
  page,
}) => {
  await signUpNewUser(page);
  const org = await createOrganization(page);
  await page.goto(moduleListDefaultPath(org.slug, "Leads"));

  // SH-19, SH-22: Calls is an entry of the Activities group in the main navigation
  const nav = page.getByRole("navigation", { name: "Main navigation" });
  await expect(nav.getByRole("button", { name: "Activities" })).toHaveAttribute(
    "aria-expanded",
    "true",
  );
  await nav.getByRole("link", { name: "Calls", exact: true }).click();
  await expect(page).toHaveURL(/\/tab\/Calls\/list$/);
  const list = page.locator(".module-list-page");

  // CL-01: a single All Calls tab
  await expect(list.locator("[data-view-pill]")).toHaveText("All Calls");
  await expect(list.locator("[data-view-pill]")).toHaveCount(1);

  // CL-05 – CL-09: four view type tiles and the arrow, no Sheet or Timeline tile
  const switcher = list.locator("[data-view-type-switcher]");
  await expect(switcher.getByRole("button")).toHaveCount(5);
  await expect(switcher.getByRole("button", { name: "Grid presentation" })).toHaveCount(0);
  await expect(switcher.getByRole("button", { name: "Connected presentation" })).toHaveCount(0);
  await expect(switcher.getByRole("button", { name: "List presentation" })).toHaveAttribute(
    "data-active",
    "true",
  );

  // Default columns (view order for all-calls: Subject, Call Type, Call Start Time, Call Duration)
  for (const name of ["Subject", "Call Type", "Call Start Time", "Call Duration"]) {
    await expect(list.getByRole("columnheader", { name, exact: true })).toBeVisible();
  }
  await expect(list.getByRole("link", { name: "Create Call" })).toHaveAttribute(
    "href",
    /\/tab\/Calls\/create$/,
  );

  // CL-02: view menu
  await list.getByRole("button", { name: "Custom views" }).click();
  const search = page.getByRole("textbox", { name: "Search views" });
  await expect(search).toBeVisible();
  await search.fill("attended");
  await expect(page.getByRole("menuitem", { name: "Attended Calls", exact: true })).toBeVisible();
  await search.fill("");
  await expect(page.getByRole("menuitem", { name: "All Calls", exact: true })).toBeVisible();

  // Switch to Attended Calls
  await page.getByRole("menuitem", { name: "Attended Calls", exact: true }).click();
  await expect(page).toHaveURL(/\/custom-view\/attended-calls\/list/);
  await expect(list.locator("[data-view-pill]")).toHaveText("Attended Calls");

  // Sort by Subject (CL-04)
  await list.getByRole("button", { name: "Subject column options" }).click();
  await page.getByRole("menuitem", { name: "Asc", exact: true }).click();
  await expect(page).toHaveURL(/sort_by=Subject/);
});

test("Calls filters, paging, record route and related record link", async ({ page }) => {
  await signUpNewUser(page);
  const org = await createOrganization(page);
  await page.goto(moduleListDefaultPath(org.slug, "Calls"));
  const list = page.locator(".module-list-page");
  await expect(list.getByRole("table", { name: "Records" })).toBeVisible();

  // CL-13 – CL-29: filter panel inventory
  await expect(list.getByRole("heading", { name: "Filter Calls by" })).toBeVisible();
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
    "Call Agenda",
    "Call Duration",
    "Call Duration (in seconds)",
    "Call Owner",
    "Call Purpose",
    "Call Result",
    "Call Start Time",
    "Call Type",
    "Caller ID",
    "Contact Name",
  ]) {
    const row = fieldFilters.getByRole("checkbox", { name: label, exact: true });
    await row.scrollIntoViewIfNeeded();
    await expect(row).toBeVisible();
  }

  // Field filter: Subject text criterion matching nothing
  const filter = fieldFilters.getByRole("checkbox", { name: "Subject", exact: true });
  await filter.scrollIntoViewIfNeeded();
  await filter.focus();
  await page.keyboard.press("Space");
  await expect(filter).toBeChecked();
  await list
    .getByRole("textbox", { name: "Subject value" })
    .fill("Synthetic unmatched call subject");
  await list.getByRole("button", { name: "Apply Filter" }).click();
  await expect(list.getByText("No Calls found.")).toBeVisible();
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

  // Paging (CL-42 – CL-45)
  await page.goto(moduleListDefaultPath(org.slug, "Calls"));
  await expect(list.getByRole("table", { name: "Records" })).toBeVisible();
  await list.getByRole("link", { name: "Next" }).click();
  await expect(page).toHaveURL(/page=2/);

  // CL-38: Subject opens the call record route
  await list.locator("tbody tr").first().getByRole("link").first().click();
  await expect(page).toHaveURL(/\/tab\/Calls\/[^/?]+/);
  await expect(page.locator("[data-record-frame]")).toBeVisible();
});

test("Calls later-module controls stay inert and Actions lists the six rows", async ({ page }) => {
  await signUpNewUser(page);
  const org = await createOrganization(page);
  await page.goto(moduleListDefaultPath(org.slug, "Calls"));
  const list = page.locator(".module-list-page");
  await expect(list.getByRole("table", { name: "Records" })).toBeVisible();
  const before = page.url();

  // CL-11 (M6) and CL-30 (M11): nothing happens
  await list.getByRole("button", { name: "More", exact: true }).click({ force: true });
  await expect(page.getByRole("menu")).toHaveCount(0);
  await list.getByRole("button", { name: "View Settings" }).click({ force: true });
  await expect(page.getByRole("menu")).toHaveCount(0);
  expect(page.url()).toBe(before);

  // CL-12: Actions menu rows in reference order
  await list.getByRole("button", { name: "Actions", exact: true }).click();
  await expect(page.getByRole("menuitem")).toHaveText([
    "Mass Transfer",
    "Mass Delete",
    "Mass Update",
    "Manage Tags",
    "Export Calls",
    "Print View",
  ]);
  await page.getByRole("menuitem", { name: "Export Calls", exact: true }).click({ force: true });
  await expect(page.getByRole("menu")).toBeVisible();
  expect(page.url()).toBe(before);
});

test("Calls list measured evidence and row configuration", async ({ page }) => {
  await page.setViewportSize({ width: 1470, height: 835 });
  await signUpNewUser(page);
  const org = await createOrganization(page);
  await page.goto(moduleListDefaultPath(org.slug, "Calls"));
  const list = page.locator(".module-list-page");
  await expect(list.locator("tbody tr").first()).toBeVisible();
  await page.evaluate(() => document.fonts.ready);

  const row = list.locator("tbody tr").first();
  await row.hover();
  const edit = row.getByRole("link", { name: "Edit record" });
  await expect(edit).toHaveAttribute("href", /\/edit$/);
  await expect(list.locator("[data-part=related-pictogram]")).toHaveCount(0);

  if (process.env.MEP_LIST_EVIDENCE_DIR) {
    await page.screenshot({ path: join(process.env.MEP_LIST_EVIDENCE_DIR, "calls-list.png") });
  }

  await edit.click();
  await expect(page).toHaveURL(/\/tab\/Calls\/[^/]+\/edit$/);
  await expect(page.getByRole("button", { name: "Save", exact: true })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Subject", exact: true })).not.toHaveValue("");
});
