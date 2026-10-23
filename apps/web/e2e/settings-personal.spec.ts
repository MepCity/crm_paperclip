import { signUpNewUser } from "./support/auth";
import { createOrganization } from "./support/org";
import { expect, test } from "./support/test";

test("Personal Settings opens from its route and shows Locale Information", async ({ page }) => {
  const failed: string[] = [];
  page.on("response", (res) => {
    if (res.status() >= 400) failed.push(`${res.status()} ${res.url()}`);
  });
  await signUpNewUser(page);
  const org = await createOrganization(page);
  await page.goto(`/crm/${org.slug}/settings/personal-settings`);
  await expect(page.getByRole("heading", { name: "Locale Information" })).toBeVisible();
  await expect(page.getByText("Number Format", { exact: true })).toBeVisible();
  expect(failed).toEqual([]);
});
