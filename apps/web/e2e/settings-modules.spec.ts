import { signUpNewUser } from "./support/auth";
import { createOrganization } from "./support/org";
import { expect, test } from "./support/test";

test("Modules and Fields settings screen opens from navigation and searches", async ({ page }) => {
  const failed: string[] = [];
  page.on("response", (res) => {
    if (res.status() >= 400) failed.push(`${res.status()} ${res.url()}`);
  });
  await signUpNewUser(page);
  const org = await createOrganization(page);
  await page.goto(`/crm/${org.slug}/settings`);
  await page.getByRole("link", { name: "Modules and Fields" }).click();
  await expect(page.getByRole("columnheader", { name: "Module Name" })).toBeVisible();
  await expect(page.getByRole("cell", { name: "Leads", exact: true }).first()).toBeVisible();
  await page.getByRole("searchbox", { name: "Search modules" }).fill("zzz");
  await expect(page.getByText("No modules found")).toBeVisible();
  expect(failed).toEqual([]);
});

test("Leads Fields sub-page opens from the module list and searches", async ({ page }) => {
  const failed: string[] = [];
  page.on("response", (res) => {
    if (res.status() >= 400) failed.push(`${res.status()} ${res.url()}`);
  });
  await signUpNewUser(page);
  const org = await createOrganization(page);
  await page.goto(`/crm/${org.slug}/settings/modules`);
  await page.locator("#main-content").getByRole("link", { name: "Leads", exact: true }).click();
  await expect(page.getByRole("columnheader", { name: "Data Type" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Create and Edit Fields" })).toBeDisabled();
  await page.getByRole("searchbox", { name: "Search Fields or Data Types" }).fill("zzz");
  await expect(page.getByText("No fields found")).toBeVisible();
  await page.getByRole("link", { name: "Back to Modules" }).click();
  await expect(page.getByRole("columnheader", { name: "Module Name" })).toBeVisible();
  expect(failed).toEqual([]);
});

test("Contacts Fields and Accounts Layouts open, show correct sidebar selection, and switch tabs", async ({
  page,
}) => {
  const failed: string[] = [];
  page.on("response", (res) => {
    if (res.status() >= 400) failed.push(`${res.status()} ${res.url()}`);
  });
  await signUpNewUser(page);
  const org = await createOrganization(page);

  // 1. Open Contacts Fields
  await page.goto(`/crm/${org.slug}/settings/modules/Contacts/fields`);
  await expect(page.getByRole("heading", { name: "Contacts" })).toBeVisible();
  const contactsNav = page.getByRole("navigation", { name: "Modules" });
  await expect(contactsNav.locator('[aria-current="page"]')).toHaveText("Contacts");
  await expect(page.getByRole("tab", { name: "Fields", exact: true })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(page.getByRole("columnheader", { name: "Data Type" })).toBeVisible();

  // Switch to Layouts tab
  await page.getByRole("tab", { name: "Layouts", exact: true }).click();
  await expect(page).toHaveURL(`/crm/${org.slug}/settings/modules/Contacts/layouts`);
  await expect(page.getByRole("heading", { name: "Contacts" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Layouts", exact: true })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(contactsNav.locator('[aria-current="page"]')).toHaveText("Contacts");
  await expect(page.getByRole("columnheader", { name: "Name" })).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Shared To" })).toBeVisible();
  await expect(page.getByRole("button", { name: "More" })).toHaveCount(0);

  // 2. Open Accounts Layouts
  await page.goto(`/crm/${org.slug}/settings/modules/Accounts/layouts`);
  await expect(page.getByRole("heading", { name: "Accounts" })).toBeVisible();
  const accountsNav = page.getByRole("navigation", { name: "Modules" });
  await expect(accountsNav.locator('[aria-current="page"]')).toHaveText("Accounts");
  await expect(page.getByRole("tab", { name: "Layouts", exact: true })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(page.getByRole("button", { name: "More" })).toHaveCount(0);

  // Switch to Fields tab from Accounts Layouts
  await page.getByRole("tab", { name: "Fields", exact: true }).click();
  await expect(page).toHaveURL(`/crm/${org.slug}/settings/modules/Accounts/fields`);
  await expect(page.getByRole("heading", { name: "Accounts" })).toBeVisible();
  await expect(accountsNav.locator('[aria-current="page"]')).toHaveText("Accounts");
  await expect(page.getByRole("tab", { name: "Fields", exact: true })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(page.getByRole("cell", { name: "Account Name" })).toBeVisible();

  expect(failed).toEqual([]);
});

test("Leads Layouts shows More menu beside layout name", async ({ page }) => {
  const failed: string[] = [];
  page.on("response", (res) => {
    if (res.status() >= 400) failed.push(`${res.status()} ${res.url()}`);
  });
  await signUpNewUser(page);
  const org = await createOrganization(page);

  await page.goto(`/crm/${org.slug}/settings/modules/Leads/layouts`);
  await expect(page.getByRole("heading", { name: "Leads" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Layouts", exact: true })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(page.getByRole("button", { name: "More" })).toBeVisible();
  expect(failed).toEqual([]);
});
