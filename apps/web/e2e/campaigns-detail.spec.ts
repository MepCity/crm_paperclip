import { signUpNewUser } from "./support/auth";
import { moduleListDefaultPath, moduleRecordPath } from "./support/crm-paths";
import { createOrganization } from "./support/org";
import { expect, ignoreFailedResponses, test } from "./support/test";

const SEED_CAMPAIGN_ID = "210000000000000000";

async function openFirstCampaign(page: import("@playwright/test").Page, orgSlug: string) {
  await page.goto(moduleListDefaultPath(orgSlug, "Campaigns"));
  const list = page.locator(".module-list-page");
  await expect(list.getByRole("table", { name: "Records" })).toBeVisible({ timeout: 15_000 });
  const name = (
    await list.locator("tbody tr").first().getByRole("link").first().innerText()
  ).trim();
  await list.locator("tbody tr").first().getByRole("link").first().click();
  await expect(page).toHaveURL(/\/tab\/Campaigns\/[^/?]+/);
  await expect(page.locator("[data-record-frame]")).toBeVisible();
  return name;
}

test.describe("Campaigns record detail (provisional rules, MEP-812)", () => {
  test("header, Overview sections, inline edit and rail order", async ({ page, pageErrors }) => {
    await signUpNewUser(page);
    const org = await createOrganization(page);
    const name = await openFirstCampaign(page, org.slug);
    const header = page.locator("[data-record-header]");

    // GK-1
    await expect(header.getByRole("heading", { level: 1 })).toHaveText(name);
    await expect(header.getByRole("link", { name: "Edit" })).toBeVisible();
    await expect(header.getByRole("button", { name: "Previous Record" })).toBeVisible();
    await expect(header.getByRole("link", { name: "Next Record" })).toBeVisible();
    await header.getByRole("button", { name: "More Options" }).click();
    await expect(page.getByRole("menuitem", { name: "Clone" })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: "Delete" })).toBeVisible();
    await expect(page.getByRole("menuitem", { name: "Mail Merge" })).toBeVisible();
    await page.keyboard.press("Escape");
    await header.getByRole("link", { name: "Edit" }).click();
    await expect(page).toHaveURL(/\/edit/);
    await page.goBack();
    await expect(page.locator("[data-record-frame]")).toBeVisible();

    // GK-2
    const sections = page.locator("[data-detail-section]");
    await expect(sections.nth(0)).toHaveAttribute("data-detail-section", "Campaign Information");
    await expect(page.locator('[data-detail-section="Description Information"]')).toBeVisible();
    const row = page.locator('[data-detail-field="Campaign_Name"]');
    await row.hover();
    await row.getByRole("button", { name: "Edit Campaign Name value" }).click();
    const input = row.getByRole("textbox");
    await input.fill("Renamed Campaign");
    await input.press("Enter");
    await expect(row).toContainText("Renamed Campaign");

    // GK-4: metadata order
    const cards = await page
      .locator("[data-related-card]")
      .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-related-card")));
    expect(cards).toEqual([
      "connected-records",
      "notes",
      "child-campaigns",
      "open-activities",
      "attachments",
      "closed-activities",
      "leads",
      "deals",
      "contacts",
    ]);
    ignoreFailedResponses(pageErrors, [400]);
  });

  test("Timeline tab and filter panel", async ({ page, pageErrors }) => {
    await signUpNewUser(page);
    const org = await createOrganization(page);
    await openFirstCampaign(page, org.slug);
    const frame = page.locator("[data-record-frame]");
    await frame.getByRole("tab", { name: "Timeline" }).click();
    await expect(frame.locator("[data-timeline-history]")).toBeVisible();
    const filterButton = frame.getByRole("button", { name: "History filter" });
    await filterButton.click();
    await expect(frame.locator("[data-timeline-filter-panel]")).toBeVisible();
    await filterButton.click();
    await expect(frame.locator("[data-timeline-filter-panel]")).toHaveCount(0);
    ignoreFailedResponses(pageErrors, [400]);
  });

  test("Leads, Contacts, and Child Campaigns cards show members and children (GK-5, GK-7)", async ({
    page,
    pageErrors,
  }) => {
    await signUpNewUser(page);
    const org = await createOrganization(page);
    await page.goto(moduleRecordPath(org.slug, "Campaigns", SEED_CAMPAIGN_ID));
    await expect(page.locator("[data-record-frame]")).toBeVisible();

    // GK-5 Leads card
    const leadsCard = page.locator('[data-related-card="leads"]');
    await expect(leadsCard.getByRole("table")).toBeVisible();
    await expect(leadsCard.getByRole("link").first()).toBeVisible();
    await expect(leadsCard.getByText("Planned")).toBeVisible();

    // GK-5 Contacts card
    const contactsCard = page.locator('[data-related-card="contacts"]');
    await expect(contactsCard.getByRole("table")).toBeVisible();
    await expect(contactsCard.getByRole("link").first()).toBeVisible();
    await expect(contactsCard.getByText("Received")).toBeVisible();

    // GK-7 Child Campaigns card
    const childCard = page.locator('[data-related-card="child-campaigns"]');
    await expect(childCard.getByRole("table")).toBeVisible();
    await expect(childCard.getByRole("link", { name: "Campaign 002" })).toBeVisible();

    ignoreFailedResponses(pageErrors, [400]);
  });

  test("Deals card lists matching deals and navigates, Notes card is interactive (GK-6, GK-8)", async ({
    page,
    pageErrors,
  }) => {
    await signUpNewUser(page);
    const org = await createOrganization(page);
    await page.goto(moduleRecordPath(org.slug, "Campaigns", SEED_CAMPAIGN_ID));
    await expect(page.locator("[data-record-frame]")).toBeVisible();

    // GK-8 Notes card like Accounts
    const notesCard = page.locator('[data-related-card="notes"]');
    await expect(notesCard.getByTestId("note-composer-collapsed")).toBeVisible();
    await notesCard.getByTestId("note-composer-collapsed").click();
    await expect(notesCard.getByTestId("note-composer")).toBeVisible();

    // GK-6 Deals card with Campaign Source matching deals
    const dealsCard = page.locator('[data-related-card="deals"]');
    await expect(dealsCard.getByRole("table")).toBeVisible();
    const dealLink = dealsCard.getByRole("link", { name: "Deal 001" });
    await expect(dealLink).toBeVisible();
    await dealLink.click();
    await expect(page).toHaveURL(/\/tab\/Deals\/700000000000000000$/);
    await expect(page.locator("[data-record-frame]")).toBeVisible();

    ignoreFailedResponses(pageErrors, [400]);
  });
});
