import type { Locator, Page, Request } from "@playwright/test";
import {
  CONTACTS_FORM_ADDRESS_CHILD_ORDER,
  CONTACTS_FORM_INFORMATION_COLUMNS,
} from "../src/modules/contacts/contacts-form-rules";
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
  await page
    .getByRole("menuitem", { name: "Mailing Address → Other Address", exact: true })
    .click();
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

const isContactUpdate = (request: Request) =>
  request.method() === "PUT" &&
  /\/crm\/v2\.2\/Contacts\/[^/]+$/.test(new URL(request.url()).pathname);

function contactWrites(page: Page): string[] {
  const writes: string[] = [];
  page.on("request", (request) => {
    if (isContactUpdate(request)) writes.push(request.url());
  });
  return writes;
}

async function openEdit(page: Page) {
  await page.getByRole("link", { name: "Edit", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Edit Contact" })).toBeVisible();
}

/** Focusing an input in Chromium puts the caret in front of the text, so the mask needs it at the end. */
async function putCaretAtEnd(date: Locator) {
  await date.evaluate((element) => {
    if (!(element instanceof HTMLInputElement)) return;
    element.focus();
    element.setSelectionRange(element.value.length, element.value.length);
  });
}

/** The stored record the half-entry tests need: an optional date field that already has a day. */
async function createContactWithDateOfBirth(page: Page, lastName: string) {
  await page.getByRole("textbox", { name: "Last Name", exact: true }).fill(lastName);
  await page.getByRole("textbox", { name: "Date of Birth", exact: true }).fill("15.03.1990");
  const createRequest = page.waitForRequest(
    (request) =>
      request.method() === "POST" && new URL(request.url()).pathname === "/crm/v2.2/Contacts",
  );
  await page.getByRole("button", { name: "Save", exact: true }).click();
  expect((await createRequest).postDataJSON().data[0].Date_of_Birth).toBe("1990-03-15");
  await expect(page.locator("[data-record-header]")).toContainText(lastName);
}

test("a half-typed date blocks the write and keeps the stored day", async ({ page }) => {
  await openCreate(page);
  await createContactWithDateOfBirth(page, "Half Date Contact");
  await openEdit(page);
  const date = page.getByRole("textbox", { name: "Date of Birth", exact: true });
  const writes = contactWrites(page);
  await expect(date).toHaveValue("15.03.1990");
  await putCaretAtEnd(date);
  await page.keyboard.press("Backspace");
  await expect(date).toHaveValue("15.03.199");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByText("Please enter a valid Date of Birth.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Edit Contact" })).toBeVisible();
  expect(writes).toEqual([]);
  await expect(date).toHaveValue("15.03.199");
  // Completing the entry stores the corrected day.
  await putCaretAtEnd(date);
  await page.keyboard.press("6");
  await expect(date).toHaveValue("15.03.1996");
  const update = page.waitForRequest(isContactUpdate);
  await page.getByRole("button", { name: "Save", exact: true }).click();
  expect((await update).postDataJSON()).toEqual({ data: [{ Date_of_Birth: "1996-03-15" }] });
  expect(writes).toHaveLength(1);
});

test("clearing a stored date completely writes null", async ({ page }) => {
  await openCreate(page);
  await createContactWithDateOfBirth(page, "Cleared Date Contact");
  await openEdit(page);
  await page.getByRole("textbox", { name: "Date of Birth", exact: true }).fill("");
  const update = page.waitForRequest(isContactUpdate);
  await page.getByRole("button", { name: "Save", exact: true }).click();
  expect((await update).postDataJSON()).toEqual({ data: [{ Date_of_Birth: null }] });
  await expect(page.locator("[data-record-header]")).toContainText("Cleared Date Contact");
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
  // The Vendor Name lookup targets a module that does not ship yet, so it stays inert: no
  // dialog and no navigation. Account Name ships with Module 3 and opens Choose Account.
  await page
    .getByRole("button", { name: "Open Vendor Name lookup", exact: true })
    .click({ force: true });
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await page.getByRole("button", { name: "Contact Image", exact: true }).click({ force: true });
  await expect(page).toHaveURL(url);
  await page.goto(moduleCreatePath(org.slug, CONTACTS_TAB));
});

