import type { Page } from "@playwright/test";
import {
  DEALS_FORM_INFORMATION_COLUMNS,
  DEALS_FORM_REASON_FOR_LOSS,
} from "../src/modules/deals/deals-form-rules";
import { signUpNewUser } from "./support/auth";
import {
  moduleCreatePath,
  moduleListDefaultPath,
  moduleRecordClonePath,
  moduleRecordEditPath,
} from "./support/crm-paths";
import { createOrganization } from "./support/org";
import { expect, test } from "./support/test";

const DEALS_TAB = "Deals";
const CREATE_PATH = "/crm/v2.2/Deals";

/** The create form never paints the stage-conditional field, so its row stays out of the order. */
const CREATE_LEFT_COLUMN = [...DEALS_FORM_INFORMATION_COLUMNS[0]];
const CREATE_RIGHT_COLUMN = DEALS_FORM_INFORMATION_COLUMNS[1].filter(
  (name) => name !== DEALS_FORM_REASON_FOR_LOSS,
);

function dealRecordIdFromPath(pathname: string): string {
  const parts = pathname.split("/").filter(Boolean);
  const index = parts.indexOf(DEALS_TAB);
  const id = index >= 0 ? parts[index + 1] : undefined;
  if (!id || id === "list" || id === "create" || id === "custom-view") {
    throw new Error(`Expected a deal record id in ${pathname}`);
  }
  return id;
}

async function openCreate(page: Page) {
  await signUpNewUser(page);
  const org = await createOrganization(page);
  const list = moduleListDefaultPath(org.slug, DEALS_TAB);
  await page.goto(list);
  await page.getByRole("link", { name: "Create Deal", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Create Deal" })).toBeVisible();
  return { org, list };
}

async function fillRequired(page: Page, name: string) {
  await page.getByRole("textbox", { name: "Deal Name", exact: true }).fill(name);
  await page.getByRole("textbox", { name: "Closing Date", exact: true }).fill("30.11.2026");
  // The Account Name picker is the same Choose Account dialog the Accounts form uses.
  await page.getByRole("button", { name: "Open Account Name lookup", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("heading", { name: "Choose Account" })).toBeVisible();
  const accountName = await dialog.getByRole("radio").first().getAttribute("aria-label");
  if (!accountName) throw new Error("Missing account name in the picker");
  await dialog.getByRole("row", { name: accountName }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
}

async function saveDeal(page: Page, name: string) {
  await fillRequired(page, name);
  const createRequest = page.waitForRequest(
    (request) => request.method() === "POST" && new URL(request.url()).pathname === CREATE_PATH,
  );
  await page.getByRole("button", { name: "Save", exact: true }).click();
  return createRequest;
}

/**
 * The full Deals detail inventory belongs to a later task, so arrival after a save is proven by the
 * record route, by the create form being gone and by the record header carrying the saved name.
 */
async function expectRecordRoute(page: Page, orgSlug: string, name: string) {
  await expect(page).toHaveURL(new RegExp(`/crm/${orgSlug}/tab/Deals/\\d+$`), {
    timeout: 60_000,
  });
  await expect(page.getByRole("heading", { name: "Create Deal" })).toHaveCount(0);
  await expect(
    page.locator("[data-record-header]").getByRole("heading", { level: 1 }),
  ).toContainText(name);
}

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1470, height: 835 });
});

