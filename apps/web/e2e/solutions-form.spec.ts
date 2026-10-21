import type { Page } from "@playwright/test";
import { SOLUTIONS_FORM_INFORMATION_COLUMNS } from "../src/modules/solutions/solutions-form-rules";
import { signUpNewUser } from "./support/auth";
import { moduleCreatePath, moduleListDefaultPath, moduleRecordEditPath } from "./support/crm-paths";
import { createOrganization } from "./support/org";
import { expect, test } from "./support/test";

const SOLUTIONS_TAB = "Solutions";
const CREATE_PATH = "/crm/v2.2/Solutions";

function solutionRecordIdFromPath(pathname: string): string {
  const parts = pathname.split("/").filter(Boolean);
  const index = parts.indexOf("Solutions");
  const id = index >= 0 ? parts[index + 1] : undefined;
  if (!id || id === "list" || id === "create" || id === "custom-view") {
    throw new Error(`Expected a solution record id in ${pathname}`);
  }
  return id;
}

async function openCreate(page: Page) {
  await signUpNewUser(page);
  const org = await createOrganization(page);
  const list = moduleListDefaultPath(org.slug, SOLUTIONS_TAB);
  await page.goto(list);
  await page.getByRole("link", { name: "Create Solution", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Create Solution" })).toBeVisible();
  return { org, list };
}

async function expectRecordRoute(page: Page, orgSlug: string) {
  await expect(page).toHaveURL(new RegExp(`/crm/${orgSlug}/tab/Solutions/[^/?]+$`), {
    timeout: 60_000,
  });
  await expect(page.getByRole("heading", { name: "Create Solution" })).toHaveCount(0);
}

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1470, height: 835 });
});

test("empty save shows Solution Title validation and keeps create form", async ({ page }) => {
  await openCreate(page);
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByText("Solution Title cannot be empty.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Create Solution" })).toBeVisible();
});

test("Solution Information and Description Information follow spec field order and omit excluded fields", async ({
  page,
}) => {
  await openCreate(page);
  const solutionInfo = page
    .getByRole("heading", { name: "Solution Information", exact: true })
    .locator("xpath=ancestor::*[@data-record-form-section][1]");
  const leftOrder = await solutionInfo
    .locator('[data-record-form-column="left"] [data-form-field]')
    .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-form-field")));
  expect(leftOrder).toEqual([...SOLUTIONS_FORM_INFORMATION_COLUMNS[0]]);
  const rightOrder = await solutionInfo
    .locator('[data-record-form-column="right"] [data-form-field]')
    .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-form-field")));
  expect(rightOrder).toEqual([...SOLUTIONS_FORM_INFORMATION_COLUMNS[1]]);

  // Description Information section has Question and Answer multiline inputs
  const descInfo = page
    .getByRole("heading", { name: "Description Information", exact: true })
    .locator("xpath=ancestor::*[@data-record-form-section][1]");
  await expect(descInfo.locator('[data-form-field="Question"] textarea')).toBeVisible();
  await expect(descInfo.locator('[data-form-field="Answer"] textarea')).toBeVisible();

  // Excluded fields are omitted from the form
  const omittedFields = [
    "Published",
    "Add_Comment",
    "Comments",
    "No_of_comments",
    "Tag",
    "Connected_To__s",
    "Created_By",
    "Modified_By",
    "Created_Time",
    "Modified_Time",
    "Last_Activity_Time",
  ];
  for (const fieldName of omittedFields) {
    expect(await page.locator(`[data-form-field="${fieldName}"]`).count()).toBe(0);
  }
});

