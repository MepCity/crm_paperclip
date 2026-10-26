import type { Page } from "@playwright/test";
import { signUpNewUser } from "./support/auth";
import { moduleListDefaultPath } from "./support/crm-paths";
import { createOrganization } from "./support/org";
import { expect, test } from "./support/test";

// Every test signs up a fresh organization, so the seeded Kanban view is
// always the starting state and nothing needs resetting afterwards.
async function openSettings(page: Page) {
  await signUpNewUser(page);
  const org = await createOrganization(page);
  await page.goto(moduleListDefaultPath(org.slug, "Deals"));
  await expect(page.locator("[data-record-board]")).toBeVisible();
  await page.getByRole("button", { name: "Board settings" }).click();
  const dialog = page.getByRole("dialog", { name: "Kanban View - Settings" });
  await expect(dialog).toBeVisible();
  return dialog;
}

test("Kanban settings window shows the four fields and both field lists", async ({ page }) => {
  const dialog = await openSettings(page);
  await expect(dialog.getByRole("textbox", { name: "Kanban View Name" })).toHaveValue(/.+/);
  await expect(dialog.getByRole("button", { name: /Categorize By/ }).first()).toBeVisible();
  await expect(dialog.getByRole("button", { name: /Aggregate By/ }).first()).toBeVisible();
  await expect(dialog.getByRole("button", { name: /Header Style/ }).first()).toBeVisible();
  await expect(dialog.getByRole("list", { name: "Available" })).toBeVisible();
  await expect(dialog.getByRole("list", { name: "Selected" })).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Required Deal Name" })).toBeDisabled();
});

test("Kanban settings change the card fields after Save", async ({ page }) => {
  const dialog = await openSettings(page);
  await dialog.getByRole("button", { name: "Remove Closing Date" }).click();
  await dialog.getByRole("button", { name: "Add Created Time" }).click();
  await expect(
    dialog
      .getByRole("list", { name: "Selected" })
      .getByRole("button", { name: "Remove Created Time" }),
  ).toBeVisible();
  await dialog.getByRole("button", { name: "Save" }).click();
  await expect(dialog).toBeHidden();

  const firstCard = page.locator('[data-board-column="Qualification"] [data-board-card]').first();
  const rows = firstCard.locator(":scope > div");
  // Closing date is gone; the added field (Created Time) has the time and comes last.
  await expect(rows.nth(6)).toContainText(/AM|PM/);
  await expect(rows.nth(6)).not.toBeEmpty();
});

test("Aggregate By set to None removes the column totals", async ({ page }) => {
  const dialog = await openSettings(page);
  await expect(page.locator(".record-board-total").first()).toBeVisible();
  await dialog.getByRole("button", { name: /Amount Aggregate By/ }).click();
  await page.getByRole("option", { name: "--None--" }).click();
  await dialog.getByRole("button", { name: "Save" }).click();
  await expect(dialog).toBeHidden();
  await expect(page.locator(".record-board-total")).toHaveCount(0);
});

test("Save with an empty name shows an error and keeps the window open", async ({ page }) => {
  const dialog = await openSettings(page);
  await dialog.getByRole("textbox", { name: "Kanban View Name" }).fill("");
  await dialog.getByRole("button", { name: "Save" }).click();
  await expect(dialog.getByText("Enter a Kanban view name.")).toBeVisible();
  await expect(dialog).toBeVisible();
});

test("Cancel discards changes", async ({ page }) => {
  const dialog = await openSettings(page);
  await dialog.getByRole("button", { name: "Remove Closing Date" }).click();
  await dialog.getByRole("button", { name: "Cancel" }).click();
  await expect(dialog).toBeHidden();
  const firstCard = page.locator('[data-board-column="Qualification"] [data-board-card]').first();
  await expect(firstCard.locator(":scope > div")).toHaveCount(7);
  await expect(firstCard.locator(":scope > div").nth(6)).toHaveText(/^\d{2}\.\d{2}\.\d{4}$/);
});

test("Manage Kanban Views modal opens from selector and closes with Close Modal", async ({
  page,
}) => {
  await signUpNewUser(page);
  const org = await createOrganization(page);
  await page.goto(moduleListDefaultPath(org.slug, "Deals"));
  await expect(page.locator("[data-record-board]")).toBeVisible();
  await page
    .getByRole("combobox", { name: "Board grouping" })
    .selectOption("__manage_kanban_views__");
  const dialog = page.getByRole("dialog", { name: "Manage Kanban Views" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("columnheader", { name: "View Name" })).toBeVisible();
  await expect(dialog.getByRole("columnheader", { name: "Used Field" })).toBeVisible();
  await expect(dialog.getByRole("columnheader", { name: "Shared To" })).toBeVisible();
  await expect(dialog.getByRole("cell", { name: "STAGEVIEW" })).toBeVisible();
  await expect(dialog.getByRole("cell", { name: "Everyone" })).toBeVisible();
  await dialog.getByRole("button", { name: "Close Modal" }).click();
  await expect(dialog).toBeHidden();
});
