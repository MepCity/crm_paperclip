import type { Page } from "@playwright/test";
import { signUpNewUser } from "./support/auth";
import { moduleListDefaultPath } from "./support/crm-paths";
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

async function pickProduct(page: Page, row: number) {
  await page.getByRole("textbox", { name: `Product Name ${row}` }).click();
  await page.locator(".line-items__menu-item").first().click();
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
  for (const n of [1, 2]) {
    await page.getByRole("button", { name: "Add row" }).click();
    await pickProduct(page, n);
    await page.getByLabel(`Quantity ${n}`).fill("2");
    await page.getByLabel(`List Price ${n}`).fill("100");
  }
  // 2 lines x 200 = 400
  await expect(page.locator('[data-total="grand"]')).toHaveText("400,00");
  await page.getByRole("button", { name: "Discount 1", exact: true }).click();
  await page.getByLabel("Discount 1 value").fill("10");
  await page.getByRole("radio", { name: "Percent (%)" }).check();
  await page.keyboard.press("Escape");
  await expect(page.locator('[data-total="grand"]')).toHaveText("380,00");

  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/crm/${org.slug}/tab/Invoices/\\d+$`), {
    timeout: 60_000,
  });
  await expect(page.locator('[data-total="grand"]')).toHaveText("380,00");

  await page.getByRole("link", { name: "Edit", exact: true }).first().click();
  await page.getByLabel("Quantity 2").fill("3");
  await expect(page.locator('[data-total="grand"]')).toHaveText("480,00");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.locator('[data-total="grand"]')).toHaveText("480,00", { timeout: 60_000 });
});
