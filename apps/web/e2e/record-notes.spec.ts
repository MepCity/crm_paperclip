import { signUpNewUser } from "./support/auth";
import { moduleListDefaultPath, moduleRecordPath } from "./support/crm-paths";
import { createOrganization } from "./support/org";
import { expect, test } from "./support/test";

const PRIMARY_ACCOUNT_ID = "500000000000000000";
const PRIMARY_LEAD_ID = "100000000000000000";

test.describe("Record notes card", () => {
  test("Accounts: add, edit and delete a note", async ({ page }) => {
    await page.setViewportSize({ width: 1470, height: 835 });
    await signUpNewUser(page);
    const org = await createOrganization(page);
    await page.goto(moduleListDefaultPath(org.slug, "Accounts"));
    await expect(page.getByRole("table", { name: "Records" })).toBeVisible({ timeout: 15_000 });
    await page.goto(moduleRecordPath(org.slug, "Accounts", PRIMARY_ACCOUNT_ID));
    const card = page.locator("#related-list-notes");
    await expect(card.getByTestId("note-composer-collapsed")).toBeVisible();

    await card.getByTestId("note-composer-collapsed").click();
    await card.getByLabel("Title").fill("E2E note");
    await card.getByRole("textbox", { name: "Note content" }).fill("First body");
    await card.getByRole("button", { name: "Save" }).click();
    await expect(card.getByText("E2E note")).toBeVisible();
    await expect(card.getByTestId("note-composer")).toHaveCount(0);

    await page.getByRole("tab", { name: "Timeline" }).click();
    const history = page.locator("[data-timeline-history]");
    await expect(history.getByText("Note added: E2E note")).toBeVisible();
    await expect(history.getByText("First body")).toBeVisible();
    await page.getByRole("tab", { name: "Overview" }).click();

    await card.getByText("E2E note").hover();
    await card.getByRole("button", { name: "Edit note" }).first().click();
    await card.getByLabel("Title").fill("E2E note edited");
    await card.getByRole("button", { name: "Save" }).click();
    await expect(card.getByText("E2E note edited")).toBeVisible();

    await card.getByText("E2E note edited").hover();
    await card.getByRole("button", { name: "Delete note" }).first().click();
    await page.getByRole("button", { name: /^Delete$/ }).click();
    await expect(card.getByText("E2E note edited")).toHaveCount(0);
  });

  test("Leads: add, edit and delete a note", async ({ page }) => {
    await page.setViewportSize({ width: 1470, height: 835 });
    await signUpNewUser(page);
    const org = await createOrganization(page);
    await page.goto(moduleListDefaultPath(org.slug, "Leads"));
    await expect(page.getByRole("table", { name: "Records" })).toBeVisible({ timeout: 15_000 });
    await page.goto(moduleRecordPath(org.slug, "Leads", PRIMARY_LEAD_ID));
    const card = page.locator("#related-list-notes");
    await expect(card.getByTestId("note-composer-collapsed")).toBeVisible();

    await card.getByTestId("note-composer-collapsed").click();
    await card.getByLabel("Title").fill("Lead E2E note");
    await card.getByRole("textbox", { name: "Note content" }).fill("Lead body");
    await card.getByRole("button", { name: "Save" }).click();
    await expect(card.getByText("Lead E2E note")).toBeVisible();
    await expect(card.getByTestId("note-composer")).toHaveCount(0);

    await card.getByText("Lead E2E note").hover();
    await card.getByRole("button", { name: "Edit note" }).first().click();
    await card.getByLabel("Title").fill("Lead E2E note edited");
    await card.getByRole("button", { name: "Save" }).click();
    await expect(card.getByText("Lead E2E note edited")).toBeVisible();

    await card.getByText("Lead E2E note edited").hover();
    await card.getByRole("button", { name: "Delete note" }).first().click();
    await page.getByRole("button", { name: /^Delete$/ }).click();
    await expect(card.getByText("Lead E2E note edited")).toHaveCount(0);
  });
});