test("empty save reports every required field that can be left blank", async ({ page }) => {
  await openCreate(page);
  // All four fields carry the required mark (DF-07, DF-08, DF-18, DF-19).
  for (const apiName of ["Deal_Name", "Account_Name", "Closing_Date", "Stage"]) {
    await expect(
      page.locator(`[data-form-field=${apiName}] [data-required]`).first(),
    ).toBeVisible();
  }
  await page.getByRole("button", { name: "Save", exact: true }).click();
  // Stage opens on the first metadata stage, so an untouched create form cannot leave it blank.
  for (const label of ["Deal Name", "Account Name", "Closing Date"]) {
    await expect(page.getByText(`${label} cannot be empty.`)).toBeVisible();
  }
  await expect(page.getByText("Stage cannot be empty.")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Create Deal" })).toBeVisible();
});

test("Deal Information follows the seven-row two-column spec order", async ({ page }) => {
  await openCreate(page);
  const section = page
    .getByRole("heading", { name: "Deal Information", exact: true })
    .locator("xpath=ancestor::*[@data-record-form-section][1]");
  const left = await section
    .locator('[data-record-form-column="left"] [data-form-field]')
    .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-form-field")));
  const right = await section
    .locator('[data-record-form-column="right"] [data-form-field]')
    .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-form-field")));
  expect(left).toEqual(CREATE_LEFT_COLUMN);
  expect(right).toEqual(CREATE_RIGHT_COLUMN);
});

test("create starts on the first stage with its metadata probability", async ({ page }) => {
  await openCreate(page);
  await expect(page.getByRole("button", { name: "Stage", exact: true })).toContainText(
    "Qualification",
  );
  await expect(page.getByRole("textbox", { name: "Probability (%)", exact: true })).toHaveValue(
    "10",
  );
  // Expected Revenue is a service-produced value: painted empty and read-only on create.
  const expected = page.getByRole("textbox", { name: "Expected Revenue", exact: true });
  await expect(expected).toHaveValue("");
  await expect(expected).toHaveAttribute("aria-readonly", "true");
  await expect(
    page.locator("[data-form-field=Expected_Revenue] .record-currency-prefix"),
  ).toBeVisible();
  await expect(
    page.locator("[data-form-field=Expected_Revenue]").getByRole("img", { name: "Locked" }),
  ).toBeVisible();
});

test("changing the stage fills probability, and a manual value then survives", async ({ page }) => {
  await openCreate(page);
  const probability = page.getByRole("textbox", { name: "Probability (%)", exact: true });
  await page.getByRole("button", { name: "Stage", exact: true }).click();
  await page.getByRole("option", { name: "Proposal/Price Quote", exact: true }).click();
  await expect(probability).toHaveValue("75");

  await page.getByRole("button", { name: "Stage", exact: true }).click();
  await page.getByRole("option", { name: "Closed Won", exact: true }).click();
  await expect(probability).toHaveValue("100");

  await probability.fill("80");
  await expect(probability).toHaveValue("80");
  await page.getByRole("textbox", { name: "Next Step", exact: true }).fill("Keeps 80");
  await expect(probability).toHaveValue("80");
});

test("creates with required fields only and arrives at the record route", async ({ page }) => {
  const { org } = await openCreate(page);
  await saveDeal(page, "Minimal Deal");
  await expectRecordRoute(page, org.slug, "Minimal Deal");
});

test("creates with every field type through the Account and Contact pickers", async ({ page }) => {
  await openCreate(page);
  await page.getByRole("textbox", { name: "Deal Name", exact: true }).fill("Full Form Deal");
  await page.getByRole("textbox", { name: "Amount", exact: true }).fill("250000");
  await expect(page.locator("[data-form-field=Amount] .record-currency-prefix")).toBeVisible();
  await expect(
    page.locator("[data-form-field=Amount]").getByRole("img", { name: "Currency information" }),
  ).toBeVisible();
  await page.getByRole("textbox", { name: "Closing Date", exact: true }).fill("15.12.2026");
  await page.getByRole("button", { name: "Stage", exact: true }).click();
  await page.getByRole("option", { name: "Needs Analysis", exact: true }).click();
  await page.getByRole("button", { name: "Type", exact: true }).click();
  await page.getByRole("option", { name: "New Business", exact: true }).click();
  await page.getByRole("button", { name: "Lead Source", exact: true }).click();
  await page.getByRole("option", { name: "Cold Call", exact: true }).click();
  await page.getByRole("textbox", { name: "Next Step", exact: true }).fill("Send proposal");
  await page.getByRole("textbox", { name: "Probability (%)", exact: true }).fill("25");

  // DF-05/DF-06: Deal Owner starts on the session owner and its icon opens the Select User dialog.
  const owner = page.locator("[data-form-field=Owner] .record-choice-trigger");
  await expect(owner).toContainText("Test User");
  await page.getByRole("button", { name: "Open owner picker", exact: true }).click();
  const ownerDialog = page.getByRole("dialog", { name: "Select User", exact: true });
  await expect(ownerDialog).toBeVisible();
  await expect(ownerDialog.getByRole("radio", { name: "Test User", exact: true })).toBeVisible();
  await ownerDialog.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(owner).toContainText("Test User");

  await page.getByRole("button", { name: "Open Account Name lookup", exact: true }).click();
  const accountDialog = page.getByRole("dialog");
  await expect(accountDialog.getByRole("heading", { name: "Choose Account" })).toBeVisible();
  await expect(
    accountDialog.getByRole("textbox", { name: "Search by Account Name" }),
  ).toBeVisible();
  const accountName = await accountDialog.getByRole("radio").first().getAttribute("aria-label");
  if (!accountName) throw new Error("Missing account name in the picker");
  await accountDialog.getByRole("row", { name: accountName }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);

  // DF-13/DF-14: the Contact picker is the same shape, named after the Contact Name column.
  await page.getByRole("button", { name: "Open Contact Name lookup", exact: true }).click();
  const contactDialog = page.getByRole("dialog");
  await expect(contactDialog.getByRole("heading", { name: "Choose Contact" })).toBeVisible();
  await expect(
    contactDialog.getByRole("textbox", { name: "Search by Contact Name" }),
  ).toBeVisible();
  const contactName = await contactDialog.getByRole("radio").first().getAttribute("aria-label");
  if (!contactName) throw new Error("Missing contact name in the picker");
  await contactDialog.getByRole("row", { name: contactName }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);

  const description = page.getByRole("textbox", { name: "Description", exact: true });
  // DF-25/DF-29: the only multiline editor, with its native lower-right resize grip.
  await expect(description).toHaveCSS("resize", "both");
  await description.fill("Created by e2e");

  const createRequest = page.waitForRequest(
    (request) => request.method() === "POST" && new URL(request.url()).pathname === CREATE_PATH,
  );
  await page.getByRole("button", { name: "Save", exact: true }).click();
  const body = (await createRequest).postDataJSON().data[0];
  expect(body.Deal_Name).toBe("Full Form Deal");
  expect(body.Amount).toBe(250000);
  expect(body.Closing_Date).toBe("2026-12-15");
  expect(body.Stage).toBe("Needs Analysis");
  expect(body.Probability).toBe(25);
  expect(body.Type).toBe("New Business");
  expect(body.Lead_Source).toBe("Cold Call");
  expect(body.Next_Step).toBe("Send proposal");
  expect(body.Account_Name?.name).toBe(accountName);
  expect(body.Contact_Name?.name).toBe(contactName);
  expect(body.Description).toBe("Created by e2e");
});

test("Save and New resets the create form", async ({ page }) => {
  const { org } = await openCreate(page);
  await fillRequired(page, "Save And New");
  await page.getByRole("button", { name: "Save and New", exact: true }).click();
  await expect(page).toHaveURL(moduleCreatePath(org.slug, DEALS_TAB));
  await expect(page.getByRole("textbox", { name: "Deal Name", exact: true })).toHaveValue("");
  await expect(page.getByRole("textbox", { name: "Probability (%)", exact: true })).toHaveValue(
    "10",
  );
});

test("Cancel returns to the list without saving", async ({ page }) => {
  const { org, list } = await openCreate(page);
  await fillRequired(page, "Cancelled Deal");
  // The form is dirty, so Cancel asks before leaving, exactly as on the Accounts form.
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  const confirm = page.getByRole("alertdialog", { name: "You have not saved your changes." });
  await expect(confirm).toBeVisible();
  await page.getByRole("button", { name: "Yes, Leave Page", exact: true }).click();
  await expect(page).toHaveURL(list);
  await page.goto(moduleListDefaultPath(org.slug, DEALS_TAB));
  await expect(page.getByRole("link", { name: "Cancelled Deal", exact: true })).toHaveCount(0);
});

test("edit keeps the create layout and preserves stored values", async ({ page }) => {
  const { org } = await openCreate(page);
  await saveDeal(page, "Edit Me");
  await expectRecordRoute(page, org.slug, "Edit Me");
  const id = dealRecordIdFromPath(new URL(page.url()).pathname);

  await page.goto(moduleRecordEditPath(org.slug, DEALS_TAB, id));
  await expect(page.getByRole("heading", { name: "Edit Deal" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Deal Name", exact: true })).toHaveValue(
    "Edit Me",
  );
  await expect(page.getByRole("textbox", { name: "Closing Date", exact: true })).toHaveValue(
    "30.11.2026",
  );
  // Reason For Loss stays out of the form while the stage is an open one.
  await expect(page.getByRole("button", { name: "Reason For Loss", exact: true })).toHaveCount(0);

  await page.getByRole("textbox", { name: "Deal Name", exact: true }).fill("Edited Deal");
  await page.getByRole("textbox", { name: "Next Step", exact: true }).fill("Edited step");
  const updateRequest = page.waitForRequest(
    (request) =>
      request.method() === "PUT" && new URL(request.url()).pathname.startsWith(`${CREATE_PATH}/`),
  );
  await page.getByRole("button", { name: "Save", exact: true }).click();
  const body = (await updateRequest).postDataJSON().data[0];
  expect(body.Deal_Name).toBe("Edited Deal");
  expect(body.Next_Step).toBe("Edited step");
  await expectRecordRoute(page, org.slug, "Edited Deal");
});

test("an edit on a lost stage paints Reason For Loss under Stage", async ({ page }) => {
  const { org } = await openCreate(page);
  await fillRequired(page, "Lost Deal");
  await page.getByRole("button", { name: "Stage", exact: true }).click();
  await page.getByRole("option", { name: "Closed Lost", exact: true }).click();
  await saveWithoutRequiredNoise(page);
  await expectRecordRoute(page, org.slug, "Lost Deal");
  const id = dealRecordIdFromPath(new URL(page.url()).pathname);

  await page.goto(moduleRecordEditPath(org.slug, DEALS_TAB, id));
  await expect(page.getByRole("heading", { name: "Edit Deal" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Reason For Loss", exact: true })).toBeVisible();
  const rightOrder = await page
    .getByRole("heading", { name: "Deal Information", exact: true })
    .locator("xpath=ancestor::*[@data-record-form-section][1]")
    .locator('[data-record-form-column="right"] [data-form-field]')
    .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-form-field")));
  expect(rightOrder).toEqual([...DEALS_FORM_INFORMATION_COLUMNS[1]]);
});

/** Saves a form whose required fields are already filled, without waiting for a route. */
async function saveWithoutRequiredNoise(page: Page) {
  const createRequest = page.waitForRequest(
    (request) => request.method() === "POST" && new URL(request.url()).pathname === CREATE_PATH,
  );
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await createRequest;
}

test("clone copies the source record into a new deal", async ({ page }) => {
  const { org } = await openCreate(page);
  await saveDeal(page, "Clone Source");
  await expectRecordRoute(page, org.slug, "Clone Source");
  const sourceId = dealRecordIdFromPath(new URL(page.url()).pathname);

  await page.goto(moduleRecordClonePath(org.slug, DEALS_TAB, sourceId));
  await expect(page.getByRole("heading", { name: "Clone Deal" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Deal Name", exact: true })).toHaveValue(
    "Clone Source",
  );
  await page.getByRole("textbox", { name: "Deal Name", exact: true }).fill("Clone Saved");
  const createRequest = page.waitForRequest(
    (request) => request.method() === "POST" && new URL(request.url()).pathname === CREATE_PATH,
  );
  await page.getByRole("button", { name: "Save", exact: true }).click();
  expect((await createRequest).postDataJSON().data[0].Deal_Name).toBe("Clone Saved");
  await expectRecordRoute(page, org.slug, "Clone Saved");
});

test("the create route opens with pre-filled stage and account", async ({ page }) => {
  await signUpNewUser(page);
  const org = await createOrganization(page);
  const accountId = await firstAccountId(page, org.slug);
  await page.goto(
    `${moduleCreatePath(org.slug, DEALS_TAB)}?Stage=Needs%20Analysis&Account_Name=${accountId}`,
  );
  await expect(page.getByRole("heading", { name: "Create Deal" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Stage", exact: true })).toContainText(
    "Needs Analysis",
  );
  // The probability follows the prefilled stage instead of the create default.
  await expect(page.getByRole("textbox", { name: "Probability (%)", exact: true })).toHaveValue(
    "20",
  );
  const accountInput = page.getByRole("textbox", { name: "Account Name", exact: true });
  await expect(accountInput).not.toHaveValue("");
});

/** Reads a seeded account id off its own record link on the Accounts list. */
async function firstAccountId(page: Page, orgSlug: string): Promise<string> {
  await page.goto(moduleListDefaultPath(orgSlug, "Accounts"));
  const href = await page
    .locator("table tbody tr")
    .first()
    .getByRole("link")
    .first()
    .getAttribute("href");
  const id = href?.split("/").pop();
  if (!id) throw new Error("No seeded account to prefill");
  return id;
}

test("laterModule controls do not navigate or open dialogs", async ({ page }) => {
  await openCreate(page);
  const url = page.url();
  // DF-01, DF-26, DF-27 and DF-28 (M11) stay inert in place.
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

  // DF-23/DF-24: Campaign Source belongs to Campaigns (M7); entry and handset are marked inert.
  const entry = page.getByRole("textbox", { name: "Campaign Source", exact: true });
  await expect(entry).toHaveAttribute("data-later-module", "M7");
  await expect(entry).toHaveAttribute("aria-disabled", "true");
  await entry.click({ force: true });
  const handset = page.getByRole("button", { name: "Open Campaign Source lookup", exact: true });
  await expect(handset).toHaveAttribute("data-later-module", "M7");
  await handset.click({ force: true });
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page).toHaveURL(url);
});
