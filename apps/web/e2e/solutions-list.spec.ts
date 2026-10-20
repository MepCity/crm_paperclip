import { signUpNewUser } from "./support/auth";
import { moduleListDefaultPath } from "./support/crm-paths";
import { createOrganization } from "./support/org";
import { expect, test } from "./support/test";

test("Solutions shell entry, views, columns and sorting", async ({ page }) => {
  await signUpNewUser(page);
  const org = await createOrganization(page);
  await page.goto(moduleListDefaultPath(org.slug, "Leads"));
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("link", { name: "Solutions", exact: true })
    .click();
  await expect(page).toHaveURL(/\/tab\/Solutions\/list$/);
  const list = page.locator(".module-list-page");

  // SL-01 default view
  await expect(list.locator("[data-view-pill]")).toHaveText("All Solutions");
  for (const name of ["Solution Number", "Solution Title", "Status", "Solution Owner"]) {
    await expect(list.getByRole("columnheader", { name, exact: true })).toBeVisible();
  }

  // SL-02 menu
  await list.getByRole("button", { name: "Custom views" }).click();
  await expect(page.getByRole("menuitem")).toHaveCount(8);
  await page.getByRole("menuitem", { name: "My Solutions", exact: true }).click();
  await expect(list.locator("[data-view-pill]")).toHaveText("My Solutions");
  await expect(list.getByRole("columnheader", { name: "Solution Owner" })).toHaveCount(0);

  await list.getByRole("button", { name: "Custom views" }).click();
  await page.getByRole("menuitem", { name: "All Solutions", exact: true }).click();
  await expect(list.locator("[data-view-pill]")).toHaveText("All Solutions");

  // SL-04 sort
  await list.getByRole("button", { name: "Solution Title column options" }).click();
  await page.getByRole("menuitem", { name: "Asc", exact: true }).click();
  await expect(page).toHaveURL(/sort_by=Solution_Title/);
});

test("Solutions filter, alphabet, empty state and record route", async ({ page }) => {
  await signUpNewUser(page);
  const org = await createOrganization(page);
  await page.goto(moduleListDefaultPath(org.slug, "Solutions"));
  const list = page.locator(".module-list-page");
  await expect(list.getByRole("table", { name: "Records" })).toBeVisible();

  // SL-34 alphabet
  await list.getByRole("button", { name: "Filter by first letter" }).click();
  await page.getByRole("option", { name: "A", exact: true }).click();
  await expect(list.getByRole("button", { name: "Filter by first letter" })).toContainText("A");
  await list.getByRole("button", { name: "Filter by first letter" }).click();
  await page.getByRole("option", { name: "All", exact: true }).click();

  // Field filter with no match: SL-38, SL-39
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
    .filter({ has: page.getByRole("checkbox", { name: "Solution Title", exact: true }) });
  await nameRow.getByText("Solution Title", { exact: true }).click();
  await list
    .getByRole("textbox", { name: "Solution Title value" })
    .fill("Synthetic unmatched name");
  await list.getByRole("button", { name: "Apply Filter" }).click();
  await expect(list.getByText("No Solutions found.")).toBeVisible();
  await expect(list.getByRole("group", { name: "Records summary" })).toContainText(
    /Total Records\s*0/,
  );
  await list.getByRole("button", { name: "Clear", exact: true }).click();

  // Row link to detail
  const link = list.locator("tbody tr").first().getByRole("link").first();
  if ((await link.count()) > 0) {
    await link.click();
    await expect(page).toHaveURL(/\/tab\/Solutions\/[^/?]+/);
    await expect(page.locator("[data-record-frame]")).toBeVisible();
  }
});

test("Solutions Actions menu and later-module controls stay inert", async ({ page }) => {
  await signUpNewUser(page);
  const org = await createOrganization(page);
  await page.goto(moduleListDefaultPath(org.slug, "Solutions"));
  const list = page.locator(".module-list-page");
  await expect(list.getByRole("table", { name: "Records" })).toBeVisible();
  const before = page.url();

  // SL-13 (M6) and SL-32 (M11)
  await list.getByRole("button", { name: "More", exact: true }).click({ force: true });
  await expect(page.getByRole("menu")).toHaveCount(0);
  await list.getByRole("button", { name: "View Settings" }).click({ force: true });
  await expect(page.getByRole("menu")).toHaveCount(0);
  expect(page.url()).toBe(before);

  // SL-14
  await list.getByRole("button", { name: "Actions", exact: true }).click();
  await expect(page.getByRole("menuitem")).toHaveText([
    "Mass Transfer",
    "Mass Delete",
    "Mass Update",
    "Manage Tags",
    "Drafts",
    "Create Client Script",
    "Export Solutions",
    "Sheet view",
    "Print View",
  ]);
  await page.getByRole("menuitem", { name: "Manage Tags", exact: true }).click({ force: true });
  await expect(page.getByRole("menu")).toBeVisible();
  expect(page.url()).toBe(before);
});

test("Solutions Actions exports through the shared dialog", async ({ page }) => {
  await signUpNewUser(page);
  const org = await createOrganization(page);
  await page.goto(moduleListDefaultPath(org.slug, "Solutions"));
  const list = page.locator(".module-list-page");
  await expect(list.getByRole("table", { name: "Records" })).toBeVisible();
  await list.getByRole("button", { name: "Actions", exact: true }).click();
  await page.getByRole("menuitem", { name: "Export Solutions", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Export Solutions", exact: true });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("button", { name: /Select view/ })).toContainText("All Solutions");
  await expect(dialog.getByRole("radio", { name: "All fields", exact: true })).toBeChecked();
  await expect(dialog.getByRole("radio", { name: "Choose fields", exact: true })).toBeVisible();
  await expect(dialog.getByRole("radio", { name: "Exclude fields", exact: true })).toBeVisible();
  await expect(dialog.getByText("CSV", { exact: true })).toBeVisible();
  await expect(dialog.getByText("UTF-8", { exact: true })).toBeVisible();
  const responsePromise = page.waitForResponse(
    (response) =>
      response.url().includes("/crm/v2.2/Solutions/actions/export") &&
      response.request().method() === "POST",
  );
  await dialog.getByRole("button", { name: "Export", exact: true }).click();
  const response = await responsePromise;
  expect(response.status()).toBe(200);
  expect(await response.json()).toMatchObject({ module: "Solutions", status: "completed" });
  await expect(dialog).toBeHidden();
  await expect(page.getByText("Export completed", { exact: true })).toBeVisible();
  await page.goto(`/crm/${org.slug}/tab/Solutions/import`);
  await expect(page.getByRole("heading", { name: /404|not found/i })).toBeVisible();
});
