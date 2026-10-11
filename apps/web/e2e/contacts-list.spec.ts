import { signUpNewUser } from "./support/auth";
import { moduleListDefaultPath } from "./support/crm-paths";
import { createOrganization } from "./support/org";
import { expect, test } from "./support/test";

test("Contacts shell, views, sorting, filters, alphabet, paging and record route", async ({
  page,
}) => {
  await signUpNewUser(page);
  const org = await createOrganization(page);
  await page.goto(moduleListDefaultPath(org.slug, "Leads"));
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("link", { name: "Contacts", exact: true })
    .click();
  await expect(page).toHaveURL(/\/tab\/Contacts\/list$/);
  const list = page.locator(".module-list-page");
  await expect(list.locator("[data-view-pill]")).toHaveText("All Contacts");
  await expect(list.getByRole("columnheader", { name: "Contact Name", exact: true })).toBeVisible();
  await expect(list.getByRole("columnheader", { name: "Account Name", exact: true })).toBeVisible();
  await expect(list.getByRole("columnheader", { name: "Email", exact: true })).toBeVisible();
  await list.getByRole("button", { name: "Custom views" }).click();
  await expect(page.getByRole("menuitem")).toHaveCount(14);
  await page.getByRole("menuitem", { name: "My Contacts", exact: true }).click();
  await expect(list.locator("[data-view-pill]")).toHaveText("My Contacts");
  await list.getByRole("button", { name: "Custom views" }).click();
  await page.getByRole("menuitem", { name: "All Contacts", exact: true }).click();
  await list.getByRole("button", { name: "Contact Name column options" }).click();
  await page.getByRole("menuitem", { name: "Asc", exact: true }).click();
  await expect(page).toHaveURL(/sort_by=Full_Name/);
  await list.getByRole("button", { name: "Filter by first letter" }).click();
  await page.getByRole("option", { name: "A", exact: true }).click();
  await expect(list.getByRole("button", { name: "Filter by first letter" })).toContainText("A");
  await list.getByRole("button", { name: "Filter by first letter" }).click();
  await page.getByRole("option", { name: "All", exact: true }).click();
  const filter = list.getByRole("checkbox", { name: "Assistant", exact: true });
  await filter.scrollIntoViewIfNeeded();
  await filter.check({ force: true });
  await list
    .getByRole("textbox", { name: "Assistant value" })
    .fill("Synthetic unmatched assistant");
  await list.getByRole("button", { name: "Apply Filter" }).click();
  await expect(list.getByText("No Contacts found.")).toBeVisible();
  await list.getByRole("button", { name: "Clear", exact: true }).click();
  await expect(list.locator("tbody tr").first()).toBeVisible();
  await list.getByRole("link", { name: "Next" }).click();
  await expect(page).toHaveURL(/page=2/);
  await list.locator("tbody tr").first().getByRole("link").first().click();
  await expect(page).toHaveURL(/\/tab\/Contacts\/[^/?]+/);
  await expect(page.getByRole("heading", { name: "Contacts", exact: true })).toBeVisible();
});

test("Contacts later-module inventory stays inert and mass flows reuse selection dialogs", async ({
  page,
}) => {
  await signUpNewUser(page);
  const org = await createOrganization(page);
  await page.goto(moduleListDefaultPath(org.slug, "Contacts"));
  const list = page.locator(".module-list-page");
  await expect(list.getByRole("table", { name: "Records" })).toBeVisible();
  const before = page.url();
  await list.getByRole("button", { name: "More", exact: true }).click({ force: true });
  await expect(page.getByRole("menu")).toHaveCount(0);
  expect(page.url()).toBe(before);
  await list.getByRole("button", { name: "View Settings" }).click({ force: true });
  await expect(page.getByRole("menu")).toHaveCount(0);
  await list.getByRole("button", { name: "Actions", exact: true }).click();
  await expect(page.getByRole("menuitem")).toHaveText([
    "Mass Transfer",
    "Mass Delete",
    "Mass Update",
    "Manage Tags",
    "Drafts",
    "Mass Email",
    "Approve Contacts",
    "Deduplicate Contacts",
    "Add to Campaigns",
    "Create Client Script",
    "Export Contacts",
    "Sheet view",
    "Print View",
  ]);
  await page.getByRole("menuitem", { name: "Manage Tags", exact: true }).click({ force: true });
  await expect(page.getByRole("menu")).toBeVisible();
  expect(page.url()).toBe(before);
  await page.getByRole("menuitem", { name: "Mass Update", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Mass Update" })).toBeVisible();
  await page.getByRole("dialog").getByRole("button", { name: "Cancel" }).click();
  await expect(list.locator("[data-selection-bar]")).toBeVisible();
});
