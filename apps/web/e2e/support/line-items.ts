import { computeLineItemTotals } from "@crm/core/records/line-items";
import type { Page } from "@playwright/test";
import { expect } from "./test";

/** Same layout as the reference tax list: 20 % VAT on line 3. */
const LINES = [
  { qty: "2", price: "100", discount: { mode: "percent", value: "10" } },
  { qty: "1", price: "50", discount: { mode: "amount", value: "5" } },
  { qty: "3", price: "20", discount: null, tax: "Vat - 20 %" },
] as const;
const HEADER_DISCOUNT = 10;
const ADJUSTMENT = 5;

function expectedTotals() {
  return computeLineItemTotals(
    LINES.map((line) => ({
      Product_Name: { module: "Products", id: "1" },
      Quantity: Number(line.qty),
      List_Price: Number(line.price),
      ...(line.discount?.mode === "percent"
        ? { Discount_Percentage: Number(line.discount.value) }
        : { Discount: line.discount ? Number(line.discount.value) : 0 }),
      Line_Tax: "tax" in line ? [{ name: "Vat" }] : [],
    })),
    { Discount: HEADER_DISCOUNT, Adjustment: ADJUSTMENT },
  );
}

export const money = (value: number) =>
  value.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

async function pickProduct(page: Page, row: number) {
  await page.getByRole("textbox", { name: `Product Name ${row}` }).click();
  await page.locator(".line-items__menu-item").first().click();
}

/** Fills three lines (percent + amount discount, VAT) plus header discount and adjustment. */
export async function fillThreeLines(page: Page): Promise<void> {
  for (const [i, line] of LINES.entries()) {
    const n = i + 1;
    await page.getByRole("button", { name: "Add row" }).click();
    await pickProduct(page, n);
    await page.getByLabel(`Quantity ${n}`).fill(line.qty);
    await page.getByLabel(`List Price ${n}`).fill(line.price);
    if (line.discount) {
      await page.getByRole("button", { name: `Discount ${n}`, exact: true }).click();
      await page.getByLabel(`Discount ${n} value`).fill(line.discount.value);
      await page
        .getByRole("radio", {
          name: line.discount.mode === "percent" ? "Percent (%)" : "Amount (TL)",
        })
        .check();
      await page.keyboard.press("Escape");
    }
    if ("tax" in line) {
      await page.getByRole("button", { name: `Tax ${n}`, exact: true }).click();
      await page.getByRole("checkbox", { name: line.tax }).check();
      await page.keyboard.press("Escape");
    }
  }
  await page.getByRole("button", { name: "Discount", exact: true }).click();
  await page.getByRole("radio", { name: "Amount (TL)" }).check();
  await page.getByLabel("Discount value").fill(String(HEADER_DISCOUNT));
  await page.keyboard.press("Escape");
  await page.getByLabel("Adjustment", { exact: true }).fill(String(ADJUSTMENT));
}

/** Asserts the totals block (editor or detail) shows what `computeLineItemTotals` returns. */
export async function expectThreeLineTotals(page: Page): Promise<number> {
  const expected = expectedTotals();
  await expect(page.locator('[data-total="sub"]')).toHaveText(money(expected.Sub_Total));
  await expect(page.locator('[data-total="grand"]')).toHaveText(money(expected.Grand_Total));
  return expected.Grand_Total;
}
