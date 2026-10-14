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
const NO_DEAL_RECORD_ID = "300000000000000249";
const DEAL_RECORD_ID = "700000000000000000";

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

  test("Contacts activities cards render live task, meeting and call columns", async ({
    page,
    pageErrors,
  }) => {
    await signUpNewUser(page);
    const org = await createOrganization(page);
    await openContactDetail(page, org.slug, MANAGER_RECORD_ID);
    const open = page.locator("#related-list-open-activities");
    await expect(open.getByRole("region", { name: /^Open Tasks \(\d+\)$/ })).toBeVisible();
    await expect(open.getByRole("region", { name: /^Open Meetings \(\d+\)$/ })).toBeVisible();
    const closed = page.locator("#related-list-closed-activities");
    await expect(closed.getByRole("region", { name: /^Closed Tasks \(\d+\)$/ })).toBeVisible();
    ignoreFailedResponses(pageErrors, [400]);
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

  test("Reporting Contacts filters by manager id, not by a shared Full Name", async ({
    page,
    pageErrors,
  }) => {
    await signUpNewUser(page);
    const org = await createOrganization(page);
    const suffix = crypto.randomUUID().slice(0, 8);
    const sharedLastName = `Twin Manager ${suffix}`;
    const createContact = async (data: Record<string, unknown>): Promise<string> => {
      const response = await page.request.post("/crm/v2.2/Contacts", {
        headers: { "X-CRM-ORG": org.slug, Origin: new URL(page.url()).origin },
        data: { data: [data] },
      });
      expect(response.ok(), `${response.status()} ${await response.text()}`).toBe(true);
      const body = await response.json();
      const id = body.data?.[0]?.details?.id;
      expect(id).toBeTruthy();
      return String(id);
    };
    const managerA = await createContact({ First_Name: "Same", Last_Name: sharedLastName });
    const managerB = await createContact({ First_Name: "Same", Last_Name: sharedLastName });
    const reportA = `Report Alpha ${suffix}`;
    const reportB = `Report Beta ${suffix}`;
    await createContact({ Last_Name: reportA, Reporting_To: { id: managerA } });
    await createContact({ Last_Name: reportB, Reporting_To: { id: managerB } });

    const expectOnly = async (managerId: string, own: string, other: string) => {
      await openContactDetail(page, org.slug, managerId);
      const reporting = page.getByRole("region", { name: "Reporting Contacts" });
      await expect(reporting.getByRole("link", { name: own })).toBeVisible();
      await expect(reporting.getByText(other)).toHaveCount(0);
    };
    await expectOnly(managerA, reportA, reportB);
    await expectOnly(managerB, reportB, reportA);
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
    await expect(sendEmail).toHaveClass(/bg-primary/);
    await sendEmail.click({ force: true });
    expect(page.url()).toBe(before);
    ignoreFailedResponses(pageErrors, [400]);
  });

  test("navigates from header Account subtitle link (D-03) and details card (D-39) to Account detail", async ({
    page,
    pageErrors,
  }) => {
    await signUpNewUser(page);
    const org = await createOrganization(page);
    await openContactDetail(page, org.slug, MANAGER_RECORD_ID);
    const header = page.locator("[data-record-header]");
    const headerAccountLink = header.getByRole("link", { name: "Account 001" });
    await expect(headerAccountLink).toBeVisible();

    const detailsAccountLink = page
      .locator('[data-detail-field="Account_Name"]')
      .getByRole("link", { name: "Account 001" });
    await expect(detailsAccountLink).toBeVisible();

    await headerAccountLink.click();
    await expect(page).toHaveURL(/\/tab\/Accounts\/500000000000000000/);
    await expect(page.locator("[data-record-frame]")).toBeVisible();
    await expect(page.locator("[data-record-header]")).toContainText("Account 001");
    ignoreFailedResponses(pageErrors, [400]);
  });

  test("inline-edits Account Name lookup field using Choose Account dialog", async ({
    page,
    pageErrors,
  }) => {
    await signUpNewUser(page);
    const org = await createOrganization(page);
    await openContactDetail(page, org.slug, REPORT_ONLY_RECORD_ID);
    const accountRow = page.locator('[data-detail-field="Account_Name"]');
    await accountRow.hover();
    await accountRow.getByRole("button", { name: "Edit Account Name value" }).click();

    await accountRow.getByRole("button", { name: "Open Account Name lookup", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "Choose Account" });
    await expect(dialog).toBeVisible();
    const firstDataRow = dialog.locator("tbody tr").first();
    await expect(firstDataRow).toBeVisible();
    const nameLink = firstDataRow.locator("td").nth(1).getByRole("link");
    await expect(nameLink).toBeVisible();
    await expect(nameLink).toHaveAttribute("href", /\/tab\/Accounts\//);
    const chosenName = (await nameLink.innerText()).trim();
    await firstDataRow.click();
    await expect(dialog).toHaveCount(0);

    const saveMutation = page.waitForResponse(
      (response) =>
        response.request().method() === "PUT" &&
        response.url().includes(`/crm/v2.2/Contacts/${REPORT_ONLY_RECORD_ID}`) &&
        response.ok(),
    );
    await accountRow.getByRole("button", { name: "Save", exact: true }).click();
    await saveMutation;

    await expect(accountRow).toContainText(chosenName);
    await expect(accountRow.getByRole("link", { name: chosenName })).toBeVisible();
    await expect(page.locator("[data-record-header]")).toContainText(chosenName);
    ignoreFailedResponses(pageErrors, [400]);
  });

  test("primary command, tab-row update indicator and empty activity badges", async ({
    page,
    pageErrors,
  }) => {
    await signUpNewUser(page);
    const org = await createOrganization(page);
    await openContactDetail(page, org.slug, MANAGER_RECORD_ID);

    // D-05: Send Email draws the filled primary command.
    const sendEmail = page
      .locator("[data-record-header]")
      .getByRole("button", { name: "Send Email" });
    await expect(sendEmail).toHaveCSS(
      "background-image",
      /rgb\(87, 103, 246\).*rgb\(19, 77, 196\)/,
    );

    // D-35: the indicator shares the Overview/Timeline row at its right end, clock first.
    const tabRow = page.locator("[data-record-tab-row]");
    const lastUpdate = tabRow.locator(".detail-last-update");
    await expect(lastUpdate).toBeVisible();
    await expect(lastUpdate.locator("svg")).toHaveCount(1);
    const row = await tabRow.boundingBox();
    const label = await lastUpdate.boundingBox();
    if (!row || !label) throw new Error("Missing tab row or Last Update indicator");
    expect(label.y).toBeGreaterThanOrEqual(row.y);
    expect(label.y + label.height).toBeLessThanOrEqual(row.y + row.height);
    expect(row.x + row.width - (label.x + label.width)).toBeLessThanOrEqual(16);
    await expect(page.locator("[data-record-scroller] .detail-last-update")).toHaveCount(0);

    // D-30/D-31: no tasks, meetings or calls means no rail badge.
    const badgeRows = await page.evaluate(() => {
      const rail = document.querySelector("#record-related-rail");
      return Array.from(rail?.querySelectorAll("div[class*='justify-between']") ?? []).map(
        (entry) => ({
          label: entry.querySelector("a")?.textContent?.trim() ?? "",
          badge: entry.querySelector("span[class*='rounded-full']")?.textContent?.trim() ?? null,
        }),
      );
    });
    for (const title of ["Open Activities", "Closed Activities"]) {
      expect(badgeRows.filter((entry) => entry.label === title)).toEqual([]);
    }
    ignoreFailedResponses(pageErrors, [400]);
  });

  test("Phone field renders call icon button in business card and details card (D-37, D-41)", async ({
    page,
    pageErrors,
  }) => {
    await signUpNewUser(page);
    const org = await createOrganization(page);
    await openContactDetail(page, org.slug, MANAGER_RECORD_ID);

    // Business card Phone call icon
    const businessCard = page.getByRole("region", { name: "Business card" });
    const businessPhoneRow = businessCard.locator('[data-detail-field="Phone"]');
    await expect(businessPhoneRow).toContainText("100-001");
    const businessCallButton = businessPhoneRow.getByRole("button", { name: "Call" });
    await expect(businessCallButton).toBeVisible();
    await expect(businessCallButton).toHaveAttribute("data-later-module", "M5");

    // Details card Contact Information Phone call icon
    const detailsSection = page.locator('[data-detail-section="Contact Information"]');
    const detailsPhoneRow = detailsSection.locator('[data-detail-field="Phone"]');
    await expect(detailsPhoneRow).toContainText("100-001");
    const detailsCallButton = detailsPhoneRow.getByRole("button", { name: "Call" });
    await expect(detailsCallButton).toBeVisible();
    await expect(detailsCallButton).toHaveAttribute("data-later-module", "M5");

    // Clicking call button stays inert
    const beforeUrl = page.url();
    await detailsCallButton.click({ force: true });
    expect(page.url()).toBe(beforeUrl);

    ignoreFailedResponses(pageErrors, [400]);
  });

  test("Contact Information section renders balanced columns with specified fields", async ({
    page,
    pageErrors,
  }) => {
    await signUpNewUser(page);
    const org = await createOrganization(page);
    await openContactDetail(page, org.slug, MANAGER_RECORD_ID);

    const detailsSection = page.locator('[data-detail-section="Contact Information"]');
    await expect(detailsSection).toBeVisible();
    const columns = detailsSection.locator("[data-detail-column]");
    await expect(columns).toHaveCount(2);

    const leftFields = columns.nth(0).locator("[data-detail-field]");
    const leftNames = await leftFields.evaluateAll((els) =>
      els.map((el) => el.getAttribute("data-detail-field")),
    );
    expect(leftNames).toEqual([
      "Owner",
      "Account_Name",
      "Email",
      "Phone",
      "Other_Phone",
      "Mobile",
      "Assistant",
    ]);

    const rightFields = columns.nth(1).locator("[data-detail-field]");
    const rightNames = await rightFields.evaluateAll((els) =>
      els.map((el) => el.getAttribute("data-detail-field")),
    );
    expect(rightNames).toEqual([
      "Lead_Source",
      "Full_Name",
      "Vendor_Name",
      "Title",
      "Department",
      "Home_Phone",
      "Fax",
      "Date_of_Birth",
      "Asst_Phone",
      "Email_Opt_Out",
      "Skype_ID",
      "Secondary_Email",
      "Twitter",
      "Reporting_To",
      "Tag",
      "Created_By",
      "Modified_By",
      "Created_Time",
      "Modified_Time",
      "Last_Activity_Time",
      "Unsubscribed_Mode",
      "Unsubscribed_Time",
      "id",
      "Connected_To__s",
    ]);

    ignoreFailedResponses(pageErrors, [400]);
  });

  test("Hierarchy View on Reporting Contacts card opens Contact Hierarchy modal (D-90, AD-163, AD-164)", async ({
    page,
    pageErrors,
  }) => {
    await signUpNewUser(page);
    const org = await createOrganization(page);

    // 1. Contact with account (MANAGER_RECORD_ID): opens account's tree
    await openContactDetail(page, org.slug, MANAGER_RECORD_ID);
    const reporting = page.getByRole("region", { name: "Reporting Contacts" });
    const hierarchyBtn = reporting.getByRole("button", { name: "Hierarchy View" });
    await expect(hierarchyBtn).toBeVisible();

    await hierarchyBtn.click();
    const modal = page.getByRole("dialog");
    await expect(modal).toBeVisible();
    await expect(modal.getByRole("heading", { name: "Contact Hierarchy" })).toBeVisible();
    await expect(modal.locator("[data-part='account-root']")).toBeVisible();
    await expect(modal.getByRole("link").first()).toBeVisible();

    // Screenshot of opened modal for Contacts entry
    const scratchDir = process.env.PAPERCLIP_RUN_SCRATCH_DIR || process.env.PAPERCLIP_SCRATCH_DIR;
    if (scratchDir) {
      await page.screenshot({ path: `${scratchDir}/contacts-contact-hierarchy-open.png` });
    }

    // Close via Close Modal button
    await modal.getByRole("button", { name: "Close Modal" }).click();
    await expect(modal).not.toBeVisible();

    // 2. Contact without account (REPORT_ONLY_RECORD_ID): manager -> contact (Rule 5)
    await openContactDetail(page, org.slug, REPORT_ONLY_RECORD_ID);
    const reporting2 = page.getByRole("region", { name: "Reporting Contacts" });
    const hierarchyBtn2 = reporting2.getByRole("button", { name: "Hierarchy View" });
    await expect(hierarchyBtn2).toBeVisible();

    await hierarchyBtn2.click();
    const modal2 = page.getByRole("dialog");
    await expect(modal2).toBeVisible();
    // No account root row
    await expect(modal2.locator("[data-part='account-root']")).toHaveCount(0);
    // Manager and contact links visible
    await expect(modal2.getByRole("link")).toHaveCount(2);

    // Close via Escape
    await page.keyboard.press("Escape");
    await expect(modal2).not.toBeVisible();

    ignoreFailedResponses(pageErrors, [400]);
  });

  test("clicking related list in rail while on Timeline tab opens Overview and brings card into view", async ({
    page,
    pageErrors,
  }) => {
    await signUpNewUser(page);
    const org = await createOrganization(page);
    await openContactDetail(page, org.slug, MANAGER_RECORD_ID);

    const frame = page.locator("[data-record-frame]");
    const timelineTab = frame.getByRole("tab", { name: "Timeline" });
    const overviewTab = frame.getByRole("tab", { name: "Overview" });

    await timelineTab.click();
    await expect(timelineTab).toHaveAttribute("aria-selected", "true");
    await expect(frame.locator("[data-timeline-history]")).toBeVisible();

    const rail = frame.getByRole("navigation", { name: "Related List" });
    await rail.getByRole("link", { name: "Reporting Contacts" }).click();

    await expect(overviewTab).toHaveAttribute("aria-selected", "true");
    const reportingCard = frame.getByRole("region", { name: "Reporting Contacts" });
    await expect(reportingCard).toBeVisible();
    await expect(reportingCard).toBeInViewport();

    ignoreFailedResponses(pageErrors, [400]);
  });

  test("Deals card lists the contact deals and Deal Name opens Deal detail", async ({
    page,
    pageErrors,
  }) => {
    await signUpNewUser(page);
    const org = await createOrganization(page);
    await openContactDetail(page, org.slug, MANAGER_RECORD_ID);
    const deals = page.getByRole("region", { name: "Deals" });
    await expect(deals.getByRole("table")).toBeVisible();
    const dealLink = deals.getByRole("link", { name: "Deal 001" });
    await expect(dealLink).toHaveAttribute("href", /\/tab\/Deals\/700000000000000000$/);
    await dealLink.click();
    await expect(page).toHaveURL(moduleRecordPath(org.slug, "Deals", DEAL_RECORD_ID));
    await expect(page.locator("[data-record-frame]")).toBeVisible();
    ignoreFailedResponses(pageErrors, [400]);
  });

  test("Deals card New Deal opens the create form with Contact Name and Account Name filled", async ({
    page,
    pageErrors,
  }) => {
    await signUpNewUser(page);
    const org = await createOrganization(page);
    await openContactDetail(page, org.slug, MANAGER_RECORD_ID);
    const deals = page.getByRole("region", { name: "Deals" });
    await expect(deals.getByRole("table")).toBeVisible();
    await deals.getByRole("button", { name: "New Deal" }).click();
    await expect(page).toHaveURL(moduleCreatePath(org.slug, "Deals"));
    await expect(page.getByRole("textbox", { name: "Contact Name", exact: true })).toHaveValue(
      /Contact 001/,
    );
    await expect(page.getByRole("textbox", { name: "Account Name", exact: true })).toHaveValue(
      "Account 001",
    );
    ignoreFailedResponses(pageErrors, [400]);
  });

  test("Deals card empty state", async ({ page, pageErrors }) => {
    await signUpNewUser(page);
    const org = await createOrganization(page);
    await openContactDetail(page, org.slug, NO_DEAL_RECORD_ID);
    const deals = page.getByRole("region", { name: "Deals" });
    await expect(deals.getByText("No records found")).toBeVisible();
    await expect(deals.getByRole("table")).toHaveCount(0);
    ignoreFailedResponses(pageErrors, [400]);
  });
});

function headerTitle(page: import("@playwright/test").Page) {
  return page.locator("[data-record-header]").getByRole("heading", { level: 1 });
}
