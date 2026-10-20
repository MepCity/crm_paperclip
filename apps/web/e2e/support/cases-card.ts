import type { Page } from "@playwright/test";
import { moduleCreatePath } from "./crm-paths";
import { expect } from "./test";

/** Empty Cases card: heading region, No records found, no table, Assign and New visible. */
export async function expectEmptyCasesCard(page: Page) {
  const cases = page.getByRole("region", { name: "Cases" });
  await cases.scrollIntoViewIfNeeded();
  await expect(cases.getByText("No records found")).toBeVisible();
  await expect(cases.getByRole("table")).toHaveCount(0);
  await expect(cases.getByRole("button", { name: "Assign" })).toBeVisible();
  await expect(cases.getByRole("button", { name: "New" })).toBeVisible();
}

/**
 * New → prefilled Cases form → Save → Case route; then back on the parent
 * record the card lists the new row and its Subject opens the Case detail.
 * Save lands on the Case record (not the parent), so the parent is reopened.
 */
export async function createCaseFromCardAndOpenIt(
  page: Page,
  orgSlug: string,
  parentUrl: string,
  subject: string,
) {
  const cases = page.getByRole("region", { name: "Cases" });
  await cases.getByRole("button", { name: "New" }).click();
  await expect(page).toHaveURL(moduleCreatePath(orgSlug, "Cases"));
  await page.getByRole("textbox", { name: "Subject", exact: true }).fill(subject);
  await page.getByRole("button", { name: "Case Origin", exact: true }).click();
  await page.getByRole("option", { name: "Email", exact: true }).click();
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/crm/${orgSlug}/tab/Cases/\\d+$`), {
    timeout: 60_000,
  });
  await page.goto(parentUrl);
  const refreshed = page.getByRole("region", { name: "Cases" });
  await refreshed.scrollIntoViewIfNeeded();
  await refreshed.getByRole("link", { name: subject, exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/crm/${orgSlug}/tab/Cases/\\d+$`));
}
