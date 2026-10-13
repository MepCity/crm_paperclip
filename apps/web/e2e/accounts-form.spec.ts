import type { Page } from "@playwright/test";
import {
  ACCOUNTS_FORM_ADDRESS_CHILD_ORDER,
  ACCOUNTS_FORM_INFORMATION_COLUMNS,
} from "../src/modules/accounts/accounts-form-rules";
import { signUpNewUser } from "./support/auth";
import {
  moduleCreatePath,
  moduleListDefaultPath,
  moduleRecordClonePath,
  moduleRecordEditPath,
} from "./support/crm-paths";
import { createOrganization } from "./support/org";
import { expect, test } from "./support/test";

const ACCOUNTS_TAB = "Accounts";
const CREATE_PATH = "/crm/v2.2/Accounts";

/**
 * Latitude and Longitude share one Coordinates row, which is keyed by the latitude field,
 * so the drawn row order stops at Latitude.
 */
const addressRowOrder = (prefix: string) =>
  ACCOUNTS_FORM_ADDRESS_CHILD_ORDER.filter((suffix) => suffix !== "Longitude").map(
    (suffix) => `${prefix}_${suffix}`,
  );
const BILLING_ADDRESS_ROW_ORDER = addressRowOrder("Billing");
const SHIPPING_ADDRESS_ROW_ORDER = addressRowOrder("Shipping");

function accountRecordIdFromPath(pathname: string): string {
  const parts = pathname.split("/").filter(Boolean);
  const index = parts.indexOf("Accounts");
  const id = index >= 0 ? parts[index + 1] : undefined;
  if (!id || id === "list" || id === "create" || id === "custom-view") {
    throw new Error(`Expected an account record id in ${pathname}`);
  }
  return id;
}

async function openCreate(page: Page) {
  await signUpNewUser(page);
  const org = await createOrganization(page);
  const list = moduleListDefaultPath(org.slug, ACCOUNTS_TAB);
  await page.goto(list);
  await page.getByRole("link", { name: "Create Account", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Create Account" })).toBeVisible();
  return { org, list };
}

async function saveAccount(page: Page, name: string) {
  await page.getByRole("textbox", { name: "Account Name", exact: true }).fill(name);
  const createRequest = page.waitForRequest(
    (request) => request.method() === "POST" && new URL(request.url()).pathname === CREATE_PATH,
  );
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await createRequest;
}

/**
 * The Accounts record detail inventory belongs to MEP-342, so arrival after a save is proven
 * by the record route and by the create form being gone.
 */
async function expectRecordRoute(page: Page, orgSlug: string) {
  await expect(page).toHaveURL(new RegExp(`/crm/${orgSlug}/tab/Accounts/\\d+$`), {
    timeout: 60_000,
  });
  await expect(page.getByRole("heading", { name: "Create Account" })).toHaveCount(0);
}

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1470, height: 835 });
});

test("empty save shows Account Name validation", async ({ page }) => {
  await openCreate(page);
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByText("Account Name cannot be empty.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Create Account" })).toBeVisible();
});

test("creates with Account Name only and arrives at the record route", async ({ page }) => {
  const { org } = await openCreate(page);
  await saveAccount(page, "Solo Account");
  await expectRecordRoute(page, org.slug);
});

test("Account Information and address groups follow the spec field order", async ({ page }) => {
  await openCreate(page);
  const accountInfo = page
    .getByRole("heading", { name: "Account Information", exact: true })
    .locator("xpath=ancestor::*[@data-record-form-section][1]");
  const leftOrder = await accountInfo
    .locator('[data-record-form-column="left"] [data-form-field]')
    .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-form-field")));
  expect(leftOrder).toEqual([...ACCOUNTS_FORM_INFORMATION_COLUMNS[0]]);
  const rightOrder = await accountInfo
    .locator('[data-record-form-column="right"] [data-form-field]')
    .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-form-field")));
  expect(rightOrder).toEqual([...ACCOUNTS_FORM_INFORMATION_COLUMNS[1]]);

  const billing = page.locator("[data-record-form-field-group]").first();
  const billingOrder = await billing
    .locator("[data-form-field]")
    .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-form-field")));
  expect(billingOrder).toEqual(BILLING_ADDRESS_ROW_ORDER);
  expect(await billing.locator('[data-form-field="Billing_Coordinates"]').count()).toBe(0);

  const shipping = page.locator("[data-record-form-field-group]").nth(1);
  const shippingOrder = await shipping
    .locator("[data-form-field]")
    .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-form-field")));
  expect(shippingOrder).toEqual(SHIPPING_ADDRESS_ROW_ORDER);
  expect(await shipping.locator('[data-form-field="Shipping_Coordinates"]').count()).toBe(0);
});

