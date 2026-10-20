import { expect, test } from "./support/test";

test("clean local startup accepts admin / admin and opens the CRM", async ({ page }) => {
  test.skip(process.env.MEP_E2E_DEV_LOGIN !== "1", "Requires the local development startup");
  await page.goto("/sign-in");
  await expect(page.getByText("Local development: admin / admin")).toBeVisible();
  await page.getByRole("textbox", { name: "Email or username" }).fill("admin");
  await page.getByLabel("Password").fill("admin");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/crm\/dev-admin(?:\/|$)/);
  await expect(page.getByRole("navigation", { name: "Main navigation" })).toBeVisible();
});
