import { signUpNewUser } from "./support/auth";
import {
  moduleCreatePath,
  moduleListDefaultPath,
  moduleRecordClonePath,
  moduleRecordPath,
} from "./support/crm-paths";
import { createOrganization } from "./support/org";
import { expect, ignoreFailedResponses, test } from "./support/test";

const ACCOUNTS_TAB = "Accounts";
const PRIMARY_ACCOUNT_ID = "500000000000000000";
const CHILD_ACCOUNT_ID = "500000000000000006";
const PARENT_ACCOUNT_ID = "500000000000000005";
const DELETE_ACCOUNT_ID = "500000000000000001";
const EMPTY_RELATED_ACCOUNT_ID = "500000000000000249";

function waitForModuleBulkList(
  page: import("@playwright/test").Page,
  module: "Contacts" | "Accounts",
) {
  return page.waitForResponse((response) => {
    const url = new URL(response.url());
    return response.request().method() === "POST" && url.pathname.endsWith(`/${module}/bulk`);
  });
}

async function openAccountDetail(
  page: import("@playwright/test").Page,
  orgSlug: string,
  recordId: string,
  listQuery = "",
) {
  const listUrl = `${moduleListDefaultPath(orgSlug, ACCOUNTS_TAB)}${listQuery}`;
  await page.goto(listUrl);
  await expect(page.getByRole("table", { name: "Records" })).toBeVisible({ timeout: 15_000 });
  await page.goto(moduleRecordPath(orgSlug, ACCOUNTS_TAB, recordId));
  await expect(page.locator("[data-record-frame]")).toBeVisible();
}

