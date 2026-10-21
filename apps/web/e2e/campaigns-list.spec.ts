import { signUpNewUser } from "./support/auth";
import { moduleListDefaultPath } from "./support/crm-paths";
import { createOrganization } from "./support/org";
import { expect, test } from "./support/test";

test("Campaigns shell entry, views, columns and sorting", async ({ page }) => {
  await signUpNewUser(page);
  const org = await createOrganization(page);
  await page.goto(moduleListDefaultPath(org.slug, "Leads"));
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("link", { name: "Campaigns", exact: true })
    .click();
  await expect(page).toHaveURL(/\/tab\/Campaigns\/list$/);
  const list = page.locator(".module-list-page");

  // CL-01 default view
  await expect(list.locator("[data-view-pill]")).toHaveText("All Campaigns");
  for (const name of [
    "Campaign Name",
    "Type",
    "Status",
    "Start Date",
    "End Date",
    "Campaign Owner",
  ]) {
    await expect(list.getByRole("columnheader", { name, exact: true })).toBeVisible();
  }

  // CL-02 menu
  await list.getByRole("button", { name: "Custom views" }).click();
  await expect(page.getByRole("menuitem")).toHaveCount(8);
  await page.getByRole("menuitem", { name: "All Active Campaigns", exact: true }).click();
  await expect(list.locator("[data-view-pill]")).toHaveText("All Active Campaigns");

  await list.getByRole("button", { name: "Custom views" }).click();
  await page.getByRole("menuitem", { name: "My Active Campaigns", exact: true }).click();
  await expect(list.locator("[data-view-pill]")).toHaveText("My Active Campaigns");
  await expect(list.getByRole("columnheader", { name: "Campaign Owner" })).toHaveCount(0);

  await list.getByRole("button", { name: "Custom views" }).click();
  await page.getByRole("menuitem", { name: "All Campaigns", exact: true }).click();
  await expect(list.locator("[data-view-pill]")).toHaveText("All Campaigns");

  // CL-04 sort
  await list.getByRole("button", { name: "Campaign Name column options" }).click();
  await page.getByRole("menuitem", { name: "Asc", exact: true }).click();
  await expect(page).toHaveURL(/sort_by=Campaign_Name/);
});

test("Campaigns filter, alphabet, empty state and record route", async ({ page }) => {
  await signUpNewUser(page);
  const org = await createOrganization(page);
  await page.goto(moduleListDefaultPath(org.slug, "Campaigns"));
  const list = page.locator(".module-list-page");
  await expect(list.getByRole("table", { name: "Records" })).toBeVisible();

  // CL-34 alphabet
  await list.getByRole("button", { name: "Filter by first letter" }).click();
  await page.getByRole("option", { name: "A", exact: true }).click();
  await expect(list.getByRole("button", { name: "Filter by first letter" })).toContainText("A");
  await list.getByRole("button", { name: "Filter by first letter" }).click();
  await page.getByRole("option", { name: "All", exact: true }).click();

  // Field filter with no match: CL-38, CL-39
  const statusRow = list
    .getByRole("listitem")
    .filter({ has: page.getByRole("checkbox", { name: "Status", exact: true }) });
  await statusRow.scrollIntoViewIfNeeded();
  await statusRow.getByText("Status", { exact: true }).click();
  await list.getByRole("button", { name: "Status value", exact: true }).click();
  await page.locator(".filter-choice-popover").getByRole("option").nth(1).click();
  await page.keyboard.press("Escape");
  const nameRow = list
    .getByRole("listitem")
    .filter({ has: page.getByRole("checkbox", { name: "Campaign Name", exact: true }) });
  await nameRow.getByText("Campaign Name", { exact: true }).click();
  await list.getByRole("textbox", { name: "Campaign Name value" }).fill("Synthetic unmatched name");
  await list.getByRole("button", { name: "Apply Filter" }).click();
  await expect(list.getByText("No Campaigns found.")).toBeVisible();
  await expect(list.getByRole("group", { name: "Records summary" })).toContainText(
    /Total Records\s*0/,
  );
  await list.getByRole("button", { name: "Clear", exact: true }).click();

  // Row link to detail
  const link = list.locator("tbody tr").first().getByRole("link").first();
  if ((await link.count()) > 0) {
    await link.click();
    await expect(page).toHaveURL(/\/tab\/Campaigns\/[^/?]+/);
    await expect(page.locator("[data-record-frame]")).toBeVisible();
  }
});

test("Campaigns Actions menu and later-module controls stay inert", async ({ page }) => {
  await signUpNewUser(page);
  const org = await createOrganization(page);
  await page.goto(moduleListDefaultPath(org.slug, "Campaigns"));
  const list = page.locator(".module-list-page");
  await expect(list.getByRole("table", { name: "Records" })).toBeVisible();
  const before = page.url();

  // CL-13 (M6) and CL-32 (M11)
  await list.getByRole("button", { name: "More", exact: true }).click({ force: true });
  await expect(page.getByRole("menu")).toHaveCount(0);
  await list.getByRole("button", { name: "View Settings" }).click({ force: true });
  await expect(page.getByRole("menu")).toHaveCount(0);
  expect(page.url()).toBe(before);

  // CL-14
  await list.getByRole("button", { name: "Actions", exact: true }).click();
  await expect(page.getByRole("menuitem")).toHaveText([
    "Mass Transfer",
    "Mass Delete",
    "Mass Update",
    "Manage Tags",
    "Drafts",
    "Create Client Script",
    "Export Campaigns",
    "Sheet view",
    "Print View",
  ]);
  await page.getByRole("menuitem", { name: "Manage Tags", exact: true }).click({ force: true });
  await expect(page.getByRole("menu")).toBeVisible();
  expect(page.url()).toBe(before);
});
