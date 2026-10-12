import type { Page } from "@playwright/test";
import { signUpNewUser } from "./support/auth";
import {
  moduleCreatePath,
  moduleListDefaultPath,
  moduleRecordClonePath,
} from "./support/crm-paths";
import { createOrganization } from "./support/org";
import { expect, test } from "./support/test";

const CONTACTS_TAB = "Contacts";

function contactRecordIdFromPath(pathname: string): string {
  const parts = pathname.split("/").filter(Boolean);
  const index = parts.indexOf("Contacts");
  const id = index >= 0 ? parts[index + 1] : undefined;
  if (!id || id === "list" || id === "create" || id === "custom-view") {
    throw new Error(`Expected a contact record id in ${pathname}`);
  }
  return id;
}

async function openCreate(page: Page) {
  await signUpNewUser(page);
  const org = await createOrganization(page);
  const list = moduleListDefaultPath(org.slug, CONTACTS_TAB);
  await page.goto(list);
  await page.getByRole("link", { name: "Create Contact", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Create Contact" })).toBeVisible();
  return { org, list };
}

async function saveContact(page: Page, lastName: string) {
  await page.getByRole("textbox", { name: "Last Name", exact: true }).fill(lastName);
  const createRequest = page.waitForRequest(
    (request) =>
      request.method() === "POST" && new URL(request.url()).pathname === "/crm/v2.2/Contacts",
  );
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await createRequest;
  await expect(page.locator("[data-record-header]")).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1470, height: 835 });
});

test("empty save shows Last Name validation", async ({ page }) => {
  await openCreate(page);
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByText("Last Name cannot be empty.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Create Contact" })).toBeVisible();
});

test("creates with Last Name only and opens detail", async ({ page }) => {
  await openCreate(page);
  await saveContact(page, "Solo Contact");
  await expect(page.locator("[data-record-header]")).toContainText("Solo Contact");
});

test("creates with date, reporting lookup, dual addresses and Copy Address", async ({ page }) => {
  const { org } = await openCreate(page);
  await saveContact(page, "Manager Contact");
  await page.goto(moduleCreatePath(org.slug, CONTACTS_TAB));
  await page.getByRole("textbox", { name: "Last Name", exact: true }).fill("Full Form Contact");
  await page.getByRole("textbox", { name: "Date of Birth", exact: true }).fill("15.03.1990");
  await page.locator("[data-form-field=Mailing_Street] input").fill("Mailing Street 1");
  await page.getByRole("button", { name: "Copy Address", exact: true }).click();
  await expect(page.locator("[data-form-field=Other_Street] input")).toHaveValue(
    "Mailing Street 1",
  );
  await page.getByRole("button", { name: "Open Reporting To lookup", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("row", { name: /Manager Contact/ })
    .click();
  await page.getByRole("button", { name: "Done", exact: true }).click();
  const createRequest = page.waitForRequest(
    (request) =>
      request.method() === "POST" && new URL(request.url()).pathname === "/crm/v2.2/Contacts",
  );
  await page.getByRole("button", { name: "Save", exact: true }).click();
  const request = await createRequest;
  const body = request.postDataJSON().data[0];
  expect(body.Last_Name).toBe("Full Form Contact");
  expect(body.Date_of_Birth).toBe("1990-03-15");
  expect(body.Mailing_Street).toBe("Mailing Street 1");
  expect(body.Other_Street).toBe("Mailing Street 1");
  expect(body.Reporting_To).toBeTruthy();
});

test("Save and New resets create form", async ({ page }) => {
  const { org } = await openCreate(page);
  await page.getByRole("textbox", { name: "Last Name", exact: true }).fill("Save And New");
  await page.getByRole("button", { name: "Save and New", exact: true }).click();
  await expect(page).toHaveURL(moduleCreatePath(org.slug, CONTACTS_TAB));
  await expect(page.getByRole("textbox", { name: "Last Name", exact: true })).toHaveValue("");
});

test("Cancel returns to list without saving", async ({ page }) => {
  const { list } = await openCreate(page);
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(page).toHaveURL(list);
  await page.goto(list);
  await expect(page.getByRole("link", { name: "Cancelled", exact: true })).toHaveCount(0);
});

test("edit preserves values and saves changes", async ({ page }) => {
  await openCreate(page);
  await saveContact(page, "Edit Me");
  await page.getByRole("link", { name: "Edit", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Edit Contact" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Last Name", exact: true })).toHaveValue(
    "Edit Me",
  );
  await page.getByRole("textbox", { name: "Last Name", exact: true }).fill("Edited Contact");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.locator("[data-record-header]")).toContainText("Edited Contact");
});

test("clone saves a new record from the source", async ({ page }) => {
  const { org } = await openCreate(page);
  await saveContact(page, "Clone Source");
  const sourceId = contactRecordIdFromPath(new URL(page.url()).pathname);
  await page.getByRole("button", { name: "More Options", exact: true }).click();
  await page.getByRole("menuitem", { name: "Clone", exact: true }).click();
  await expect(page).toHaveURL(moduleRecordClonePath(org.slug, CONTACTS_TAB, sourceId));
  await expect(page.getByRole("heading", { name: "Clone Contact" })).toBeVisible();
  await page.getByRole("textbox", { name: "Last Name", exact: true }).fill("Clone Saved");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.locator("[data-record-header]")).toContainText("Clone Saved");
});

test("laterModule controls do not navigate or open dialogs", async ({ page }) => {
  const { org } = await openCreate(page);
  const url = page.url();
  await page.getByRole("button", { name: "Edit Page Layout", exact: true }).click({ force: true });
  await expect(page).toHaveURL(url);
  await page
    .getByRole("button", { name: "Open Account Name lookup", exact: true })
    .click({ force: true });
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.goto(moduleCreatePath(org.slug, CONTACTS_TAB));
});