test.describe("Accounts record detail", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1470, height: 835 });
  });

  test("opens from list context with header inventory and related rail", async ({
    page,
    pageErrors,
  }) => {
    await signUpNewUser(page);
    const org = await createOrganization(page);
    await openAccountDetail(page, org.slug, PRIMARY_ACCOUNT_ID);
    const header = page.locator("[data-record-header]");
    await expect(header.getByRole("link", { name: "Back" })).toBeVisible();
    await expect(header.getByRole("button", { name: "Add Tags" })).toBeVisible();
    await expect(header.getByRole("button", { name: "Send Email" })).toBeVisible();
    await expect(header.getByRole("link", { name: "Edit" })).toBeVisible();
    await expect(header.getByRole("button", { name: "More Options" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Overview" })).toBeVisible();
    await expect(page.getByRole("region", { name: "Business card" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Add Link" })).toBeVisible();
    ignoreFailedResponses(pageErrors, [400]);
  });

  test("previous and next respect list page boundaries", async ({ page, pageErrors }) => {
    await signUpNewUser(page);
    const org = await createOrganization(page);
    const listUrl = `${moduleListDefaultPath(org.slug, ACCOUNTS_TAB)}?per_page=10&page=1`;
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

  test("inline-edits a detail text field", async ({ page, pageErrors }) => {
    await signUpNewUser(page);
    const org = await createOrganization(page);
    await openAccountDetail(page, org.slug, PRIMARY_ACCOUNT_ID);
    const siteRow = page.locator('[data-detail-field="Account_Site"]');
    await siteRow.hover();
    await siteRow.getByRole("button", { name: "Edit Account Site value" }).click();
    const input = siteRow.getByRole("textbox");
    await input.fill("HQ Site");
    await input.press("Enter");
    await expect(siteRow).toContainText("HQ Site");
    ignoreFailedResponses(pageErrors, [400]);
  });

  test("More Options clone and delete", async ({ page, pageErrors }) => {
    await signUpNewUser(page);
    const org = await createOrganization(page);
    await openAccountDetail(page, org.slug, DELETE_ACCOUNT_ID);
    const recordId = DELETE_ACCOUNT_ID;
    const header = page.locator("[data-record-header]");
    await header.getByRole("button", { name: "More Options" }).click();
    await page.getByRole("menuitem", { name: "Clone" }).click();
    await expect(page).toHaveURL(moduleRecordClonePath(org.slug, ACCOUNTS_TAB, recordId));
    await page.goBack();
    await expect(page.locator("[data-record-frame]")).toBeVisible();
    await header.getByRole("button", { name: "More Options" }).click();
    const deleteDone = page.waitForResponse(
      (response) =>
        response.request().method() === "DELETE" &&
        response.url().includes(`/crm/v2.2/Accounts/${recordId}`) &&
        response.ok(),
    );
    await page.getByRole("menuitem", { name: "Delete" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Delete" }).click();
    await deleteDone;
    await expect(page.getByRole("table", { name: "Records" })).toBeVisible();
    await page.goto(moduleRecordPath(org.slug, ACCOUNTS_TAB, recordId));
    await expect(page.getByText(/could not be found/i)).toBeVisible();
    ignoreFailedResponses(pageErrors, [400, 404]);
  });

  test("Timeline tab and history filter panel", async ({ page, pageErrors }) => {
    await signUpNewUser(page);
    const org = await createOrganization(page);
    await openAccountDetail(page, org.slug, PRIMARY_ACCOUNT_ID);
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

  test("Contacts card lists related contacts and supports New", async ({ page, pageErrors }) => {
    await signUpNewUser(page);
    const org = await createOrganization(page);
    await openAccountDetail(page, org.slug, PRIMARY_ACCOUNT_ID);
    const contacts = page.getByRole("region", { name: "Contacts" });
    await expect(contacts.getByRole("table")).toBeVisible();
    await expect(contacts.getByRole("link").first()).toBeVisible();
    await contacts.getByRole("button", { name: "New" }).click();
    await expect(page).toHaveURL(moduleCreatePath(org.slug, "Contacts"));
    await expect(page.getByRole("button", { name: "Open Account Name lookup" })).toBeVisible();
    ignoreFailedResponses(pageErrors, [400]);
  });

  test("Contacts card empty state", async ({ page }) => {
    await signUpNewUser(page);
    const org = await createOrganization(page);
    const listUrl = moduleListDefaultPath(org.slug, ACCOUNTS_TAB);
    await page.goto(listUrl);
    await expect(page.getByRole("table", { name: "Records" })).toBeVisible({ timeout: 15_000 });
    const contactsListDone = waitForModuleBulkList(page, "Contacts");
    await page.goto(moduleRecordPath(org.slug, ACCOUNTS_TAB, EMPTY_RELATED_ACCOUNT_ID));
    await expect(page.locator("[data-record-frame]")).toBeVisible();
    const contactsList = await contactsListDone;
    expect(contactsList.ok()).toBe(true);
    const contacts = page.getByRole("region", { name: "Contacts" });
    await expect(contacts.getByText("No records found")).toBeVisible();
  });

  test("Member Accounts card lists children and supports New", async ({ page, pageErrors }) => {
    await signUpNewUser(page);
    const org = await createOrganization(page);
    await openAccountDetail(page, org.slug, PRIMARY_ACCOUNT_ID);
    const members = page.getByRole("region", { name: "Member Accounts" });
    await expect(members.getByRole("table")).toBeVisible();
    await expect(members.getByRole("link").first()).toBeVisible();
    await members.getByRole("button", { name: "New" }).click();
    await expect(page).toHaveURL(moduleCreatePath(org.slug, ACCOUNTS_TAB));
    await expect(page.getByRole("button", { name: "Open Parent Account lookup" })).toBeVisible();
    ignoreFailedResponses(pageErrors, [400]);
  });

  test("Member Accounts rail link and Add action are active", async ({ page, pageErrors }) => {
    await signUpNewUser(page);
    const org = await createOrganization(page);
    await openAccountDetail(page, org.slug, PRIMARY_ACCOUNT_ID);
    const rail = page.locator("[data-record-rail]");
    const memberAccountsLink = rail.getByRole("link", { name: "Member Accounts" });
    await expect(memberAccountsLink).toBeVisible();
    await expect(memberAccountsLink).not.toHaveAttribute("data-later-module");
    await memberAccountsLink.click();
    const addButton = rail.getByRole("button", { name: "Add" });
    await expect(addButton).toBeVisible();
    await expect(addButton).not.toHaveAttribute("data-later-module");
    await addButton.click();
    await expect(page).toHaveURL(moduleCreatePath(org.slug, ACCOUNTS_TAB));
    await expect(page.getByRole("button", { name: "Open Parent Account lookup" })).toBeVisible();
    ignoreFailedResponses(pageErrors, [400]);
  });

  test("Member Accounts card empty state", async ({ page }) => {
    await signUpNewUser(page);
    const org = await createOrganization(page);
    const listUrl = moduleListDefaultPath(org.slug, ACCOUNTS_TAB);
    await page.goto(listUrl);
    await expect(page.getByRole("table", { name: "Records" })).toBeVisible({ timeout: 15_000 });
    const memberListDone = waitForModuleBulkList(page, "Accounts");
    await page.goto(moduleRecordPath(org.slug, ACCOUNTS_TAB, EMPTY_RELATED_ACCOUNT_ID));
    await expect(page.locator("[data-record-frame]")).toBeVisible();
    const memberList = await memberListDone;
    expect(memberList.ok()).toBe(true);
    const members = page.getByRole("region", { name: "Member Accounts" });
    await expect(members.getByText("No records found")).toBeVisible();
  });

  test("Parent Account link opens parent record", async ({ page, pageErrors }) => {
    await signUpNewUser(page);
    const org = await createOrganization(page);
    await openAccountDetail(page, org.slug, CHILD_ACCOUNT_ID);
    const parentLink = page
      .locator('[data-detail-field="Parent_Account"]')
      .getByRole("link")
      .first();
    await expect(parentLink).toBeVisible();
    await parentLink.click();
    await expect(page).toHaveURL(moduleRecordPath(org.slug, ACCOUNTS_TAB, PARENT_ACCOUNT_ID));
    ignoreFailedResponses(pageErrors, [400]);
  });

  test("later-module header control stays inert", async ({ page, pageErrors }) => {
    await signUpNewUser(page);
    const org = await createOrganization(page);
    await openAccountDetail(page, org.slug, PRIMARY_ACCOUNT_ID);
    const before = page.url();
    const sendEmail = page
      .locator("[data-record-header]")
      .getByRole("button", { name: "Send Email" });
    await expect(sendEmail).toHaveAttribute("data-later-module", "M10");
    await sendEmail.click({ force: true });
    expect(page.url()).toBe(before);
    ignoreFailedResponses(pageErrors, [400]);
  });

  test("primary command, tab-row update indicator and empty activity badges", async ({
    page,
    pageErrors,
  }) => {
    await signUpNewUser(page);
    const org = await createOrganization(page);
    await openAccountDetail(page, org.slug, PRIMARY_ACCOUNT_ID);

    // AD-05: Send Email draws the filled primary command; Edit keeps the secondary one.
    const sendEmail = page
      .locator("[data-record-header]")
      .getByRole("button", { name: "Send Email" });
    await expect(sendEmail).toHaveCSS(
      "background-image",
      /rgb\(87, 103, 246\).*rgb\(19, 77, 196\)/,
    );
    await expect(sendEmail).toHaveCSS("color", "rgb(255, 255, 255)");
    const edit = page.locator("[data-record-header]").getByRole("link", { name: "Edit" });
    await expect(edit).toHaveCSS("background-image", /rgb\(253, 253, 254\).*rgb\(241, 240, 247\)/);

    // AD-35: the indicator shares the Overview/Timeline row at its right end, clock first.
    const tabRow = page.locator("[data-record-tab-row]");
    const lastUpdate = tabRow.locator(".detail-last-update");
    await expect(lastUpdate).toBeVisible();
    await expect(lastUpdate.locator("svg")).toHaveCount(1);
    const row = requireBox(await tabRow.boundingBox(), "tab row");
    const label = requireBox(await lastUpdate.boundingBox(), "Last Update indicator");
    expect(label.y).toBeGreaterThanOrEqual(row.y);
    expect(label.y + label.height).toBeLessThanOrEqual(row.y + row.height);
    expect(row.x + row.width - (label.x + label.width)).toBeLessThanOrEqual(16);
    await expect(page.locator("[data-record-scroller] .detail-last-update")).toHaveCount(0);

    // AD-30/AD-31: the card holds no tasks, meetings or calls, so the rail draws no badge.
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
    if (process.env.PAPERCLIP_RUN_SCRATCH_DIR) {
      await page.screenshot({
        path: `${process.env.PAPERCLIP_RUN_SCRATCH_DIR}/mep394-account-detail.png`,
      });
    }
    ignoreFailedResponses(pageErrors, [400]);
  });
});

type Box = { x: number; y: number; width: number; height: number };

function requireBox(box: Box | null, label: string): Box {
  if (!box) throw new Error(`Missing ${label}`);
  return box;
}

function headerTitle(page: import("@playwright/test").Page) {
  return page.locator("[data-record-header]").getByRole("heading", { level: 1 });
}
