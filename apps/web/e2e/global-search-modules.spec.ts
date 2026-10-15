import { signUpNewUser } from "./support/auth";
import { createOrganization } from "./support/org";
import { expect, test } from "./support/test";

test("search finds an Account by partial name and opens the Accounts record detail", async ({
  page,
}) => {
  await signUpNewUser(page);
  await createOrganization(page);

  await page.getByRole("button", { name: "Search records" }).click();
  const dialog = page.getByRole("dialog", { name: "Search records" });
  await dialog.getByRole("textbox", { name: "Search records" }).fill("Account 001");

  await expect(dialog.getByRole("region", { name: "Accounts" })).toBeVisible();
  const accountLink = dialog
    .getByRole("region", { name: "Accounts" })
    .getByRole("link", { name: /Account 001/ });
  await expect(accountLink).toBeVisible();
  await accountLink.click();

  await expect(page).toHaveURL(/\/tab\/Accounts\/[^/]+$/);
  await expect(page.locator("[data-record-header]")).toContainText("Account 001");
});

test("search finds a Deal by partial name and opens the Deals record detail", async ({ page }) => {
  await signUpNewUser(page);
  await createOrganization(page);

  await page.getByRole("button", { name: "Search records" }).click();
  const dialog = page.getByRole("dialog", { name: "Search records" });
  await dialog.getByRole("textbox", { name: "Search records" }).fill("Deal 001");

  await expect(dialog.getByRole("region", { name: "Deals" })).toBeVisible();
  const dealLink = dialog
    .getByRole("region", { name: "Deals" })
    .getByRole("link", { name: /Deal 001/ });
  await expect(dealLink).toBeVisible();
  await dealLink.click();

  await expect(page).toHaveURL(/\/tab\/Deals\/[^/]+$/);
  await expect(page.locator("[data-record-header]")).toContainText("Deal 001");
});

test("search displays empty state when no records match query", async ({ page }) => {
  await signUpNewUser(page);
  await createOrganization(page);

  await page.getByRole("button", { name: "Search records" }).click();
  const dialog = page.getByRole("dialog", { name: "Search records" });
  await dialog.getByRole("textbox", { name: "Search records" }).fill("NonexistentQueryXyz");

  await expect(dialog.getByText("No records found.")).toBeVisible();
  await expect(dialog.getByRole("region", { name: "Accounts" })).toBeHidden();
  await expect(dialog.getByRole("region", { name: "Deals" })).toBeHidden();
});