test("creates contact with Account Name chosen via lookup dialog and reflects account on detail", async ({
  page,
}) => {
  await openCreate(page);
  await page.getByRole("textbox", { name: "Last Name", exact: true }).fill("Account Contact");
  await page.getByRole("button", { name: "Open Account Name lookup", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Choose Account" });
  await expect(dialog).toBeVisible();
  const firstDataRow = dialog.locator("tbody tr").first();
  await expect(firstDataRow).toBeVisible();
  const nameLink = firstDataRow.locator("td").nth(1).getByRole("link");
  await expect(nameLink).toBeVisible();
  await expect(nameLink).toHaveAttribute("href", /\/tab\/Accounts\//);
  const chosenName = (await nameLink.innerText()).trim();
  await firstDataRow.click();
  await expect(dialog).toHaveCount(0);

  await expect(page.locator('[data-form-field="Account_Name"] input[type="text"]')).toHaveValue(
    chosenName,
  );

  const createRequest = page.waitForRequest(
    (request) =>
      request.method() === "POST" && new URL(request.url()).pathname === "/crm/v2.2/Contacts",
  );
  await page.getByRole("button", { name: "Save", exact: true }).click();
  const request = await createRequest;
  const body = request.postDataJSON().data[0];
  expect(body.Last_Name).toBe("Account Contact");
  expect(body.Account_Name).toMatchObject({
    name: chosenName,
  });
  expect(typeof body.Account_Name.id).toBe("string");

  const header = page.locator("[data-record-header]");
  await expect(header).toBeVisible();
  await expect(header).toContainText("Account Contact");
  await expect(header.getByRole("link", { name: chosenName })).toBeVisible();

  const detailsAccountLink = page
    .locator('[data-detail-field="Account_Name"]')
    .getByRole("link", { name: chosenName });
  await expect(detailsAccountLink).toBeVisible();
});

test("Contact Information and address groups follow spec field order", async ({ page }) => {
  await openCreate(page);
  const contactInfo = page
    .getByRole("heading", { name: "Contact Information", exact: true })
    .locator("xpath=ancestor::*[@data-record-form-section][1]");
  const leftOrder = await contactInfo
    .locator('[data-record-form-column="left"] [data-form-field]')
    .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-form-field")));
  expect(leftOrder).toEqual([...CONTACTS_FORM_INFORMATION_COLUMNS[0]]);
  const rightOrder = await contactInfo
    .locator('[data-record-form-column="right"] [data-form-field]')
    .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-form-field")));
  expect(rightOrder).toEqual([...CONTACTS_FORM_INFORMATION_COLUMNS[1]]);

  const mailing = page.locator("[data-record-form-field-group]").first();
  const mailingOrder = await mailing
    .locator("[data-form-field]")
    .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-form-field")));
  const expectedMailingOrder = CONTACTS_FORM_ADDRESS_CHILD_ORDER.map(
    (suffix) => `Mailing_${suffix}`,
  );
  expect(mailingOrder).toEqual(expectedMailingOrder);
  expect(await mailing.locator('[data-form-field="Mailing_Coordinates"]').count()).toBe(0);

  const other = page.locator("[data-record-form-field-group]").nth(1);
  const otherOrder = await other
    .locator("[data-form-field]")
    .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-form-field")));
  const expectedOtherOrder = CONTACTS_FORM_ADDRESS_CHILD_ORDER.map((suffix) => `Other_${suffix}`);
  expect(otherOrder).toEqual(expectedOtherOrder);
  expect(await other.locator('[data-form-field="Other_Coordinates"]').count()).toBe(0);
});

test("creates with common field types", async ({ page }) => {
  await openCreate(page);
  await page.getByRole("textbox", { name: "Last Name", exact: true }).fill("All Types");
  await page.getByRole("textbox", { name: "First Name", exact: true }).fill("Contact");
  await page.getByRole("button", { name: "Salutation", exact: true }).click();
  await page.getByRole("option", { name: "Mr.", exact: true }).click();
  await page.getByRole("textbox", { name: "Email", exact: true }).fill("all-types@example.test");
  await page.getByRole("textbox", { name: "Phone", exact: true }).fill("555-0100");
  await page.getByRole("textbox", { name: "Twitter", exact: true }).fill("mepcity");
  await page.getByRole("button", { name: "Lead Source", exact: true }).click();
  await page.getByRole("option", { name: "Advertisement", exact: true }).click();
  const emailOptOut = page.locator('[data-form-field="Email_Opt_Out"] input[type="checkbox"]');
  await emailOptOut.scrollIntoViewIfNeeded();
  await emailOptOut.click({ force: true });
  const createRequest = page.waitForRequest(
    (request) =>
      request.method() === "POST" && new URL(request.url()).pathname === "/crm/v2.2/Contacts",
  );
  await page.getByRole("button", { name: "Save", exact: true }).click();
  const request = await createRequest;
  const body = request.postDataJSON().data[0];
  expect(body.Last_Name).toBe("All Types");
  expect(body.First_Name).toBe("Contact");
  expect(body.Salutation).toBe("Mr.");
  expect(body.Email).toBe("all-types@example.test");
  expect(body.Phone).toBe("555-0100");
  expect(body.Twitter).toBe("mepcity");
  expect(body.Lead_Source).toBe("Advertisement");
  expect(body.Email_Opt_Out).toBe(true);
});
