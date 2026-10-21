import { signUpNewUser } from "./support/auth";
import { moduleListDefaultPath, moduleRecordPath } from "./support/crm-paths";
import { createOrganization } from "./support/org";
import { expect, ignoreFailedResponses, test } from "./support/test";

const CALLS_TAB = "Calls";
// Seeded scheduled call linked to a contact (Who_Id) with Outgoing_Call_Status: "Overdue"
const SCHEDULED_CALL_ID = "150000000000000001";
// Seeded non-scheduled call (Missed, Outgoing_Call_Status: null, Who_Id: Leads)
const NON_SCHEDULED_CALL_ID = "150000000000000000";
// Seeded call related to a deal (What_Id)
const DEAL_RELATED_CALL_ID = "150000000000000003";
// Seeded first call on list page
const FIRST_LIST_CALL_ID = "150000000000000249";

test.describe("Calls record detail", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1470, height: 835 });
  });

  test("opens a call from the list table", async ({ page, pageErrors }) => {
    await signUpNewUser(page);
    const org = await createOrganization(page);
    await page.goto(moduleListDefaultPath(org.slug, CALLS_TAB));
    const row = page.locator("table[aria-label='Records']").getByRole("link", { name: "Call 250" });
    await expect(row).toBeVisible({ timeout: 15_000 });
    await row.click();
    await expect(page).toHaveURL(moduleRecordPath(org.slug, CALLS_TAB, FIRST_LIST_CALL_ID));
    await expect(page.locator("[data-record-frame]")).toBeVisible();
    ignoreFailedResponses(pageErrors, [400]);
  });

  test("scheduled call has static phone icon, Reschedule Call, and no header Edit", async ({
    page,
    pageErrors,
  }) => {
    await signUpNewUser(page);
    const org = await createOrganization(page);
    await page.goto(moduleRecordPath(org.slug, CALLS_TAB, SCHEDULED_CALL_ID));
    await expect(page.locator("[data-record-frame]")).toBeVisible({ timeout: 15_000 });

    const header = page.locator("[data-record-header]");
    // Header identity: static handset icon, title link to Contact, subtitle Contacts
    await expect(header.locator("[data-record-portrait]")).toHaveCount(1);
    await expect(header.getByRole("button", { name: "Add Tags" })).toBeVisible();

    // CD-05 & CD-05.1: Reschedule Call and Down arrow are present on scheduled calls
    await expect(
      header
        .getByRole("button", { name: "Reschedule Call" })
        .or(header.getByRole("link", { name: "Reschedule Call" })),
    ).toBeVisible();
    await expect(
      header
        .getByRole("button", { name: "Down arrow" })
        .or(header.getByRole("button", { name: "Reschedule options" })),
    ).toBeVisible();

    // CD-06 absent: Header Edit button is suppressed (Edit is in More Options menu CD-07.1)
    const headerButtons = await header
      .locator("button, a")
      .evaluateAll((els) =>
        els.map((el) => (el.textContent?.trim() || el.getAttribute("aria-label") || "").trim()),
      );
    expect(headerButtons).not.toContain("Edit");

    // Command order: Reschedule Call, Down arrow / Reschedule options, More Options, Previous Record, Next Record
    const splitLabel = headerButtons.includes("Reschedule options")
      ? "Reschedule options"
      : "Down arrow";
    const wanted = [
      "Reschedule Call",
      splitLabel,
      "More Options",
      "Previous Record",
      "Next Record",
    ];
    expect(headerButtons.filter((n) => wanted.includes(n))).toEqual(wanted);

    // Business card region
    const card = page.getByRole("region", { name: "Business card" });
    await expect(card).toBeVisible();
    const cardText = (await card.innerText()).replace(/\s+/g, " ");
    const positions = [
      "Call For",
      "Related To",
      "Call Type",
      "Outgoing Call Status",
      "Call Start Time",
    ].map((label) => cardText.indexOf(label));
    expect(positions.every((p) => p >= 0)).toBe(true);
    expect(positions).toEqual([...positions].sort((x, y) => x - y));

    await expect(
      card.locator("[data-detail-field='Call_Start_Time'] .detail-field-value"),
    ).toHaveText(/^\d{2}\.\d{2}\.\d{4} \d{1,2}:\d{2} (AM|PM)$/);

    // Details sections
    await expect(page.getByText("Call Information")).toBeVisible();
    // No related list rail on activity records
    await expect(page.locator("[data-record-rail]")).toHaveCount(0);
    ignoreFailedResponses(pageErrors, [400]);
  });

  test("non-scheduled call does not render Reschedule Call or Down arrow", async ({
    page,
    pageErrors,
  }) => {
    await signUpNewUser(page);
    const org = await createOrganization(page);
    await page.goto(moduleRecordPath(org.slug, CALLS_TAB, NON_SCHEDULED_CALL_ID));
    await expect(page.locator("[data-record-frame]")).toBeVisible({ timeout: 15_000 });

    const header = page.locator("[data-record-header]");
    await expect(header.getByRole("button", { name: "Reschedule Call" })).toHaveCount(0);
    await expect(header.getByRole("button", { name: "Reschedule options" })).toHaveCount(0);
    // Header Edit button remains suppressed
    const headerButtons = await header
      .locator("button, a")
      .evaluateAll((els) =>
        els.map((el) => (el.textContent?.trim() || el.getAttribute("aria-label") || "").trim()),
      );
    expect(headerButtons).not.toContain("Edit");
    // More Options is still present
    await expect(header.getByRole("button", { name: "More Options" })).toBeVisible();
    ignoreFailedResponses(pageErrors, [400]);
  });

  test("More Options lists five rows (CD-07.1–CD-07.5)", async ({ page, pageErrors }) => {
    await signUpNewUser(page);
    const org = await createOrganization(page);
    await page.goto(moduleRecordPath(org.slug, CALLS_TAB, SCHEDULED_CALL_ID));
    await expect(page.locator("[data-record-frame]")).toBeVisible({ timeout: 15_000 });

    await page
      .locator("[data-record-header]")
      .getByRole("button", { name: "More Options" })
      .click();

    await expect(page.getByRole("menuitem")).toHaveText([
      "Edit",
      "Share",
      "Delete",
      "Print Preview",
      "Send Email",
    ]);
    ignoreFailedResponses(pageErrors, [400]);
  });

  test("More Options > Edit opens the edit route", async ({ page, pageErrors }) => {
    await signUpNewUser(page);
    const org = await createOrganization(page);
    await page.goto(moduleRecordPath(org.slug, CALLS_TAB, SCHEDULED_CALL_ID));
    await expect(page.locator("[data-record-frame]")).toBeVisible({ timeout: 15_000 });
    await page
      .locator("[data-record-header]")
      .getByRole("button", { name: "More Options" })
      .click();
    await page.getByRole("menuitem", { name: "Edit" }).click();
    await expect(page).toHaveURL(/\/edit/);
    ignoreFailedResponses(pageErrors, [400]);
  });

  test("Related To shows the plural module suffix without a link", async ({ page, pageErrors }) => {
    await signUpNewUser(page);
    const org = await createOrganization(page);
    await page.goto(moduleRecordPath(org.slug, CALLS_TAB, DEAL_RELATED_CALL_ID));
    await expect(page.locator("[data-record-frame]")).toBeVisible({ timeout: 15_000 });

    const card = page.getByRole("region", { name: "Business card" });
    await expect(card).toContainText("- Deals", { timeout: 15_000 });
    ignoreFailedResponses(pageErrors, [400]);
  });

  test("Timeline shows its empty state", async ({ page, pageErrors }) => {
    await signUpNewUser(page);
    const org = await createOrganization(page);
    await page.goto(moduleRecordPath(org.slug, CALLS_TAB, SCHEDULED_CALL_ID));
    await expect(page.locator("[data-record-frame]")).toBeVisible({ timeout: 15_000 });

    const frame = page.locator("[data-record-frame]");
    await frame.getByRole("tab", { name: "Timeline" }).click();
    await expect(frame.locator("[data-timeline-history]")).toBeVisible();
    await expect(frame.getByText("No logs found")).toBeVisible();
    ignoreFailedResponses(pageErrors, [400]);
  });

  test("right panel shows person, Deal Summary, Open Activities, and single phone call icon", async ({
    page,
    pageErrors,
  }) => {
    await signUpNewUser(page);
    const org = await createOrganization(page);
    await page.goto(moduleRecordPath(org.slug, CALLS_TAB, SCHEDULED_CALL_ID));
    await expect(page.locator("[data-record-frame]")).toBeVisible({ timeout: 15_000 });

    const panel = page.locator("[data-record-side-panel]");
    // Contact person link
    await expect(panel.getByRole("link", { name: /Contact/ }).first()).toBeVisible({
      timeout: 15_000,
    });
    // CD-61: Deal Summary region is present with New action
    const dealSummary = panel.getByRole("region", { name: "Deal Summary" });
    await expect(dealSummary).toBeVisible();
    await expect(dealSummary.getByRole("button", { name: /New/ })).toBeVisible();

    // Open Activities
    const open = panel.getByRole("region", { name: "Open Activities" });
    for (const name of ["Tasks", "Meetings", "Calls"]) {
      await expect(open.getByRole("button", { name })).toBeVisible();
    }

    // CD-68: Phone call button present, mobile call button absent (TD-59 absent)
    const phoneButton = panel.getByRole("button", { name: "Call phone" });
    await expect(phoneButton).toBeVisible();
    const mobileButton = panel.getByRole("button", { name: "Call mobile" });
    await expect(mobileButton).toHaveCount(0);

    const box = await phoneButton.locator("svg").boundingBox();
    expect(box?.width ?? 0).toBeGreaterThan(0);

    // Verify "No Deals found" on a call without deal associations (e.g. Lead call)
    await page.goto(moduleRecordPath(org.slug, CALLS_TAB, NON_SCHEDULED_CALL_ID));
    await expect(page.locator("[data-record-frame]")).toBeVisible({ timeout: 15_000 });
    const leadPanel = page.locator("[data-record-side-panel]");
    const leadDealSummary = leadPanel.getByRole("region", { name: "Deal Summary" });
    await expect(leadDealSummary).toBeVisible();
    await expect(leadDealSummary.getByText("No Deals found")).toBeVisible();

    ignoreFailedResponses(pageErrors, [400]);
  });
});
