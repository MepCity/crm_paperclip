import { signUpNewUser } from "./support/auth";
import {
  moduleListDefaultPath,
  moduleRecordMergePath,
  moduleRecordPath,
} from "./support/crm-paths";
import { createOrganization } from "./support/org";
import { expect, ignoreFailedResponses, test } from "./support/test";

const CONTACTS_TAB = "Contacts";
const LEADS_TAB = "Leads";
const CONTACT_ID = "300000000000000000";

test.describe("Find and merge duplicates", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1470, height: 835 });
  });

  test("Contacts: detail menu opens merge flow and searches", async ({ page, pageErrors }) => {
    await signUpNewUser(page);
    const org = await createOrganization(page);
    await page.goto(moduleRecordPath(org.slug, CONTACTS_TAB, CONTACT_ID));
    await expect(page.locator("[data-record-frame]")).toBeVisible({ timeout: 15_000 });
    await page.getByRole("button", { name: "More Options" }).click();
    await page.getByRole("menuitem", { name: "Find and Merge Duplicates" }).click();
    await expect(page.getByRole("heading", { name: "Find and Merge Duplicates" })).toBeVisible();
    await expect(page).toHaveURL(
      moduleRecordMergePath(org.slug, CONTACTS_TAB, CONTACT_ID),
    );
    await page.getByRole("button", { name: "Search" }).click();
    await expect(page.getByRole("table", { name: "Matching records" })).toBeVisible();
    ignoreFailedResponses(pageErrors, [400]);
  });

  test("Leads: More Options opens merge route", async ({ page, pageErrors }) => {
    await signUpNewUser(page);
    const org = await createOrganization(page);
    await page.goto(moduleListDefaultPath(org.slug, LEADS_TAB));
    await expect(page.getByRole("table", { name: "Records" })).toBeVisible({ timeout: 15_000 });
    await page.locator("table tbody tr").first().getByRole("link").first().click();
    await expect(page.locator("[data-record-frame]")).toBeVisible();
    await page.getByRole("button", { name: "More Options" }).click();
    await page.getByRole("menuitem", { name: "Find and Merge Duplicates" }).click();
    await expect(page.getByRole("heading", { name: "Find and Merge Duplicates" })).toBeVisible();
    ignoreFailedResponses(pageErrors, [400]);
  });
});
