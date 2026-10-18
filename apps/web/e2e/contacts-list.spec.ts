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
  await expect(page).toHaveURL(/\/custom-view\/all-contacts\/list$/);
  await expect(list.locator("[data-view-pill]")).toHaveText("All Contacts");
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
  await expect(page.locator("[data-record-frame]")).toBeVisible();
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
  const print = page.getByRole("menuitem", { name: "Print View", exact: true });
  await expect(print.locator("svg")).toBeVisible();
  await print.click();
  const printMenu = page.getByRole("menu", { name: "Print View", exact: true });
  await expect(printMenu.getByRole("menuitem")).toHaveText([
    "Print Default view",
    "Print Using Canvas",
  ]);
  for (const name of ["Print Default view", "Print Using Canvas"]) {
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
  await list
    .locator("tbody")
    .getByRole("checkbox", { name: /Select / })
    .first()
    .check({ force: true });
  await expect(list.locator("[data-selection-bar]")).toContainText("1 Record Selected.");
  await list.getByRole("button", { name: "Mass Update", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Mass Update" })).toBeVisible();
  await page.getByRole("dialog").getByRole("button", { name: "Cancel" }).click();
  for (const [action, role, title] of [
    ["Change Owner", "dialog", "Change Owner"],
    ["Delete", "alertdialog", "Delete Contact"],
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

test("navigates from Account Name cell in Contacts list to Account record detail and filters by Account Name", async ({
  page,
}) => {
  await signUpNewUser(page);
  const org = await createOrganization(page);
  await page.goto(moduleListDefaultPath(org.slug, "Contacts"));
  const list = page.locator(".module-list-page");
  await expect(list.getByRole("table", { name: "Records" })).toBeVisible();
  const accountLink = list
    .locator("tbody tr")
    .getByRole("link", { name: /Account \d+/ })
    .first();
  await expect(accountLink).toBeVisible();
  const accountName = (await accountLink.innerText()).trim();
  await accountLink.click();
  await expect(page).toHaveURL(/\/tab\/Accounts\/[^/?]+/);
  await expect(page.locator("[data-record-frame]")).toBeVisible();
  await expect(page.locator("[data-record-header]")).toContainText(accountName);

  await page.goto(moduleListDefaultPath(org.slug, "Contacts"));
  await expect(list.getByRole("table", { name: "Records" })).toBeVisible();
  const filter = list.getByRole("checkbox", { name: "Account Name", exact: true });
  await filter.scrollIntoViewIfNeeded();
  await filter.check({ force: true });
  await list.getByRole("textbox", { name: "Account Name value" }).fill(accountName);
  await list.getByRole("button", { name: "Apply Filter" }).click();
  await expect(list.locator("tbody tr").first()).toBeVisible();
  await expect(list.locator("tbody tr").first()).toContainText(accountName);
});

test("applies Campaigns system filter to Contacts list and restores on Clear", async ({ page }) => {
  await signUpNewUser(page);
  const org = await createOrganization(page);
  await page.goto(moduleListDefaultPath(org.slug, "Contacts"));
  const list = page.locator(".module-list-page");
  await expect(list.getByRole("table", { name: "Records" })).toBeVisible();
  const initialRowCount = await list.locator("tbody tr").count();

  const campaignsCheckbox = list.getByRole("checkbox", { name: "Campaigns", exact: true });
  await campaignsCheckbox.scrollIntoViewIfNeeded();
  await campaignsCheckbox.check({ force: true });

  const campaignTrigger = list.getByRole("button", { name: "Campaign Name" });
  await expect(campaignTrigger).toBeVisible();
  await campaignTrigger.click();

  const campaignOption = page.getByRole("option", { name: "Campaign 001" });
  await expect(campaignOption).toBeVisible();
  await campaignOption.click();
  await page.keyboard.press("Escape");

  await list.getByRole("button", { name: "Apply Filter" }).click();
  await expect(list.locator("tbody tr")).toHaveCount(1);
  await expect(list.locator("[data-part=total-value]")).toHaveText("1");

  await list.getByRole("button", { name: "Clear", exact: true }).click();
  await expect(list.locator("tbody tr")).toHaveCount(initialRowCount);
});
