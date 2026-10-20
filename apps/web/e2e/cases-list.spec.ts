import { signUpNewUser } from "./support/auth";
import { moduleListDefaultPath } from "./support/crm-paths";
import { createOrganization } from "./support/org";
import { expect, test } from "./support/test";

test("Cases shell entry, views, columns and sorting", async ({ page }) => {
  await signUpNewUser(page);
  const org = await createOrganization(page);
  await page.goto(moduleListDefaultPath(org.slug, "Leads"));
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("link", { name: "Cases", exact: true })
    .click();
  await expect(page).toHaveURL(/\/tab\/Cases\/list$/);
  const list = page.locator(".module-list-page");

  // KL-01 default view
  await expect(list.locator("[data-view-pill]")).toHaveText("All Cases");
  for (const name of ["Case Number", "Subject", "Status", "Priority"]) {
    await expect(list.getByRole("columnheader", { name, exact: true })).toBeVisible();
  }

  // KL-02 menu
  await list.getByRole("button", { name: "Custom views" }).click();
  await expect(page.getByRole("menuitem")).toHaveCount(12);
  await page.getByRole("menuitem", { name: "Escalated Cases", exact: true }).click();
  await expect(list.locator("[data-view-pill]")).toHaveText("Escalated Cases");
  await expect(list.getByRole("columnheader", { name: "Case Origin" })).toBeVisible();

  await list.getByRole("button", { name: "Custom views" }).click();
  await page.getByRole("menuitem", { name: "All Cases", exact: true }).click();
  await expect(list.locator("[data-view-pill]")).toHaveText("All Cases");

  // KL-04 sort
  await list.getByRole("button", { name: "Subject column options" }).click();
  await page.getByRole("menuitem", { name: "Asc", exact: true }).click();
  await expect(page).toHaveURL(/sort_by=Subject/);
});

test("Cases filter, alphabet, empty state and record route", async ({ page }) => {
  await signUpNewUser(page);
  const org = await createOrganization(page);
  await page.goto(moduleListDefaultPath(org.slug, "Cases"));
  const list = page.locator(".module-list-page");
  await expect(list.getByRole("table", { name: "Records" })).toBeVisible();

  // KL-34 alphabet
  await list.getByRole("button", { name: "Filter by first letter" }).click();
  await page.getByRole("option", { name: "A", exact: true }).click();
  await expect(list.getByRole("button", { name: "Filter by first letter" })).toContainText("A");
  await list.getByRole("button", { name: "Filter by first letter" }).click();
  await page.getByRole("option", { name: "All", exact: true }).click();

  // Field filter with no match: KL-38, KL-39
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
    .filter({ has: page.getByRole("checkbox", { name: "Subject", exact: true }) });
  await nameRow.getByText("Subject", { exact: true }).click();
  await list.getByRole("textbox", { name: "Subject value" }).fill("Synthetic unmatched name");
  await list.getByRole("button", { name: "Apply Filter" }).click();
  await expect(list.getByText("No Cases found.")).toBeVisible();
  await expect(list.getByRole("group", { name: "Records summary" })).toContainText(
    /Total Records\s*0/,
  );
  await list.getByRole("button", { name: "Clear", exact: true }).click();

  // Row link to detail
  const link = list.locator("tbody tr").first().getByRole("link").first();
  if ((await link.count()) > 0) {
    await link.click();
    await expect(page).toHaveURL(/\/tab\/Cases\/[^/?]+/);
    await expect(page.locator("[data-record-frame]")).toBeVisible();
  }
});

test("Cases Actions menu and later-module controls stay inert", async ({ page }) => {
  await signUpNewUser(page);
  const org = await createOrganization(page);
  await page.goto(moduleListDefaultPath(org.slug, "Cases"));
  const list = page.locator(".module-list-page");
  await expect(list.getByRole("table", { name: "Records" })).toBeVisible();
  const before = page.url();

  // KL-13 (M6) and KL-32 (M11)
  await list.getByRole("button", { name: "More", exact: true }).click({ force: true });
  await expect(page.getByRole("menu")).toHaveCount(0);
  await list.getByRole("button", { name: "View Settings" }).click({ force: true });
  await expect(page.getByRole("menu")).toHaveCount(0);
  expect(page.url()).toBe(before);

  // KL-14
  await list.getByRole("button", { name: "Actions", exact: true }).click();
  await expect(page.getByRole("menuitem")).toHaveText([
    "Mass Transfer",
    "Mass Delete",
    "Mass Update",
    "Manage Tags",
    "Drafts",
    "Mass Email",
    "Approve Cases",
    "Create Client Script",
    "Export Cases",
    "Sheet view",
    "Print View",
  ]);
  await page.getByRole("menuitem", { name: "Manage Tags", exact: true }).click({ force: true });
  await expect(page.getByRole("menu")).toBeVisible();
  expect(page.url()).toBe(before);
});

test("Cases Actions exports through the shared dialog", async ({ page }) => {
  await signUpNewUser(page);
  const org = await createOrganization(page);
  await page.goto(moduleListDefaultPath(org.slug, "Cases"));
  const list = page.locator(".module-list-page");
  await expect(list.getByRole("table", { name: "Records" })).toBeVisible();
  await list.getByRole("button", { name: "Actions", exact: true }).click();
  await page.getByRole("menuitem", { name: "Export Cases", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Export Cases", exact: true });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("button", { name: /Select view/ })).toContainText("All Cases");
  await expect(dialog.getByRole("radio", { name: "All fields", exact: true })).toBeChecked();
  await expect(dialog.getByRole("radio", { name: "Choose fields", exact: true })).toBeVisible();
  await expect(dialog.getByRole("radio", { name: "Exclude fields", exact: true })).toBeVisible();
  await expect(dialog.getByText("CSV", { exact: true })).toBeVisible();
  const responsePromise = page.waitForResponse(
    (response) =>
      response.url().includes("/crm/v2.2/Cases/actions/export") &&
      response.request().method() === "POST",
  );
  await dialog.getByRole("button", { name: "Export", exact: true }).click();
  const response = await responsePromise;
  expect(response.status()).toBe(200);
  expect(await response.json()).toMatchObject({ module: "Cases", status: "completed" });
  await expect(dialog).toBeHidden();
  await expect(page.getByText("Export completed", { exact: true })).toBeVisible();
  await page.goto(`/crm/${org.slug}/tab/Cases/import`);
  await expect(page.getByRole("heading", { name: /404|not found/i })).toBeVisible();
});
