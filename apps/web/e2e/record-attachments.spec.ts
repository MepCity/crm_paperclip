import type { Page } from "@playwright/test";
import { signUpNewUser } from "./support/auth";
import { moduleListDefaultPath, moduleRecordPath } from "./support/crm-paths";
import { createOrganization } from "./support/org";
import { expect, ignoreFailedResponses, test } from "./support/test";

const RECORDS = {
  Leads: "100000000000000000",
  Contacts: "300000000000000000",
  Accounts: "500000000000000000",
  Deals: "700000000000000000",
} as const;

// 1x1 transparent PNG.
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
  "base64",
);

async function open(page: Page, module: keyof typeof RECORDS) {
  await page.setViewportSize({ width: 1470, height: 835 });
  await signUpNewUser(page);
  const org = await createOrganization(page);
  await page.goto(moduleListDefaultPath(org.slug, module));
  if (module !== "Deals")
    await expect(page.getByRole("table", { name: "Records" })).toBeVisible({ timeout: 15_000 });
  await page.goto(moduleRecordPath(org.slug, module, RECORDS[module]));
  const card = page.locator("#related-list-attachments");
  await expect(card.getByText("No Attachment")).toBeVisible({ timeout: 15_000 });
  return { org, card };
}

async function upload(page: Page, files: { name: string; mimeType: string; buffer: Buffer }[]) {
  await page.locator("#related-list-attachments [data-part=file-input]").setInputFiles(files);
}

test.describe("Record attachments card", () => {
  for (const module of Object.keys(RECORDS) as (keyof typeof RECORDS)[]) {
    test(`${module}: empty Attachments card with the four sources`, async ({ page }) => {
      const { card } = await open(page, module);
      await card.getByRole("button", { name: "Attach" }).click();
      await expect(page.getByRole("menuitem")).toHaveText([
        "Upload File",
        "Documents",
        "Other Cloud Drives",
        "Link (URL)",
      ]);
    });
  }

  test("Leads: upload, download, delete and Timeline events", async ({ page }) => {
    const { card } = await open(page, "Leads");
    await upload(page, [{ name: "pixel.png", mimeType: "image/png", buffer: PNG }]);
    await expect(card.getByRole("button", { name: "pixel.png", exact: true })).toBeVisible();

    const downloadPromise = page.waitForEvent("download");
    await card.getByRole("button", { name: "pixel.png", exact: true }).click();
    expect((await downloadPromise).suggestedFilename()).toBe("pixel.png");

    await page.getByRole("tab", { name: "Timeline" }).click();
    await expect(
      page.locator("[data-timeline-history]").getByText("Attachment added: pixel.png"),
    ).toBeVisible();
    await page.getByRole("tab", { name: "Overview" }).click();

    await card.getByText("pixel.png").hover();
    await card.getByRole("button", { name: "Delete pixel.png" }).click();
    await page.getByRole("button", { name: /^Delete$/ }).click();
    await expect(card.getByText("No Attachment")).toBeVisible();

    await page.getByRole("tab", { name: "Timeline" }).click();
    await expect(
      page.locator("[data-timeline-history]").getByText("Attachment deleted: pixel.png"),
    ).toBeVisible();
  });

  test("Accounts: attach a link and reject bad input", async ({ page }) => {
    const { card } = await open(page, "Accounts");
    await card.getByRole("button", { name: "Attach" }).click();
    await page.getByRole("menuitem", { name: "Link (URL)" }).click();
    await page.getByRole("textbox").fill("https://example.com/doc");
    await page.getByRole("button", { name: "Attach", exact: true }).last().click();
    await expect(card.getByRole("link", { name: "https://example.com/doc" })).toBeVisible();
  });

  test("Contacts: budget toast and unsupported type", async ({ page, pageErrors }) => {
    const { card } = await open(page, "Contacts");
    const many = Array.from({ length: 11 }, (_, i) => ({
      name: `f${i}.png`,
      mimeType: "image/png",
      buffer: PNG,
    }));
    await upload(page, many);
    await expect(
      page.getByText("You can attach up to 10 files with a total size of 100 MB at a time."),
    ).toBeVisible();
    await expect(card.getByText("No Attachment")).toBeVisible();

    await upload(page, [
      { name: "page.html", mimeType: "text/html", buffer: Buffer.from("<b>x</b>") },
    ]);
    await expect(card.getByText("This file type is not supported.")).toBeVisible();
    ignoreFailedResponses(pageErrors, [415]);
  });
});
