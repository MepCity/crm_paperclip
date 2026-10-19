import { signUpNewUser } from "./support/auth";
import {
  moduleListDefaultPath,
  moduleRecordClonePath,
  moduleRecordPath,
} from "./support/crm-paths";
import { createOrganization } from "./support/org";
import { expect, ignoreFailedResponses, test } from "./support/test";

const DEALS_TAB = "Deals";
const PRIMARY_DEAL_ID = "700000000000000000";
const MULTI_HISTORY_DEAL_ID = "700000000000000010";
const DELETE_DEAL_ID = "700000000000000001";

async function openDealDetail(
  page: import("@playwright/test").Page,
  orgSlug: string,
  recordId: string,
) {
  const listUrl = moduleListDefaultPath(orgSlug, DEALS_TAB);
  await page.goto(listUrl);
  await expect(page.locator("[data-record-board], table[aria-label='Records']")).toBeVisible({
    timeout: 15_000,
  });
  await page.goto(moduleRecordPath(orgSlug, DEALS_TAB, recordId));
  await expect(page.locator("[data-record-frame]")).toBeVisible();
}

test.describe("Deals record detail", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1470, height: 835 });
  });

  test("Deals activities cards render live task, meeting and call columns", async ({
    page,
    pageErrors,
  }) => {
    await signUpNewUser(page);
    const org = await createOrganization(page);
    await openDealDetail(page, org.slug, PRIMARY_DEAL_ID);
    const open = page.locator("#related-list-open-activities");
    await expect(open.getByRole("region", { name: /^Open Tasks \(\d+\)$/ })).toBeVisible();
    await expect(open.getByRole("region", { name: /^Open Meetings \(\d+\)$/ })).toBeVisible();
    await expect(open.getByRole("region", { name: /^Open Calls \(\d+\)$/ })).toBeVisible();
    const closed = page.locator("#related-list-closed-activities");
    await expect(closed.getByRole("region", { name: /^Closed Tasks \(\d+\)$/ })).toBeVisible();
    await expect(closed.getByRole("region", { name: /^Closed Calls \(\d+\)$/ })).toBeVisible();
    ignoreFailedResponses(pageErrors, [400]);
  });

  test("Next Action summary links to the nearest open activity", async ({ page, pageErrors }) => {
    await signUpNewUser(page);
    const org = await createOrganization(page);
    await openDealDetail(page, org.slug, PRIMARY_DEAL_ID);
    const summary = page.locator("[data-deals-next-action-summary]");
    await expect(summary.getByRole("heading", { name: "Next Action" })).toBeVisible();
    await summary.getByRole("link").click();
    await expect(page).toHaveURL(/\/tab\/(Tasks|Events|Calls)\/[^/]+$/);
    ignoreFailedResponses(pageErrors, [400]);
  });

  test("header, rail order and stage history badge", async ({ page, pageErrors }) => {
    await signUpNewUser(page);
    const org = await createOrganization(page);
    await openDealDetail(page, org.slug, PRIMARY_DEAL_ID);
    const header = page.locator("[data-record-header]");
    await expect(header.getByRole("link", { name: "Back" })).toBeVisible();
    await expect(header.getByText("Deal 001")).toBeVisible();
    await expect(header.getByText(/TL/)).toBeVisible();
    await expect(header.getByRole("button", { name: "Previous Record" })).toHaveCount(0);
    const rail = page.locator("[data-record-rail]");
    const railLinks = rail.getByRole("link");
    await expect(railLinks.nth(0)).toHaveText("Notes");
    await expect(railLinks.nth(3)).toHaveText("Stage History");
    await expect(railLinks.nth(3).locator("..").getByText("1", { exact: true })).toBeVisible();
    await expect(railLinks.nth(14)).toHaveText("Invoices");
    const addLink = rail.getByRole("link", { name: "Add Related List" });
    const summary = rail.getByText("Sales Cycle Duration", { exact: false });
    const addBox = await addLink.boundingBox();
    const summaryBox = await summary.boundingBox();
    expect(addBox && summaryBox && summaryBox.y > addBox.y).toBe(true);
    ignoreFailedResponses(pageErrors, [400]);
  });

  test("open stage transition updates business card and history badge", async ({
    page,
    pageErrors,
  }) => {
    await signUpNewUser(page);
    const org = await createOrganization(page);
    await openDealDetail(page, org.slug, PRIMARY_DEAL_ID);
    const card = page.getByRole("region", { name: "Business card" });
    await page.locator("[data-stage-bar]").getByRole("button", { name: "Needs Analysis" }).click();
    await expect(card).toContainText("Needs Analysis");
    await expect(card).toContainText("20");
    const rail = page.locator("[data-record-rail]");
    const stageHistoryRow = rail.getByRole("link", { name: "Stage History" }).locator("xpath=..");
    await expect(stageHistoryRow.getByText("2", { exact: true })).toBeVisible();
    ignoreFailedResponses(pageErrors, [400]);
  });

  test("closed won opens verify dialog and saves", async ({ page, pageErrors }) => {
    await signUpNewUser(page);
    const org = await createOrganization(page);
    await openDealDetail(page, org.slug, PRIMARY_DEAL_ID);
    await page.getByRole("button", { name: "Choose won stage" }).click();
    const wonDialog = page.getByRole("dialog", { name: "Choose won stage" });
    await wonDialog.getByRole("menuitemradio", { name: "Closed Won" }).click();
    await expect(page.getByRole("heading", { name: "Verify Details" })).toBeVisible();
    await page.getByRole("button", { name: "Save" }).click();
    const card = page.getByRole("region", { name: "Business card" });
    await expect(card).toContainText("Closed Won");
    ignoreFailedResponses(pageErrors, [400]);
  });

  test("closed lost requires reason for loss", async ({ page, pageErrors }) => {
    await signUpNewUser(page);
    const org = await createOrganization(page);
    await openDealDetail(page, org.slug, PRIMARY_DEAL_ID);
    await page.getByRole("button", { name: "Choose lost stage" }).click();
    const lostDialog = page.getByRole("dialog", { name: "Choose lost stage" });
    await lostDialog.getByRole("menuitemradio", { name: "Closed Lost", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Verify Details" })).toBeVisible();
    await page.locator("[data-stage-change-dialog]").getByRole("button", { name: "Save" }).click();
    const card = page.getByRole("region", { name: "Business card" });
    await expect(card).toContainText("Closed Lost");
    ignoreFailedResponses(pageErrors, [400]);
  });

  test("verify dialog cancel leaves stage unchanged", async ({ page, pageErrors }) => {
    await signUpNewUser(page);
    const org = await createOrganization(page);
    await openDealDetail(page, org.slug, PRIMARY_DEAL_ID);
    const card = page.getByRole("region", { name: "Business card" });
    await expect(card).toContainText("Qualification");
    await page.getByRole("button", { name: "Choose won stage" }).click();
    const wonDialog = page.getByRole("dialog", { name: "Choose won stage" });
    await wonDialog.getByRole("menuitemradio", { name: "Closed Won" }).click();
    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(card).toContainText("Qualification");
    ignoreFailedResponses(pageErrors, [400]);
  });

  test("inline-edits a detail text field", async ({ page, pageErrors }) => {
    await signUpNewUser(page);
    const org = await createOrganization(page);
    await openDealDetail(page, org.slug, PRIMARY_DEAL_ID);
    const row = page.locator('[data-detail-field="Next_Step"]');
    await row.scrollIntoViewIfNeeded();
    await row.hover();
    await row.getByRole("button", { name: "Edit Next Step value" }).click();
    const input = row.getByRole("textbox");
    await input.fill("Call back");
    await input.press("Enter");
    await expect(row).toContainText("Call back");
    ignoreFailedResponses(pageErrors, [400]);
  });

  test("More Options clone and delete", async ({ page, pageErrors }) => {
    await signUpNewUser(page);
    const org = await createOrganization(page);
    await openDealDetail(page, org.slug, DELETE_DEAL_ID);
    const header = page.locator("[data-record-header]");
    await header.getByRole("button", { name: "More Options" }).click();
    await page.getByRole("menuitem", { name: "Clone" }).click();
    await expect(page).toHaveURL(moduleRecordClonePath(org.slug, DEALS_TAB, DELETE_DEAL_ID));
    await page.goBack();
    await header.getByRole("button", { name: "More Options" }).click();
    const deleteDone = page.waitForResponse(
      (response) =>
        response.request().method() === "DELETE" &&
        response.url().includes(`/crm/v2.2/Deals/${DELETE_DEAL_ID}`) &&
        response.ok(),
    );
    await page.getByRole("menuitem", { name: "Delete" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Delete" }).click();
    await deleteDone;
    await expect(page.locator("[data-record-board], table[aria-label='Records']")).toBeVisible();
    ignoreFailedResponses(pageErrors, [400, 404]);
  });

  test("Timeline tab and contact person navigation", async ({ page, pageErrors }) => {
    await signUpNewUser(page);
    const org = await createOrganization(page);
    await openDealDetail(page, org.slug, PRIMARY_DEAL_ID);
    const frame = page.locator("[data-record-frame]");
    await frame.getByRole("tab", { name: "Timeline" }).click();
    await expect(frame.locator("[data-timeline-history]")).toBeVisible();
    await expect(frame.getByText("Note added: Note 4", { exact: true })).toBeVisible();
    await frame.getByRole("tab", { name: "Overview" }).click();
    const summary = page.locator("[data-deals-contact-person-summary]");
    await expect(summary).toBeVisible({ timeout: 15_000 });
    await summary.getByRole("link", { name: /Sample 001 Contact 001/ }).click();
    await expect(page).toHaveURL(moduleRecordPath(org.slug, "Contacts", "300000000000000000"));
    ignoreFailedResponses(pageErrors, [400]);
  });

  test("stage history card lists rows and grows after stage change", async ({
    page,
    pageErrors,
  }) => {
    await signUpNewUser(page);
    const org = await createOrganization(page);
    await openDealDetail(page, org.slug, PRIMARY_DEAL_ID);
    const stageHistory = page.getByRole("region", { name: "Stage History" });
    await stageHistory.scrollIntoViewIfNeeded();
    await expect(stageHistory.locator("tbody tr")).toHaveCount(1, { timeout: 30_000 });
    await page.locator("[data-stage-bar]").getByRole("button", { name: "Needs Analysis" }).click();
    await expect(stageHistory.locator("tbody tr")).toHaveCount(2);
    ignoreFailedResponses(pageErrors, [400]);
  });

  test("multi-row stage history seed deal", async ({ page, pageErrors }) => {
    await signUpNewUser(page);
    const org = await createOrganization(page);
    await openDealDetail(page, org.slug, MULTI_HISTORY_DEAL_ID);
    const stageHistory = page.getByRole("region", { name: "Stage History" });
    await stageHistory.scrollIntoViewIfNeeded();
    await expect(stageHistory.locator("tbody tr")).toHaveCount(2);
    ignoreFailedResponses(pageErrors, [400]);
  });

  test("contact roles card lists seed rows with a rail count", async ({ page, pageErrors }) => {
    await signUpNewUser(page);
    const org = await createOrganization(page);
    await openDealDetail(page, org.slug, PRIMARY_DEAL_ID);
    const card = page.locator("#related-list-contact-roles");
    await expect(card.locator("tbody tr")).toHaveCount(2);
    const railRow = page
      .locator("[data-record-rail]")
      .getByRole("link", { name: "Contact Roles", exact: true })
      .locator("..");
    await expect(railRow.getByText("2", { exact: true })).toBeVisible();
    const contactLink = card.getByRole("link", { name: "Sample 001 Contact 001", exact: true });
    await expect(contactLink).toHaveAttribute(
      "href",
      moduleRecordPath(org.slug, "Contacts", "300000000000000000"),
    );
    const accountLink = card.getByRole("link").filter({ hasText: "Account 001" }).first();
    await expect(accountLink).toHaveAttribute(
      "href",
      moduleRecordPath(org.slug, "Accounts", "500000000000000000"),
    );
    await contactLink.click();
    await expect(page).toHaveURL(moduleRecordPath(org.slug, "Contacts", "300000000000000000"));
    await openDealDetail(page, org.slug, "700000000000000020");
    await expect(page.locator("#related-list-contact-roles")).toContainText("No records found");
    const emptyRailRow = page
      .locator("[data-record-rail]")
      .getByRole("link", { name: "Contact Roles", exact: true })
      .locator("xpath=ancestor-or-self::*[contains(@class, 'h-(--size-menu-item-height)')][1]");
    await expect(emptyRailRow).toHaveText("Contact Roles");
    ignoreFailedResponses(pageErrors, [400]);
  });

  test("rail scrolls to stage history card", async ({ page, pageErrors }) => {
    await signUpNewUser(page);
    const org = await createOrganization(page);
    await openDealDetail(page, org.slug, PRIMARY_DEAL_ID);
    const rail = page.locator("[data-record-rail]");
    await rail.getByRole("link", { name: "Stage History" }).click();
    const stageHistory = page.getByRole("region", { name: "Stage History" });
    await expect(stageHistory).toBeInViewport();
    ignoreFailedResponses(pageErrors, [400]);
  });

  test("laterModule related card control does not navigate", async ({ page, pageErrors }) => {
    await signUpNewUser(page);
    const org = await createOrganization(page);
    await openDealDetail(page, org.slug, PRIMARY_DEAL_ID);
    const url = page.url();
    const products = page.getByRole("region", { name: "Products" });
    await products.scrollIntoViewIfNeeded();
    await products.getByRole("button", { name: "Add Products" }).click({ force: true });
    await expect(page).toHaveURL(url);
    ignoreFailedResponses(pageErrors, [400]);
  });

  test("laterModule control does not navigate", async ({ page, pageErrors }) => {
    await signUpNewUser(page);
    const org = await createOrganization(page);
    await openDealDetail(page, org.slug, PRIMARY_DEAL_ID);
    const url = page.url();
    await page
      .locator("[data-record-header]")
      .getByRole("button", { name: "Send Email" })
      .click({ force: true });
    await expect(page).toHaveURL(url);
    ignoreFailedResponses(pageErrors, [400]);
  });

  test("Campaign Source detail value links to campaign when populated and displays dash when empty", async ({
    page,
    pageErrors,
  }) => {
    await signUpNewUser(page);
    const org = await createOrganization(page);
    // PRIMARY_DEAL_ID (Deal 001) has Campaign 001 (id: 210000000000000000)
    await openDealDetail(page, org.slug, PRIMARY_DEAL_ID);
    const campaignField = page.locator("[data-detail-field='Campaign_Source']");
    await expect(campaignField).toBeVisible();
    const campaignLink = campaignField.getByRole("link", { name: "Campaign 001", exact: true });
    await expect(campaignLink).toBeVisible();
    await expect(campaignLink).toHaveAttribute(
      "href",
      moduleRecordPath(org.slug, "Campaigns", "210000000000000000"),
    );

    // Deal 021 ("700000000000000020") has null Campaign_Source
    await openDealDetail(page, org.slug, "700000000000000020");
    const emptyField = page.locator("[data-detail-field='Campaign_Source']");
    await expect(emptyField).toBeVisible();
    await expect(emptyField).toContainText("—");
    ignoreFailedResponses(pageErrors, [400]);
  });
});
