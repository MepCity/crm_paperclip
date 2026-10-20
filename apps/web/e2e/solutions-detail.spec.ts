import { signUpNewUser } from "./support/auth";
import { moduleListDefaultPath } from "./support/crm-paths";
import { createOrganization } from "./support/org";
import { expect, ignoreFailedResponses, test } from "./support/test";

async function openFirstSolution(page: import("@playwright/test").Page, orgSlug: string) {
  await page.goto(moduleListDefaultPath(orgSlug, "Solutions"));
  const list = page.locator(".module-list-page");
  await expect(list.getByRole("table", { name: "Records" })).toBeVisible({ timeout: 15_000 });
  const name = (
    await list.locator("tbody tr").first().getByRole("link").first().innerText()
  ).trim();
  await list.locator("tbody tr").first().getByRole("link").first().click();
  await expect(page).toHaveURL(/\/tab\/Solutions\/[^/?]+/);
  await expect(page.locator("[data-record-frame]")).toBeVisible();
  return name;
}

test.describe("Solutions record detail (provisional rules, MEP-863)", () => {
  test("header, Overview sections, inline edit and rail order", async ({ page, pageErrors }) => {
    await signUpNewUser(page);
    const org = await createOrganization(page);
    const name = await openFirstSolution(page, org.slug);
    const header = page.locator("[data-record-header]");

    // GK-2: header (Solution Title title, previous / next arrows, Edit, More Options)
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
    await expect(sections.nth(0)).toHaveAttribute("data-detail-section", "Solution Information");
    await expect(page.locator('[data-detail-section="Description Information"]')).toBeVisible();
    await expect(page.locator('[data-detail-section="Comment Information"]')).toBeVisible();

    // GK-3: inline edit
    const row = page.locator('[data-detail-field="Solution_Title"]');
    await row.hover();
    await row.getByRole("button", { name: "Edit Solution Title value" }).click();
    const input = row.getByRole("textbox");
    await input.fill("Renamed Solution Title");
    await input.press("Enter");
    await expect(row).toContainText("Renamed Solution Title");

    // GK-5: rail entries and metadata order
    const cards = await page
      .locator("[data-related-card]")
      .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-related-card")));
    expect(cards).toEqual(["connected-records", "notes", "attachments"]);

    // GK-5: Notes card works
    const notesCard = page.locator("#related-list-notes");
    await expect(notesCard).toBeVisible();
    await notesCard.getByTestId("note-composer-collapsed").click();
    await notesCard.getByLabel("Title").fill("E2E Solution Note");
    await notesCard.getByRole("textbox", { name: "Note content" }).fill("Details of resolution.");
    await notesCard.getByRole("button", { name: "Save" }).click();
    await expect(notesCard.getByText("E2E Solution Note")).toBeVisible();

    ignoreFailedResponses(pageErrors, [400]);
  });

  test("Timeline tab and filter panel", async ({ page, pageErrors }) => {
    await signUpNewUser(page);
    const org = await createOrganization(page);
    await openFirstSolution(page, org.slug);
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

test("Attachments: attach a link, reload and show its Timeline event", async ({ page }) => {
  await signUpNewUser(page);
  const org = await createOrganization(page);
  await openFirstSolution(page, org.slug);
  const card = page.locator("#related-list-attachments");
  await expect(card.getByText("No Attachment")).toBeVisible();
  await card.getByRole("button", { name: "Attach", exact: true }).click();
  await page.getByRole("menuitem", { name: "Link (URL)" }).click();
  await page.getByRole("textbox").fill("https://example.com/support-guide");
  await page.getByRole("button", { name: "Attach", exact: true }).last().click();
  await expect(card.getByRole("link", { name: "https://example.com/support-guide" })).toBeVisible();
  await page.reload();
  await expect(card.getByRole("link", { name: "https://example.com/support-guide" })).toBeVisible();
  await page.getByRole("tab", { name: "Timeline", exact: true }).click();
  await expect(
    page
      .locator("[data-timeline-history]")
      .getByText("Attachment added: https://example.com/support-guide"),
  ).toBeVisible();
});
