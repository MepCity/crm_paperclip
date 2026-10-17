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
  test("Leads: attach a file to a note, download it and delete it while editing", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1470, height: 835 });
    await signUpNewUser(page);
    const org = await createOrganization(page);
    await page.goto(moduleListDefaultPath(org.slug, "Leads"));
    await expect(page.getByRole("table", { name: "Records" })).toBeVisible({ timeout: 15_000 });
    await page.goto(moduleRecordPath(org.slug, "Leads", PRIMARY_LEAD_ID));
    const card = page.locator("#related-list-notes");

    await card.getByTestId("note-composer-collapsed").click();
    await card.getByLabel("Title").fill("Note with file");
    await card.getByTestId("note-file-input").setInputFiles({
      name: "hello.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("hello world"),
    });
    await expect(card.getByTestId("note-pending-files")).toContainText("hello.txt");
    await card.getByRole("button", { name: "Save" }).click();

    const attachments = card.getByTestId("note-attachments");
    await expect(attachments).toContainText("hello.txt");
    const downloadPromise = page.waitForEvent("download");
    await attachments.getByRole("button", { name: "hello.txt" }).click();
    expect((await downloadPromise).suggestedFilename()).toBe("hello.txt");

    await card.getByText("Note with file").hover();
    await card.getByRole("button", { name: "Edit note" }).first().click();
    await card.getByRole("button", { name: "Delete hello.txt" }).click();
    await expect(card.getByTestId("note-attachments")).toHaveCount(0);
  });
});
