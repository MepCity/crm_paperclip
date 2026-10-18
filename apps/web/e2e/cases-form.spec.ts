import type { Page } from "@playwright/test";
import { CASES_FORM_INFORMATION_COLUMNS } from "../src/modules/cases/cases-form-rules";
import { signUpNewUser } from "./support/auth";
import { moduleCreatePath, moduleListDefaultPath, moduleRecordEditPath } from "./support/crm-paths";
import { createOrganization } from "./support/org";
import { expect, test } from "./support/test";

const CASES_TAB = "Cases";

async function openCreate(page: Page) {
  await signUpNewUser(page);
  const org = await createOrganization(page);
  const list = moduleListDefaultPath(org.slug, CASES_TAB);
  await page.goto(list);
  await page.getByRole("link", { name: "Create Case", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Create Case" })).toBeVisible();
  return { org, list };
}

async function fillRequired(page: Page, subject: string) {
  await page.getByRole("textbox", { name: "Subject", exact: true }).fill(subject);
  await page.getByRole("button", { name: "Case Origin", exact: true }).click();
  await page.getByRole("option", { name: "Email", exact: true }).click();
}

async function expectRecordRoute(page: Page, orgSlug: string) {
  await expect(page).toHaveURL(new RegExp(`/crm/${orgSlug}/tab/Cases/\\d+$`), {
    timeout: 60_000,
  });
  await expect(page.getByRole("heading", { name: "Create Case" })).toHaveCount(0);
}

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1470, height: 835 });
});

test("sections, column order, locked Case Number and required marks", async ({ page }) => {
  await openCreate(page);
  for (const heading of ["Case Information", "Description Information", "Solution Information"]) {
    await expect(page.getByRole("heading", { name: heading, exact: true })).toBeVisible();
  }
  const section = page
    .getByRole("heading", { name: "Case Information", exact: true })
    .locator("xpath=ancestor::*[@data-record-form-section][1]");
  const left = await section
    .locator('[data-record-form-column="left"] [data-form-field]')
    .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-form-field")));
  const right = await section
    .locator('[data-record-form-column="right"] [data-form-field]')
    .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-form-field")));
  expect(left).toEqual([...CASES_FORM_INFORMATION_COLUMNS[0]]);
  expect(right).toEqual([...CASES_FORM_INFORMATION_COLUMNS[1]]);

  const number = page.getByRole("textbox", { name: "Case Number", exact: true });
  await expect(number).toHaveValue("");
  await expect(
    page.locator("[data-form-field=Case_Number]").getByRole("img", { name: "Locked" }),
  ).toBeVisible();
  for (const apiName of ["Status", "Case_Origin", "Subject"]) {
    await expect(
      page.locator(`[data-form-field=${apiName}] [data-required]`).first(),
    ).toBeVisible();
  }
  await expect(page.locator("[data-form-field=Owner] .record-choice-trigger")).toContainText(
    "Test User",
  );
  for (const absent of ["Add Comment", "Comments", "No. of comments"]) {
    await expect(page.getByText(absent, { exact: true })).toHaveCount(0);
  }
});

test("Status, Case Origin and Priority lists", async ({ page }) => {
  await openCreate(page);
  await expect(page.getByRole("button", { name: "Status", exact: true })).toContainText("New");
  await page.getByRole("button", { name: "Status", exact: true }).click();
  // The shared picklist always leads with -None- (KF-20.1–20.4 follow it, in this order).
  await expect(page.getByRole("option")).toHaveText([
    "-None-",
    "New",
    "Escalated",
    "On Hold",
    "Closed",
  ]);
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Case Origin", exact: true }).click();
  const origin = await page.getByRole("option").allInnerTexts();
  expect(origin).toHaveLength(4);
  expect(origin[0]).toBe("-None-");
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Priority", exact: true }).click();
  const priority = await page.getByRole("option").allInnerTexts();
  expect(priority).toHaveLength(4);
  expect(priority[0]).toBe("-None-");
});

test("empty Subject reports the required-field error", async ({ page }) => {
  await openCreate(page);
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByText("Subject cannot be empty.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Create Case" })).toBeVisible();
});

test("lookup pickers pick an Account and save to the record route", async ({ page }) => {
  const { org } = await openCreate(page);
  await fillRequired(page, "Picker case");
  await page.getByRole("button", { name: "Open Account Name lookup", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("heading", { name: "Choose Account" })).toBeVisible();
  const accountName = await dialog.getByRole("radio").first().getAttribute("aria-label");
  if (!accountName) throw new Error("Missing account name in the picker");
  await dialog.getByRole("row", { name: accountName }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expectRecordRoute(page, org.slug);
});

test("Save and New resets, Cancel returns to the list", async ({ page }) => {
  const { org, list } = await openCreate(page);
  await fillRequired(page, "Save And New");
  await page.getByRole("button", { name: "Save and New", exact: true }).click();
  await expect(page).toHaveURL(moduleCreatePath(org.slug, CASES_TAB));
  await expect(page.getByRole("textbox", { name: "Subject", exact: true })).toHaveValue("");
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(page).toHaveURL(list);
});

test("edit shows the locked Case Number and saves", async ({ page }) => {
  const { org } = await openCreate(page);
  await fillRequired(page, "Edit Me");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expectRecordRoute(page, org.slug);
  const id = new URL(page.url()).pathname.split("/").filter(Boolean).pop() ?? "";
  await page.goto(moduleRecordEditPath(org.slug, CASES_TAB, id));
  await expect(page.getByRole("heading", { name: "Edit Case" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Subject", exact: true })).toHaveValue("Edit Me");
  await expect(page.getByRole("textbox", { name: "Case Number", exact: true })).not.toHaveValue("");
  await expect(page.getByRole("textbox", { name: "Case Number", exact: true })).toBeDisabled();
  await page.getByRole("textbox", { name: "Subject", exact: true }).fill("Edited");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/tab/Cases/${id}$`), { timeout: 60_000 });
});

test("laterModule controls do not navigate or open dialogs", async ({ page }) => {
  await openCreate(page);
  const url = page.url();
  for (const name of [
    "Edit Page Layout",
    "Client Script",
    "Standard View",
    "Create a custom form page",
  ]) {
    const control = page.getByRole("button", { name, exact: true });
    await expect(control).toBeVisible();
    await control.click({ force: true });
  }
  await expect(page).toHaveURL(url);
  await expect(page.getByRole("dialog")).toHaveCount(0);
});
