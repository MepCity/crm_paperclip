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
  await page.getByRole("link", { name: "Leads", exact: true }).click();
  await expect(page.getByRole("columnheader", { name: "Data Type" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Create and Edit Fields" })).toBeDisabled();
  await page.getByRole("searchbox", { name: "Search Fields or Data Types" }).fill("zzz");
  await expect(page.getByText("No fields found")).toBeVisible();
  await page.getByRole("link", { name: "Back to Modules" }).click();
  await expect(page.getByRole("columnheader", { name: "Module Name" })).toBeVisible();
  expect(failed).toEqual([]);
});
