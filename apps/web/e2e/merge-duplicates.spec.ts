import { signUpNewUser } from "./support/auth";
import { moduleListDefaultPath } from "./support/crm-paths";
import { createOrganization } from "./support/org";
import { expect, ignoreFailedResponses, test } from "./support/test";

const CONTACTS_TAB = "Contacts";
const LEADS_TAB = "Leads";

test.describe("Find and merge duplicates", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1470, height: 835 });
  });

  test("Contacts: detail menu opens merge flow, searches, and merges records end-to-end", async ({
    page,
    pageErrors,
  }) => {
    await signUpNewUser(page);
    const org = await createOrganization(page);
    await page.goto(moduleListDefaultPath(org.slug, CONTACTS_TAB));
    await expect(page.getByRole("table", { name: "Records" })).toBeVisible({ timeout: 15_000 });

    const firstRowLink = page.locator("table tbody tr").first().getByRole("link").first();
    const masterName = (await firstRowLink.innerText()).trim();

    await firstRowLink.click();
    await expect(page.locator("[data-record-frame]")).toBeVisible({ timeout: 15_000 });
    const masterUrl = page.url();

    await page.getByRole("button", { name: "More Options" }).click();
    await page.getByRole("menuitem", { name: "Find and Merge Duplicates" }).click();
    await expect(page.getByRole("heading", { name: "Find and Merge Duplicates" })).toBeVisible();

    // Filter by Last Name contains "Contact" so multiple records match
    const valueInputs = page.getByRole("textbox", { name: "Value field" });
    await valueInputs.nth(0).fill("");
    await valueInputs.nth(1).fill("Contact");
    await valueInputs.nth(2).fill("");
    await valueInputs.nth(3).fill("");
    await valueInputs.nth(4).fill("");
    await valueInputs.nth(5).fill("");

    await page.getByRole("button", { name: "Search" }).click();
    await expect(page.getByRole("table", { name: "Matching records" })).toBeVisible();

    // Select second record row to reach 2 selected records
    const matchingRows = page.locator("table[aria-label='Matching records'] tbody tr");
    await expect(matchingRows.first()).toBeVisible({ timeout: 10_000 });
    await expect(matchingRows.nth(1)).toBeVisible();
    const duplicateName = (await matchingRows.nth(1).locator("td").nth(1).innerText()).trim();
    await matchingRows.nth(1).locator("label").click();
    await expect(page.getByText("2 records selected")).toBeVisible();

    // Proceed to comparison screen
    const nextButton = page.getByRole("button", { name: "Next", exact: true });
    await expect(nextButton).toBeEnabled();
    await nextButton.click();

    // Verify comparison screen controls
    await expect(page.getByRole("heading", { name: "Merge Records" })).toBeVisible();
    await expect(page.getByRole("checkbox", { name: "Show Conflicts Only" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Merge information" })).toBeVisible();

    // Trigger merge confirmation dialog
    await page.getByRole("button", { name: "Merge", exact: true }).click();
    const dialog = page.getByRole("alertdialog");
    await expect(dialog).toBeVisible();
    await expect(
      dialog.getByText("Are you sure you want to merge the selected records?"),
    ).toBeVisible();
    await dialog.getByRole("button", { name: "Merge", exact: true }).click();

    // After merge, redirect back to master record detail
    await expect(page).toHaveURL(masterUrl, { timeout: 15_000 });
    await expect(page.locator("[data-record-frame]")).toBeVisible();

    // Verify duplicate record is removed from list view and master remains
    await page.goto(moduleListDefaultPath(org.slug, CONTACTS_TAB));
    await expect(page.getByRole("table", { name: "Records" })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("link", { name: masterName }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: duplicateName })).toHaveCount(0);

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
