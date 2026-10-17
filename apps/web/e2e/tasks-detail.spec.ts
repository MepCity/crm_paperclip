import { signUpNewUser } from "./support/auth";
import { moduleListDefaultPath, moduleRecordPath } from "./support/crm-paths";
import { createOrganization } from "./support/org";
import { expect, ignoreFailedResponses, test } from "./support/test";

const TASKS_TAB = "Tasks";
// Seeded task linked to a contact (Who_Id) and no related record.
const CONTACT_TASK_ID = "110000000000000249";

async function openTaskFromList(page: import("@playwright/test").Page, orgSlug: string) {
  await page.goto(moduleListDefaultPath(orgSlug, TASKS_TAB));
  const row = page.locator("table[aria-label='Records']").getByRole("link", { name: "Task 250" });
  await expect(row).toBeVisible({ timeout: 15_000 });
  await row.click();
  await expect(page).toHaveURL(moduleRecordPath(orgSlug, TASKS_TAB, CONTACT_TASK_ID));
  await expect(page.locator("[data-record-frame]")).toBeVisible();
}

test.describe("Tasks record detail", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1470, height: 835 });
  });

  test("opens from the list with header actions, business card and details", async ({
    page,
    pageErrors,
  }) => {
    await signUpNewUser(page);
    const org = await createOrganization(page);
    await openTaskFromList(page, org.slug);
    const header = page.locator("[data-record-header]");
    await expect(header.getByText("Task 250")).toBeVisible();
    await expect(header.getByRole("button", { name: "Add Tags" })).toBeVisible();
    // Close Task comes before Edit, More Options last.
    const labels = await header.getByRole("button").or(header.getByRole("link")).allInnerTexts();
    const wanted = ["Close Task", "Edit", "More Options", "Previous Record", "Next Record"];
    const names = await header
      .locator("button, a")
      .evaluateAll((els) =>
        els.map((el) => (el.textContent?.trim() || el.getAttribute("aria-label") || "").trim()),
      );
    expect(names.filter((n) => wanted.includes(n))).toEqual(wanted);
    expect(labels.length).toBeGreaterThan(0);
    // Last Update sits in the tab row, at its end.
    await expect(page.locator("[data-record-tab-row]").getByText(/Last Update/i)).toBeVisible();
    await expect(page.locator("[data-record-rail-control]")).toHaveCount(0);

    const card = page.getByRole("region", { name: "Business card" });
    const cardText = (await card.innerText()).replace(/\s+/g, " ");
    const positions = ["Priority", "Due Date", "Status", "Related To", "Task Owner"].map((label) =>
      cardText.indexOf(label),
    );
    expect(positions.every((p) => p >= 0)).toBe(true);
    expect(positions).toEqual([...positions].sort((x, y) => x - y));
    await expect(page.getByText("Task Information")).toBeVisible();
    // No related list rail on activity records.
    await expect(page.locator("[data-record-rail]")).toHaveCount(0);
    ignoreFailedResponses(pageErrors, [400]);
  });

  test("Related To shows the plural module suffix without a link", async ({ page, pageErrors }) => {
    await signUpNewUser(page);
    const org = await createOrganization(page);
    // Seeded task related to a deal (What_Id) and no person.
    await page.goto(moduleRecordPath(org.slug, TASKS_TAB, "110000000000000247"));
    await expect(page.locator("[data-record-frame]")).toBeVisible({ timeout: 15_000 });
    const card = page.getByRole("region", { name: "Business card" });
    await expect(card).toContainText("- Deals", { timeout: 15_000 });
    await expect(page.getByText("- Deals")).toHaveCount(2);
    ignoreFailedResponses(pageErrors, [400]);
  });

  test("More Options lists seven rows", async ({ page, pageErrors }) => {
    await signUpNewUser(page);
    const org = await createOrganization(page);
    await openTaskFromList(page, org.slug);
    await page
      .locator("[data-record-header]")
      .getByRole("button", { name: "More Options" })
      .click();
    await expect(page.getByRole("menuitem")).toHaveText([
      "Clone",
      "Share",
      "Delete",
      "Print Preview",
      "Customize Business Card",
      "Organize Task Details",
      "Create Button",
    ]);
    ignoreFailedResponses(pageErrors, [400]);
  });

  test("Timeline shows its empty state", async ({ page, pageErrors }) => {
    await signUpNewUser(page);
    const org = await createOrganization(page);
    await openTaskFromList(page, org.slug);
    const frame = page.locator("[data-record-frame]");
    await frame.getByRole("tab", { name: "Timeline" }).click();
    await expect(frame.locator("[data-timeline-history]")).toBeVisible();
    await expect(frame.getByText("No logs found")).toBeVisible();
    ignoreFailedResponses(pageErrors, [400]);
  });

  test("right panel shows person, Deal Summary and Open Activities", async ({
    page,
    pageErrors,
  }) => {
    await signUpNewUser(page);
    const org = await createOrganization(page);
    await openTaskFromList(page, org.slug);
    const panel = page.locator("[data-record-side-panel]");
    await expect(panel.getByRole("link", { name: /Contact/ }).first()).toBeVisible({
      timeout: 15_000,
    });
    await expect(panel.getByRole("region", { name: "Deal Summary" })).toBeVisible();
    const open = panel.getByRole("region", { name: "Open Activities" });
    for (const name of ["Tasks", "Meetings", "Calls"]) {
      await expect(open.getByRole("button", { name })).toBeVisible();
    }
    await expect(open.getByRole("button", { name: /Meetings/ })).toContainText("0");
    const callButtons = panel.getByRole("button", { name: /^Call (phone|mobile)$/ });
    await expect(callButtons).toHaveCount(2);
    ignoreFailedResponses(pageErrors, [400]);
  });

  test("Close Task completes an open task and hides the button", async ({ page, pageErrors }) => {
    await signUpNewUser(page);
    const org = await createOrganization(page);
    await openTaskFromList(page, org.slug);
    const header = page.locator("[data-record-header]");
    const close = header.getByRole("button", { name: "Close Task" });
    await expect(close).toBeVisible();
    await close.click();
    await expect(page.getByRole("alertdialog")).toHaveCount(0);
    await expect(close).toHaveCount(0);
    await expect(page.getByRole("region", { name: "Business card" })).toContainText("Completed");
    ignoreFailedResponses(pageErrors, [400]);
  });
});
