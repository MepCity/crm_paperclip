import type { Page } from "@playwright/test";
import { signUpNewUser } from "./support/auth";
import { moduleListDefaultPath } from "./support/crm-paths";
import { expectThreeLineTotals, fillThreeLines, money } from "./support/line-items";
import { createOrganization } from "./support/org";
import { expect, test } from "./support/test";

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1470, height: 835 });
});

async function pickAccount(page: Page) {
  await page.getByRole("button", { name: "Open Account Name lookup", exact: true }).click();
  const dialog = page.getByRole("dialog");
  const name = await dialog.getByRole("radio").first().getAttribute("aria-label");
  if (!name) throw new Error("Missing account");
  await dialog.getByRole("row", { name }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
}

test("Invoice create with lines, totals, detail, edit quantity", async ({ page }) => {
  await signUpNewUser(page);
  const org = await createOrganization(page);
  await page.goto(moduleListDefaultPath(org.slug, "Invoices"));
  await page.getByRole("link", { name: "Create Invoice", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Create Invoice" })).toBeVisible();

  // Validation: required Subject, Account and at least one line.
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Create Invoice" })).toBeVisible();

  await page.getByRole("textbox", { name: "Subject", exact: true }).fill("ZZ e2e Invoice");
  await pickAccount(page);
  await fillThreeLines(page);
  await expectThreeLineTotals(page);

  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/crm/${org.slug}/tab/Invoices/\\d+$`), {
    timeout: 60_000,
  });
  const grand = await expectThreeLineTotals(page);

  await page.getByRole("link", { name: "Edit", exact: true }).first().click();
  await page.getByLabel("Quantity 2").fill("3");
  await expect(page.locator('[data-total="grand"]')).toHaveText(money(grand + 100));
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.locator('[data-total="grand"]')).toHaveText(money(grand + 100), {
    timeout: 60_000,
  });
});

test("Invoice detail related lists and Created Time column", async ({ page }) => {
  await signUpNewUser(page);
  const org = await createOrganization(page);
  await page.goto(moduleListDefaultPath(org.slug, "Invoices"));
  await page.getByRole("link", { name: "Create Invoice", exact: true }).click();
  await page.getByRole("textbox", { name: "Subject", exact: true }).fill("ZZ e2e Invoice related");
  await pickAccount(page);
  await fillThreeLines(page);
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/crm/${org.slug}/tab/Invoices/\\d+$`), {
    timeout: 60_000,
  });
  for (const title of ["Notes", "Attachments", "Open Activities", "Closed Activities", "Emails"]) {
    await expect(page.getByText(title, { exact: true }).first()).toBeVisible();
  }

  await page.goto(moduleListDefaultPath(org.slug, "Invoices"));
  await expect(page.getByRole("columnheader", { name: "Created Time" })).toBeVisible();
});
