import { signUpNewUser } from "./support/auth";
import { moduleListDefaultPath, moduleRecordPath } from "./support/crm-paths";
import { createOrganization } from "./support/org";
import { expect, ignoreFailedResponses, test } from "./support/test";

const CONTACT_RECORD_ID = "300000000000000000";

test.describe("Campaigns links in Contacts", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1470, height: 835 });
  });

  test("Campaigns card adds, edits and removes a membership", async ({ page, pageErrors }) => {
    await signUpNewUser(page);
    const org = await createOrganization(page);
    await page.goto(moduleListDefaultPath(org.slug, "Contacts"));
    await expect(page.getByRole("table", { name: "Records" })).toBeVisible({ timeout: 15_000 });
    await page.goto(moduleRecordPath(org.slug, "Contacts", CONTACT_RECORD_ID));
    const card = page.locator("#related-list-campaigns");
    await expect(card.getByText("No records found")).toBeVisible();

    await card.getByRole("button", { name: "Add Campaigns" }).click();
    const dialog = page.getByRole("dialog", { name: "Add to Campaigns" });
    await expect(dialog).toBeVisible();
    await dialog.getByRole("row").nth(1).click();
    await dialog.getByRole("button", { name: "Add", exact: true }).click();
    await expect(dialog).toBeHidden();
    await expect(card.getByRole("row")).toHaveCount(2);

    await card.getByRole("button", { name: /^Edit / }).click();
    await page
      .getByRole("dialog", { name: "Edit Member Status" })
      .getByRole("button", { name: /Member Status/ })
      .click();
    await page.getByRole("option", { name: "Opened" }).click();
    await page.getByRole("button", { name: "Save" }).click();
    await expect(card.getByText("Opened")).toBeVisible();

    await card.getByRole("button", { name: /^Remove / }).click();
    await page.getByRole("button", { name: "Remove", exact: true }).click();
    await expect(card.getByText("No records found")).toBeVisible();
    ignoreFailedResponses(pageErrors, [400]);
  });

  test("Leads list bulk action adds the selected leads to a campaign", async ({
    page,
    pageErrors,
  }) => {
    await signUpNewUser(page);
    const org = await createOrganization(page);
    await page.goto(moduleListDefaultPath(org.slug, "Leads"));
    const table = page.getByRole("table", { name: "Records" });
    await expect(table).toBeVisible({ timeout: 15_000 });
    await table.getByRole("checkbox").nth(1).check({ force: true });
    await table.getByRole("checkbox").nth(2).check({ force: true });
    await page.getByRole("button", { name: "Actions" }).click();
    await page.getByRole("menuitem", { name: "Add to Campaigns" }).click();
    const dialog = page.getByRole("dialog", { name: "Add to Campaigns" });
    await expect(dialog).toBeVisible();
    await dialog.getByRole("row").nth(1).click();
    await dialog.getByRole("button", { name: "Add", exact: true }).click();
    await expect(dialog).toBeHidden();
    ignoreFailedResponses(pageErrors, [400]);
  });
});
