import { signUpNewUser } from "./support/auth";
import {
  moduleCreatePath,
  moduleListDefaultPath,
  moduleRecordClonePath,
  moduleRecordPath,
} from "./support/crm-paths";
import { createOrganization } from "./support/org";
import { expect, ignoreFailedResponses, test } from "./support/test";

const CONTACTS_TAB = "Contacts";
const MANAGER_RECORD_ID = "300000000000000000";
const REPORT_ONLY_RECORD_ID = "300000000000000001";

async function openContactDetail(
  page: import("@playwright/test").Page,
  orgSlug: string,
  recordId: string,
  listQuery = "",
) {
  const listUrl = `${moduleListDefaultPath(orgSlug, CONTACTS_TAB)}${listQuery}`;
  await page.goto(listUrl);
  await expect(page.getByRole("table", { name: "Records" })).toBeVisible({ timeout: 15_000 });
  await page.goto(moduleRecordPath(orgSlug, CONTACTS_TAB, recordId));
  await expect(page.locator("[data-record-frame]")).toBeVisible();
}

test.describe("Contacts record detail", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1470, height: 835 });
  });

  test("opens from list context with header inventory and related rail", async ({
    page,
    pageErrors,
  }) => {
    await signUpNewUser(page);
    const org = await createOrganization(page);
    await openContactDetail(page, org.slug, MANAGER_RECORD_ID);
    const header = page.locator("[data-record-header]");
    await expect(header.getByRole("link", { name: "Back" })).toBeVisible();
    await expect(header.getByRole("button", { name: "Add Tags" })).toBeVisible();
    await expect(header.getByRole("button", { name: "Send Email" })).toBeVisible();
    await expect(header.getByRole("link", { name: "Edit" })).toBeVisible();
    await expect(header.getByRole("button", { name: "More Options" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Reporting Contacts" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Overview" })).toBeVisible();
    await expect(page.getByRole("region", { name: "Business card" })).toBeVisible();
    ignoreFailedResponses(pageErrors, [400]);
  });

  test("previous and next respect list page boundaries", async ({ page, pageErrors }) => {
    await signUpNewUser(page);
    const org = await createOrganization(page);
    const listUrl = `${moduleListDefaultPath(org.slug, CONTACTS_TAB)}?per_page=10&page=1`;
    await page.goto(listUrl);
    await expect(page.getByRole("table", { name: "Records" })).toBeVisible();
    await page.locator("table tbody tr").first().getByRole("link").first().click();
    await expect(page.locator("[data-record-frame]")).toBeVisible();
    await expect(page.getByRole("button", { name: "Previous Record" })).toBeDisabled();
    const next = page.getByRole("link", { name: "Next Record" });
    await expect(next).toBeVisible();
    const title = headerTitle(page);
    const firstTitle = await title.innerText();
    await next.click();
    await expect(title).not.toHaveText(firstTitle);
    await page.getByRole("link", { name: "Previous Record" }).click();
    await expect(title).toHaveText(firstTitle);
    ignoreFailedResponses(pageErrors, [400]);
  });

  test("inline-edits a business card text field", async ({ page, pageErrors }) => {
    await signUpNewUser(page);
    const org = await createOrganization(page);
    await openContactDetail(page, org.slug, REPORT_ONLY_RECORD_ID);
    const card = page.getByRole("region", { name: "Business card" });
    const departmentRow = card.locator('[data-detail-field="Department"]');
    await departmentRow.hover();
    await departmentRow.getByRole("button", { name: "Edit Department value" }).click();
    const input = departmentRow.getByRole("textbox");
    await input.fill("QA Department");
    await input.press("Enter");
    await expect(departmentRow).toContainText("QA Department");
    ignoreFailedResponses(pageErrors, [400]);
  });

  test("More Options clone and delete", async ({ page, pageErrors }) => {
    await signUpNewUser(page);
    const org = await createOrganization(page);
    await openContactDetail(page, org.slug, REPORT_ONLY_RECORD_ID);
    const recordId = REPORT_ONLY_RECORD_ID;
    const header = page.locator("[data-record-header]");
    await header.getByRole("button", { name: "More Options" }).click();
    await page.getByRole("menuitem", { name: "Clone" }).click();
    await expect(page).toHaveURL(moduleRecordClonePath(org.slug, CONTACTS_TAB, recordId));
    await page.goBack();
    await expect(page.locator("[data-record-frame]")).toBeVisible();
    await header.getByRole("button", { name: "More Options" }).click();
    const deleteDone = page.waitForResponse(
      (response) =>
        response.request().method() === "DELETE" &&
        response.url().includes(`/crm/v2.2/Contacts/${recordId}`) &&
        response.ok(),
    );
    await page.getByRole("menuitem", { name: "Delete" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Delete" }).click();
    await deleteDone;
    await expect(page.getByRole("table", { name: "Records" })).toBeVisible();
    await page.goto(moduleRecordPath(org.slug, CONTACTS_TAB, recordId));
    await expect(page.getByText(/could not be found/i)).toBeVisible();
    ignoreFailedResponses(pageErrors, [404]);
  });

  test("Timeline tab and history filter panel", async ({ page, pageErrors }) => {
    await signUpNewUser(page);
    const org = await createOrganization(page);
    await openContactDetail(page, org.slug, MANAGER_RECORD_ID);
    const frame = page.locator("[data-record-frame]");
    await frame.getByRole("tab", { name: "Timeline" }).click();
    await expect(frame.locator("[data-timeline-history]")).toBeVisible();
    await expect(
      frame.getByRole("button", { name: "Show Upcoming Automated Actions" }),
    ).toBeVisible();
    const filterButton = frame.getByRole("button", { name: "History filter" });
    await filterButton.click();
    await expect(frame.locator("[data-timeline-filter-panel]")).toBeVisible();
    await filterButton.click();
    await expect(frame.locator("[data-timeline-filter-panel]")).toHaveCount(0);
    ignoreFailedResponses(pageErrors, [400]);
  });

  test("Reporting Contacts card lists direct reports and supports New", async ({
    page,
    pageErrors,
  }) => {
    await signUpNewUser(page);
    const org = await createOrganization(page);
    await openContactDetail(page, org.slug, MANAGER_RECORD_ID);
    const reporting = page.getByRole("region", { name: "Reporting Contacts" });
    await expect(reporting.getByRole("table")).toBeVisible();
    await expect(reporting.getByRole("link").first()).toBeVisible();
    await reporting.getByRole("button", { name: "New" }).click();
    await expect(page).toHaveURL(moduleCreatePath(org.slug, CONTACTS_TAB));
    await expect(page.getByRole("button", { name: "Open Reporting To lookup" })).toBeVisible();
    ignoreFailedResponses(pageErrors, [400]);
  });

  test("Reporting Contacts empty state", async ({ page, pageErrors }) => {
    await signUpNewUser(page);
    const org = await createOrganization(page);
    await openContactDetail(page, org.slug, REPORT_ONLY_RECORD_ID);
    const reporting = page.getByRole("region", { name: "Reporting Contacts" });
    await expect(reporting.getByText("No records found")).toBeVisible();
    ignoreFailedResponses(pageErrors, [400]);
  });

  test("later-module header control stays inert", async ({ page, pageErrors }) => {
    await signUpNewUser(page);
    const org = await createOrganization(page);
    await openContactDetail(page, org.slug, MANAGER_RECORD_ID);
    const before = page.url();
    const sendEmail = page
      .locator("[data-record-header]")
      .getByRole("button", { name: "Send Email" });
    await expect(sendEmail).toHaveAttribute("data-later-module", "M10");
    await sendEmail.click({ force: true });
    expect(page.url()).toBe(before);
    ignoreFailedResponses(pageErrors, [400]);
  });
});

function headerTitle(page: import("@playwright/test").Page) {
  return page.locator("[data-record-header]").getByRole("heading", { level: 1 });
}
