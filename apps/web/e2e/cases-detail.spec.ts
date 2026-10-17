import { signUpNewUser } from "./support/auth";
import { moduleListDefaultPath } from "./support/crm-paths";
import { createOrganization } from "./support/org";
import { expect, ignoreFailedResponses, test } from "./support/test";

async function openFirstCase(page: import("@playwright/test").Page, orgSlug: string) {
  await page.goto(moduleListDefaultPath(orgSlug, "Cases"));
  const list = page.locator(".module-list-page");
  await expect(list.getByRole("table", { name: "Records" })).toBeVisible({ timeout: 15_000 });
  const name = (
    await list.locator("tbody tr").first().getByRole("link").first().innerText()
  ).trim();
  await list.locator("tbody tr").first().getByRole("link").first().click();
  await expect(page).toHaveURL(/\/tab\/Cases\/[^/?]+/);
  await expect(page.locator("[data-record-frame]")).toBeVisible();
  return name;
}

test.describe("Cases record detail (provisional rules, MEP-863)", () => {
  test("header, Overview sections, inline edit and rail order", async ({ page, pageErrors }) => {
    await signUpNewUser(page);
    const org = await createOrganization(page);
    const name = await openFirstCase(page, org.slug);
    const header = page.locator("[data-record-header]");

    // GK-2: header (Subject title, previous / next arrows, Edit, More Options)
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

    // GK-3: Overview sections from layout
    const sections = page.locator("[data-detail-section]");
    await expect(sections.nth(0)).toHaveAttribute("data-detail-section", "Case Information");
    await expect(page.locator('[data-detail-section="Description Information"]')).toBeVisible();
    await expect(page.locator('[data-detail-section="Solution Information"]')).toBeVisible();
    await expect(page.locator('[data-detail-section="Comment Information"]')).toBeVisible();

    // GK-3: inline edit
    const row = page.locator('[data-detail-field="Subject"]');
    await row.hover();
    await row.getByRole("button", { name: "Edit Subject value" }).click();
    const input = row.getByRole("textbox");
    await input.fill("Renamed Case Subject");
    await input.press("Enter");
    await expect(row).toContainText("Renamed Case Subject");

    // GK-5: rail entries and metadata order
    const cards = await page
      .locator("[data-related-card]")
      .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-related-card")));
    expect(cards).toEqual([
      "connected-records",
      "notes",
      "attachments",
      "open-activities",
      "closed-activities",
      "emails",
    ]);

    // GK-5: Notes card works
    const notesCard = page.locator("#related-list-notes");
    await expect(notesCard).toBeVisible();
    await notesCard.getByTestId("note-composer-collapsed").click();
    await notesCard.getByLabel("Title").fill("E2E Case Note");
    await notesCard
      .getByRole("textbox", { name: "Note content" })
      .fill("Investigating case details.");
    await notesCard.getByRole("button", { name: "Save" }).click();
    await expect(notesCard.getByText("E2E Case Note")).toBeVisible();

    ignoreFailedResponses(pageErrors, [400]);
  });

  test("Timeline tab and filter panel", async ({ page, pageErrors }) => {
    await signUpNewUser(page);
    const org = await createOrganization(page);
    await openFirstCase(page, org.slug);
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
});