test("creates with every field type, a parent account and both addresses", async ({ page }) => {
  await openCreate(page);
  await page.getByRole("textbox", { name: "Account Name", exact: true }).fill("Full Form Account");
  await page.getByRole("textbox", { name: "Account Site", exact: true }).fill("Istanbul Site");
  await page.getByRole("textbox", { name: "Account Number", exact: true }).fill("123456");
  await page.getByRole("button", { name: "Account Type", exact: true }).click();
  await page.getByRole("textbox", { name: "Search", exact: true }).fill("Cust");
  await page.getByRole("option", { name: "Customer", exact: true }).click();
  await page.getByRole("button", { name: "Industry", exact: true }).click();
  await page.getByRole("option", { name: "Data/Telecom OEM", exact: true }).click();
  await page.getByRole("textbox", { name: "Annual Revenue", exact: true }).fill("250000");
  await expect(
    page.locator("[data-form-field=Annual_Revenue] .record-currency-prefix"),
  ).toBeVisible();
  await expect(
    page
      .locator("[data-form-field=Annual_Revenue]")
      .getByRole("img", { name: "Currency information" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Rating", exact: true }).click();
  await page.getByRole("option", { name: "Active", exact: true }).click();
  await page.getByRole("textbox", { name: "Phone", exact: true }).fill("555-0100");
  await page.getByRole("textbox", { name: "Fax", exact: true }).fill("555-0101");
  await page.getByRole("textbox", { name: "Website", exact: true }).fill("https://example.test");
  await page.getByRole("textbox", { name: "Ticker Symbol", exact: true }).fill("MPCT");
  await page.getByRole("button", { name: "Ownership", exact: true }).click();
  await page.getByRole("option", { name: "Private", exact: true }).click();
  await page.getByRole("textbox", { name: "Employees", exact: true }).fill("42");
  await page.getByRole("textbox", { name: "SIC Code", exact: true }).fill("7370");

  // AF-11: the Parent Account picker is the observed Choose Account dialog.
  await page.getByRole("button", { name: "Open Parent Account lookup", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("heading", { name: "Choose Account" })).toBeVisible();
  await expect(dialog.getByRole("textbox", { name: "Search by Account Name" })).toBeVisible();
  const parentRadio = dialog.getByRole("radio").first();
  await expect(parentRadio).toBeVisible();
  const parentName = await parentRadio.getAttribute("aria-label");
  if (!parentName) throw new Error("Missing account name in the picker");
  // AF-11.14: the selection circle is wrapped by its label, so the row carries the click.
  await dialog.getByRole("row", { name: parentName }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByRole("textbox", { name: "Parent Account", exact: true })).toHaveValue(
    parentName,
  );

  await page.locator("[data-form-field=Billing_Street] input").fill("Billing Street 1");
  await page.locator("[data-form-field=Billing_City] input").fill("Ankara");
  await page.getByRole("button", { name: "Copy Address", exact: true }).click();
  await page
    .getByRole("menuitem", { name: "Billing Address → Shipping Address", exact: true })
    .click();
  await expect(page.locator("[data-form-field=Shipping_Street] input")).toHaveValue(
    "Billing Street 1",
  );
  await page.locator("[data-form-field=Shipping_City] input").fill("Izmir");
  await page.getByRole("textbox", { name: "Description", exact: true }).fill("Created by e2e");

  const createRequest = page.waitForRequest(
    (request) => request.method() === "POST" && new URL(request.url()).pathname === CREATE_PATH,
  );
  await page.getByRole("button", { name: "Save", exact: true }).click();
  const request = await createRequest;
  const body = request.postDataJSON().data[0];
  expect(body.Account_Name).toBe("Full Form Account");
  expect(body.Account_Site).toBe("Istanbul Site");
  // A long integer travels as decimal text: the service rejects a JSON number for `bigint`.
  expect(body.Account_Number).toBe("123456");
  expect(body.Account_Type).toBe("Customer");
  expect(body.Industry).toBe("Data/Telecom OEM");
  expect(body.Annual_Revenue).toBe(250000);
  expect(body.Rating).toBe("Active");
  expect(body.Phone).toBe("555-0100");
  expect(body.Fax).toBe("555-0101");
  expect(body.Website).toBe("https://example.test");
  expect(body.Ticker_Symbol).toBe("MPCT");
  expect(body.Ownership).toBe("Private");
  expect(body.Employees).toBe(42);
  expect(body.SIC_Code).toBe(7370);
  expect(body.Parent_Account?.name).toBe(parentName);
  expect(body.Billing_Street).toBe("Billing Street 1");
  expect(body.Billing_City).toBe("Ankara");
  expect(body.Shipping_Street).toBe("Billing Street 1");
  expect(body.Shipping_City).toBe("Izmir");
  expect(body.Description).toBe("Created by e2e");
});

test("a long account number keeps its exact digits through save, detail, edit and clone", async ({
  page,
}) => {
  // Past Number.MAX_SAFE_INTEGER a JavaScript number would store different digits, and the service
  // only accepts decimal text for a long integer.
  const digits = "9007199254740993";
  const { org } = await openCreate(page);
  await page
    .getByRole("textbox", { name: "Account Name", exact: true })
    .fill("Long Number Account");
  await page.getByRole("textbox", { name: "Account Number", exact: true }).fill(digits);
  const createRequest = page.waitForRequest(
    (request) => request.method() === "POST" && new URL(request.url()).pathname === CREATE_PATH,
  );
  await page.getByRole("button", { name: "Save", exact: true }).click();
  expect((await createRequest).postDataJSON().data[0].Account_Number).toBe(digits);
  await expectRecordRoute(page, org.slug);
  await expect(page.locator('[data-detail-field="Account_Number"]')).toContainText(digits);
  const id = accountRecordIdFromPath(new URL(page.url()).pathname);

  await page.goto(moduleRecordEditPath(org.slug, ACCOUNTS_TAB, id));
  await expect(page.getByRole("heading", { name: "Edit Account" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Account Number", exact: true })).toHaveValue(
    digits,
  );
  // Saving another field leaves the untouched long integer out of the write, so it cannot be lost.
  await page.getByRole("textbox", { name: "Account Site", exact: true }).fill("Long Number Site");
  const updateRequest = page.waitForRequest(
    (request) =>
      request.method() === "PUT" && new URL(request.url()).pathname.startsWith(`${CREATE_PATH}/`),
  );
  await page.getByRole("button", { name: "Save", exact: true }).click();
  const edited = (await updateRequest).postDataJSON().data[0];
  expect("Account_Number" in edited).toBe(false);
  await expectRecordRoute(page, org.slug);
  await expect(page.locator('[data-detail-field="Account_Number"]')).toContainText(digits);

  await page.goto(moduleRecordClonePath(org.slug, ACCOUNTS_TAB, id));
  await expect(page.getByRole("heading", { name: "Clone Account" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Account Number", exact: true })).toHaveValue(
    digits,
  );
});

test("an account number that is not digits is rejected on Save", async ({ page }) => {
  await openCreate(page);
  await page.getByRole("textbox", { name: "Account Name", exact: true }).fill("Bad Number Account");
  await page.getByRole("textbox", { name: "Account Number", exact: true }).fill("12a");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByText("Please enter a valid Account Number.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Create Account" })).toBeVisible();
});

test("Save and New resets the create form", async ({ page }) => {
  const { org } = await openCreate(page);
  await page.getByRole("textbox", { name: "Account Name", exact: true }).fill("Save And New");
  await page.getByRole("button", { name: "Save and New", exact: true }).click();
  await expect(page).toHaveURL(moduleCreatePath(org.slug, ACCOUNTS_TAB));
  await expect(page.getByRole("textbox", { name: "Account Name", exact: true })).toHaveValue("");
});

test("Cancel returns to the list without saving", async ({ page }) => {
  const { list } = await openCreate(page);
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(page).toHaveURL(list);
  await page.goto(list);
  await expect(page.getByRole("link", { name: "Cancelled Account", exact: true })).toHaveCount(0);
});

test("edit keeps the create layout and preserves stored values", async ({ page }) => {
  const { org } = await openCreate(page);
  await saveAccount(page, "Edit Me");
  await expectRecordRoute(page, org.slug);
  const id = accountRecordIdFromPath(new URL(page.url()).pathname);
  await page.goto(moduleRecordEditPath(org.slug, ACCOUNTS_TAB, id));
  await expect(page.getByRole("heading", { name: "Edit Account" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Account Name", exact: true })).toHaveValue(
    "Edit Me",
  );
  await page.getByRole("textbox", { name: "Account Name", exact: true }).fill("Edited Account");
  await page.getByRole("textbox", { name: "Employees", exact: true }).fill("7");
  const updateRequest = page.waitForRequest(
    (request) =>
      request.method() === "PUT" && new URL(request.url()).pathname.startsWith(`${CREATE_PATH}/`),
  );
  await page.getByRole("button", { name: "Save", exact: true }).click();
  const request = await updateRequest;
  const body = request.postDataJSON().data[0];
  expect(body.Account_Name).toBe("Edited Account");
  expect(body.Employees).toBe(7);
  await expectRecordRoute(page, org.slug);
});

test("clone saves a new record from the source", async ({ page }) => {
  const { org } = await openCreate(page);
  await saveAccount(page, "Clone Source");
  await expectRecordRoute(page, org.slug);
  const sourceId = accountRecordIdFromPath(new URL(page.url()).pathname);
  await page.goto(moduleRecordClonePath(org.slug, ACCOUNTS_TAB, sourceId));
  await expect(page.getByRole("heading", { name: "Clone Account" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Account Name", exact: true })).toHaveValue(
    "Clone Source",
  );
  await page.getByRole("textbox", { name: "Account Name", exact: true }).fill("Clone Saved");
  const createRequest = page.waitForRequest(
    (request) => request.method() === "POST" && new URL(request.url()).pathname === CREATE_PATH,
  );
  await page.getByRole("button", { name: "Save", exact: true }).click();
  const request = await createRequest;
  expect(request.postDataJSON().data[0].Account_Name).toBe("Clone Saved");
  await expectRecordRoute(page, org.slug);
});

test("laterModule controls do not navigate or open dialogs", async ({ page }) => {
  await openCreate(page);
  const url = page.url();
  // AF-01 and AF-47 (M11), AF-05 (M6) and the footer pair (M11) stay inert.
  for (const name of ["Edit Page Layout", "Client Script", "Account Image", "Standard View"]) {
    await page.getByRole("button", { name, exact: true }).click({ force: true });
  }
  await expect(page).toHaveURL(url);
  await expect(page.getByRole("dialog")).toHaveCount(0);

  // AF-11.16: the picker handset belongs to Activities (M5).
  await page.getByRole("button", { name: "Open Parent Account lookup", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("heading", { name: "Choose Account" })).toBeVisible();
  const handset = dialog.getByRole("button", { name: "Phone" }).first();
  await expect(handset).toBeVisible();
  await handset.click({ force: true });
  await expect(dialog.getByRole("heading", { name: "Choose Account" })).toBeVisible();
  // AF-11.3, AF-11.4 and AF-11.13 were never exercised in the reference capture.
  for (const name of ["New Account", "Table columns", "Filter"]) {
    await dialog.getByRole("button", { name, exact: true }).click({ force: true });
  }
  await expect(dialog.getByRole("heading", { name: "Choose Account" })).toBeVisible();
  await expect(page).toHaveURL(url);
  await dialog.getByRole("button", { name: "Close", exact: true }).click();
  await expect(dialog).toBeHidden();
});

type Box = { x: number; y: number; width: number; height: number };

function requireBox(box: Box | null, label: string): Box {
  if (!box) throw new Error(`Missing ${label}`);
  return box;
}

test("title strip row and Account Image placeholder match the reference", async ({ page }) => {
  await openCreate(page);
  const strip = page.locator("[data-record-form-strip]");
  const title = requireBox(
    await strip.locator("[data-record-form-title]").boundingBox(),
    "Create Account title",
  );
  // AF-01: Edit Page Layout shares the title row, immediately right of the title.
  const layout = requireBox(
    await strip.getByRole("button", { name: "Edit Page Layout", exact: true }).boundingBox(),
    "Edit Page Layout",
  );
  expect(layout.x).toBeGreaterThan(title.x + title.width);
  expect(layout.y).toBeGreaterThanOrEqual(title.y);
  expect(layout.y + layout.height).toBeLessThanOrEqual(title.y + title.height + 1);
  expect(layout.x - (title.x + title.width)).toBeLessThanOrEqual(12);
  await expect(strip.getByRole("button", { name: "Save", exact: true })).toBeVisible();

  // AF-05: the building placeholder is the 48 px image below the section label; no disc, no overlap.
  const label = requireBox(
    await page
      .locator("[data-record-form-section-title]")
      .filter({ hasText: "Account Image" })
      .boundingBox(),
    "Account Image label",
  );
  const image = page.getByRole("button", { name: "Account Image", exact: true });
  const imageBox = requireBox(await image.boundingBox(), "Account Image placeholder");
  expect(Math.abs(imageBox.width - 48)).toBeLessThanOrEqual(1);
  expect(Math.abs(imageBox.height - 48)).toBeLessThanOrEqual(1);
  expect(imageBox.y).toBeGreaterThan(label.y + label.height);
  await expect(image).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  // The glyph stays inside the control instead of escaping over the label.
  const glyph = requireBox(await image.locator("svg").boundingBox(), "Account Image glyph");
  expect(glyph.x).toBeGreaterThanOrEqual(imageBox.x - 1);
  expect(glyph.y).toBeGreaterThanOrEqual(Math.max(imageBox.y, label.y + label.height));
  expect(glyph.x + glyph.width).toBeLessThanOrEqual(imageBox.x + imageBox.width + 1);
  expect(glyph.y + glyph.height).toBeLessThanOrEqual(imageBox.y + imageBox.height + 1);
  if (process.env.PAPERCLIP_RUN_SCRATCH_DIR) {
    await page.screenshot({
      path: `${process.env.PAPERCLIP_RUN_SCRATCH_DIR}/mep394-accounts-form.png`,
    });
  }
});
