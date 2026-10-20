import { signUpNewUser } from "./support/auth";
import { moduleListDefaultPath, moduleRecordPath } from "./support/crm-paths";
import { createOrganization } from "./support/org";
import { expect, test } from "./support/test";

async function openMeeting(page: import("@playwright/test").Page, orgSlug: string) {
  await page.goto(moduleListDefaultPath(orgSlug, "Meetings"));
  // Synthetic timed meeting with a contact, deal and empty Participants array.
  await page
    .getByRole("table", { name: "Records" })
    .getByRole("link", { name: "Meeting 246", exact: true })
    .click();
  await expect(page).toHaveURL(moduleRecordPath(orgSlug, "Meetings", "130000000000000245"));
  await expect(page.locator("[data-record-frame]")).toBeVisible();
}

test.describe("Meetings record detail", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1470, height: 835 });
  });

  test("list opens the meeting with ordered header, business card and Participants", async ({
    page,
  }) => {
    await signUpNewUser(page);
    const org = await createOrganization(page);
    await openMeeting(page, org.slug);
    const header = page.locator("[data-record-header]");
    await expect(header).toContainText("Meeting 246");
    await expect(header.locator("[data-record-portrait]")).toHaveCount(1);
    await expect(header.getByRole("button", { name: "Close Task" })).toHaveCount(0);
    const wanted = ["Edit", "More Options", "Previous Record", "Next Record"];
    const names = await header
      .locator("button, a")
      .evaluateAll((els) =>
        els.map((el) => (el.textContent?.trim() || el.getAttribute("aria-label") || "").trim()),
      );
    expect(names.filter((name) => wanted.includes(name))).toEqual(wanted);
    await expect(header.getByRole("link", { name: "Edit", exact: true })).toHaveAttribute(
      "href",
      /\/tab\/Meetings\/130000000000000245\/edit$/,
    );
    const before = page.url();
    await header.getByRole("button", { name: "Add Tags" }).click({ force: true });
    expect(page.url()).toBe(before);
    await expect(page.locator("[data-record-tab-row]").getByText(/Last Update/)).toBeVisible();
    await expect(page.locator("[data-record-rail], [data-record-rail-control]")).toHaveCount(0);

    const card = page.getByRole("region", { name: "Business card" });
    await expect(card.locator(".detail-field-label")).toHaveText([
      "From",
      "To",
      "All day",
      "Meeting Venue",
      "Location",
      "Host",
      "Related To",
      "Contact Name",
    ]);
    for (const field of ["All_day", "Venue"]) {
      await expect(card.locator(`[data-detail-field='${field}'] .detail-field-value`)).toHaveText(
        "—",
      );
    }
    await expect(
      card.locator("[data-detail-field='Start_DateTime'] .detail-field-value"),
    ).toHaveText(/^\d{2}\.\d{2}\.\d{4} \d{1,2}:\d{2} (AM|PM)$/);
    await expect(card.getByRole("button")).toHaveCount(0);
    await expect(card.locator("[data-detail-field='What_Id']")).toContainText("- Deals");
    await expect(card.locator("[data-detail-field='What_Id']").getByRole("link")).toHaveAttribute(
      "href",
      /\/tab\/Deals\//,
    );
    await expect(card.locator("[data-detail-field='Who_Id']").getByRole("link")).toHaveAttribute(
      "href",
      /\/tab\/Contacts\//,
    );

    const participants = page.getByRole("region", { name: "Participants card" });
    await expect(participants.getByText("No participant found")).toBeVisible();
    await participants.getByRole("button", { name: "Add", exact: true }).click();
    await expect(participants.getByText("No participant found")).toBeVisible();
    expect(page.url()).toBe(before);
    const cancelModal = page.getByRole("button", { name: "Cancel" });
    if (await cancelModal.isVisible()) {
      await cancelModal.click();
    }
    expect(
      await page
        .locator(".detail-card")
        .evaluateAll((els) => els.map((el) => el.getAttribute("aria-label"))),
    ).toEqual(["Business card", "Participants card", "Details card"]);
    await expect(page.getByText("Meeting Information", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Hide Details" }).click();
    await expect(page.getByRole("button", { name: "Show Details" })).toBeVisible();
  });

  test("populated opaque Participants keep a blank body and inert Add", async ({ page }) => {
    await signUpNewUser(page);
    const org = await createOrganization(page);
    await page.goto(moduleRecordPath(org.slug, "Meetings", "130000000000000244"));
    const card = page.getByRole("region", { name: "Participants card" });
    await expect(card.locator('[data-part="opaque"]')).toBeVisible();
    await expect(card.getByText("No participant found")).toHaveCount(0);
    await expect(card.getByRole("list")).toHaveCount(0);
    await card.getByRole("button", { name: "Add", exact: true }).click();
    await expect(card.locator('[data-part="opaque"]')).toBeVisible();
  });

  test("More Options has six rows and Timeline has no logs", async ({ page }) => {
    await signUpNewUser(page);
    const org = await createOrganization(page);
    await openMeeting(page, org.slug);
    await page
      .locator("[data-record-header]")
      .getByRole("button", { name: "More Options" })
      .click();
    await expect(page.getByRole("menuitem")).toHaveText([
      "Clone",
      "Share",
      "Delete",
      "Print Preview",
      "Export Meeting",
      "Create Button",
    ]);
    await page.keyboard.press("Escape");
    await page.locator("[data-record-frame]").getByRole("tab", { name: "Timeline" }).click();
    await expect(page.locator("[data-timeline-history]").getByText("No logs found")).toBeVisible();
  });

  test("right panel loads the linked contact and shared relation sections", async ({ page }) => {
    await signUpNewUser(page);
    const org = await createOrganization(page);
    await openMeeting(page, org.slug);
    const panel = page.locator("[data-record-side-panel]");
    await expect(panel.getByRole("link", { name: /Contact/ }).first()).toBeVisible();
    await expect(panel.getByRole("tab", { name: "Info", exact: true })).toBeVisible();
    await expect(panel.getByRole("tab", { name: "Conversations", exact: true })).toBeVisible();
    await expect(panel.getByRole("region", { name: "Deal Summary" })).toBeVisible();
    const open = panel.getByRole("region", { name: "Open Activities" });
    for (const name of ["Tasks", "Meetings", "Calls"])
      await expect(open.getByRole("button", { name })).toBeVisible();
  });
});