test("required markers, locked Solution Number, owner focus, Status picklist, and Product Name laterModule", async ({
  page,
}) => {
  await openCreate(page);

  // SF-05 & SF-06: Solution Number is locked and empty on create, with lock icon
  const solutionNumberField = page.locator('[data-form-field="Solution_Number"]');
  await expect(solutionNumberField).toBeVisible();
  const solutionNumberInput = solutionNumberField.locator("input");
  await expect(solutionNumberInput).toBeDisabled();
  await expect(solutionNumberInput).toHaveValue("");
  await expect(solutionNumberField.getByRole("img", { name: "Locked" })).toBeVisible();

  // SF-07, SF-13, SF-14: Solution Title, Question, and Answer carry required markers
  await expect(
    page.locator('[data-form-field="Solution_Title"] [data-required]').first(),
  ).toBeVisible();
  await expect(page.locator('[data-form-field="Question"] [data-required]').first()).toBeVisible();
  await expect(page.locator('[data-form-field="Answer"] [data-required]').first()).toBeVisible();

  // SF-09 & SF-10: Solution Owner is prefilled and focused on create load
  const ownerField = page.locator('[data-form-field="Owner"]');
  await expect(ownerField).toBeVisible();
  await expect(ownerField.getByRole("button", { name: "Open owner picker" })).toBeVisible();

  // SF-08 & SF-08.1 – SF-08.3: Status picklist defaults to Draft; no search input; 3 options + None
  const statusField = page.locator('[data-form-field="Status"]');
  const statusButton = statusField.getByRole("button", { name: "Status", exact: true });
  await expect(statusButton).toHaveText("Draft");
  await statusButton.click();
  await expect(page.getByRole("textbox", { name: "Search", exact: true })).toHaveCount(0);
  const statusOptions = await page
    .getByRole("option")
    .evaluateAll((nodes) => nodes.map((node) => node.textContent?.trim()));
  expect(statusOptions).toEqual(["-None-", "Draft", "Reviewed", "Duplicate"]);
  await page.keyboard.press("Escape");

  // SF-11 & SF-12: Product Name is P2 laterModule and its button blocks dialogs
  const productField = page.locator('[data-form-field="Product_Name"]');
  await expect(productField).toBeVisible();
  const productInput = productField.locator("input");
  expect(productInput).toBeDisabled();
  expect(await productInput.getAttribute("data-later-module")).toBe("P2");
  const productLookupBtn = productField.getByRole("button", { name: /Open Product Name lookup/i });
  expect(await productLookupBtn.getAttribute("data-later-module")).toBe("P2");
  await productLookupBtn.click({ force: true });
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("creates with all fields and arrives at the record route", async ({ page }) => {
  const { org } = await openCreate(page);

  await page
    .getByRole("textbox", { name: "Solution Title", exact: true })
    .fill("Resolving High DB Latency");

  // Status selection
  await page.locator('[data-form-field="Status"]').getByRole("button", { name: "Status" }).click();
  await page.getByRole("option", { name: "Reviewed", exact: true }).click();

  // Question & Answer
  await page
    .getByRole("textbox", { name: "Question", exact: true })
    .fill("Why is the database experiencing connection spikes?");
  await page
    .getByRole("textbox", { name: "Answer", exact: true })
    .fill("Check idle pool connections and add connection limits.");

  const createRequest = page.waitForRequest(
    (request) => request.method() === "POST" && new URL(request.url()).pathname === CREATE_PATH,
  );
  await page.getByRole("button", { name: "Save", exact: true }).click();
  const request = await createRequest;
  const body = request.postDataJSON().data[0];

  expect(body.Solution_Title).toBe("Resolving High DB Latency");
  expect(body.Status).toBe("Reviewed");
  expect(body.Question).toBe("Why is the database experiencing connection spikes?");
  expect(body.Answer).toBe("Check idle pool connections and add connection limits.");
  // Solution_Number is not submitted in the write payload
  expect(body.Solution_Number).toBeUndefined();

  await expectRecordRoute(page, org.slug);
});

test("Save and New resets the create form", async ({ page }) => {
  const { org } = await openCreate(page);
  await page
    .getByRole("textbox", { name: "Solution Title", exact: true })
    .fill("Solution Save And New");
  await page.locator('[data-form-field="Status"]').getByRole("button", { name: "Status" }).click();
  await page.getByRole("option", { name: "Reviewed", exact: true }).click();
  await page.getByRole("textbox", { name: "Question", exact: true }).fill("Q text");
  await page.getByRole("textbox", { name: "Answer", exact: true }).fill("A text");

  await page.getByRole("button", { name: "Save and New", exact: true }).click();
  await expect(page).toHaveURL(moduleCreatePath(org.slug, SOLUTIONS_TAB));
  await expect(page.getByRole("textbox", { name: "Solution Title", exact: true })).toHaveValue("");
  await expect(
    page.locator('[data-form-field="Status"]').getByRole("button", { name: "Status" }),
  ).toHaveText("Draft");
});

test("Cancel returns to the list without saving", async ({ page }) => {
  const { list } = await openCreate(page);
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(page).toHaveURL(list);
});

test("edit loads saved record values and updates on Save (Solution_Number visible and locked)", async ({
  page,
}) => {
  const { org } = await openCreate(page);
  await page
    .getByRole("textbox", { name: "Solution Title", exact: true })
    .fill("Initial Solution Title");
  await page.getByRole("textbox", { name: "Question", exact: true }).fill("Initial Question");
  await page.getByRole("textbox", { name: "Answer", exact: true }).fill("Initial Answer");

  const createRequest = page.waitForRequest(
    (request) => request.method() === "POST" && new URL(request.url()).pathname === CREATE_PATH,
  );
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await createRequest;
  await expectRecordRoute(page, org.slug);
  const id = solutionRecordIdFromPath(new URL(page.url()).pathname);

  // Navigate to edit route
  await page.goto(moduleRecordEditPath(org.slug, SOLUTIONS_TAB, id));
  await expect(page.getByRole("heading", { name: "Edit Solution" })).toBeVisible();

  // SF-05 & SF-06: Solution Number is visible, locked, and carries the assigned number
  const solutionNumberField = page.locator('[data-form-field="Solution_Number"]');
  await expect(solutionNumberField).toBeVisible();
  const solutionNumberInput = solutionNumberField.locator("input");
  await expect(solutionNumberInput).toBeDisabled();
  const assignedNumber = await solutionNumberInput.inputValue();
  expect(assignedNumber.length).toBeGreaterThan(0);
  await expect(solutionNumberField.getByRole("img", { name: "Locked" })).toBeVisible();

  // Existing values populated
  await expect(page.getByRole("textbox", { name: "Solution Title", exact: true })).toHaveValue(
    "Initial Solution Title",
  );
  await expect(page.getByRole("textbox", { name: "Question", exact: true })).toHaveValue(
    "Initial Question",
  );
  await expect(page.getByRole("textbox", { name: "Answer", exact: true })).toHaveValue(
    "Initial Answer",
  );

  // Modify fields
  await page
    .getByRole("textbox", { name: "Solution Title", exact: true })
    .fill("Updated Solution Title");
  await page.locator('[data-form-field="Status"]').getByRole("button", { name: "Status" }).click();
  await page.getByRole("option", { name: "Duplicate", exact: true }).click();

  const updateRequest = page.waitForRequest(
    (request) =>
      request.method() === "PUT" && new URL(request.url()).pathname.startsWith(`${CREATE_PATH}/`),
  );
  await page.getByRole("button", { name: "Save", exact: true }).click();
  const request = await updateRequest;
  const edited = request.postDataJSON().data[0];
  expect(edited.Solution_Title).toBe("Updated Solution Title");
  expect(edited.Status).toBe("Duplicate");
  // Solution_Number is locked and omitted from PUT payload
  expect(edited.Solution_Number).toBeUndefined();
  await expectRecordRoute(page, org.slug);
});

test("laterModule controls do not navigate or open dialogs (SF-01, SF-17, SF-18, SF-19)", async ({
  page,
}) => {
  await openCreate(page);
  const url = page.url();

  // SF-01 Edit Page Layout (M11)
  await page.getByRole("button", { name: "Edit Page Layout", exact: true }).click({ force: true });
  await expect(page).toHaveURL(url);
  await expect(page.getByRole("dialog")).toHaveCount(0);

  // SF-19 Client Script (M11)
  await page.getByRole("button", { name: "Client Script", exact: true }).click({ force: true });
  await expect(page).toHaveURL(url);
  await expect(page.getByRole("dialog")).toHaveCount(0);

  // SF-17 / SF-18 Footer controls (M11)
  const footer = page.locator("[data-record-form-inventory-footer]");
  await footer.scrollIntoViewIfNeeded();
  await expect(footer).toBeVisible();
  await expect(footer.getByText("Create Form Views :")).toBeVisible();
  const standard = footer.getByRole("button", { name: "Standard View", exact: true });
  const custom = footer.getByRole("button", { name: "Create a custom form page", exact: true });
  await standard.click({ force: true });
  await custom.click({ force: true });
  await expect(page).toHaveURL(url);
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("create form layout matches the measured reference geometry at 1470×835", async ({ page }) => {
  await page.setViewportSize({ width: 1470, height: 835 });
  await openCreate(page);
  const card = page.locator(".record-form-card").first();
  const cardBox = await card.boundingBox();
  const footer = page.locator("[data-record-form-inventory-footer]");
  const footerBox = await footer.boundingBox();
  if (!cardBox || !footerBox) throw new Error("Missing form card or footer geometry");

  // Card reaches the page bottom without scrolling (reference: 1126 wide, 712 tall).
  expect(cardBox.width).toBeGreaterThan(1100);
  expect(cardBox.width).toBeLessThan(1150);
  expect(cardBox.height).toBeGreaterThan(690);
  expect(cardBox.y + cardBox.height).toBeGreaterThan(780);

  // Footer sits at the card base, right-aligned, inside the first viewport.
  expect(footerBox.y + footerBox.height).toBeLessThanOrEqual(835);
  expect(footerBox.y).toBeGreaterThan(740);
  expect(footerBox.x + footerBox.width).toBeGreaterThan(cardBox.x + cardBox.width - 60);

  // Question / Answer: 34 px fields on a ~54 px row pitch.
  const q = await page.getByLabel("Question", { exact: true }).boundingBox();
  const a = await page.getByLabel("Answer", { exact: true }).boundingBox();
  if (!q || !a) throw new Error("Missing Question/Answer geometry");
  expect(Math.abs(q.height - 34)).toBeLessThanOrEqual(2);
  expect(Math.abs(a.height - 34)).toBeLessThanOrEqual(2);
  expect(Math.abs(a.y - q.y - 54)).toBeLessThanOrEqual(3);
});
