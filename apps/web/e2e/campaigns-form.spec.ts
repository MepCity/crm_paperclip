import type { Page } from "@playwright/test";
import { CAMPAIGNS_FORM_INFORMATION_COLUMNS } from "../src/modules/campaigns/campaigns-form-rules";
import { signUpNewUser } from "./support/auth";
import { moduleCreatePath, moduleListDefaultPath, moduleRecordEditPath } from "./support/crm-paths";
import { createOrganization } from "./support/org";
import { expect, test } from "./support/test";

const CAMPAIGNS_TAB = "Campaigns";
const CREATE_PATH = "/crm/v2.2/Campaigns";

function campaignRecordIdFromPath(pathname: string): string {
  const parts = pathname.split("/").filter(Boolean);
  const index = parts.indexOf("Campaigns");
  const id = index >= 0 ? parts[index + 1] : undefined;
  if (!id || id === "list" || id === "create" || id === "custom-view") {
    throw new Error(`Expected a campaign record id in ${pathname}`);
  }
  return id;
}

async function openCreate(page: Page) {
  await signUpNewUser(page);
  const org = await createOrganization(page);
  const list = moduleListDefaultPath(org.slug, CAMPAIGNS_TAB);
  await page.goto(list);
  await page.getByRole("link", { name: "Create Campaign", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Create Campaign" })).toBeVisible();
  return { org, list };
}

async function expectRecordRoute(page: Page, orgSlug: string) {
  await expect(page).toHaveURL(new RegExp(`/crm/${orgSlug}/tab/Campaigns/[^/?]+$`), {
    timeout: 60_000,
  });
  await expect(page.getByRole("heading", { name: "Create Campaign" })).toHaveCount(0);
}

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1470, height: 835 });
});

test("empty save shows Campaign Name validation and keeps create form", async ({ page }) => {
  await openCreate(page);
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByText("Campaign Name cannot be empty.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Create Campaign" })).toBeVisible();
});

test("Campaign Information and Description Information follow spec field order and omit Parent Campaign", async ({
  page,
}) => {
  await openCreate(page);
  const campaignInfo = page
    .getByRole("heading", { name: "Campaign Information", exact: true })
    .locator("xpath=ancestor::*[@data-record-form-section][1]");
  const leftOrder = await campaignInfo
    .locator('[data-record-form-column="left"] [data-form-field]')
    .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-form-field")));
  expect(leftOrder).toEqual([...CAMPAIGNS_FORM_INFORMATION_COLUMNS[0]]);
  const rightOrder = await campaignInfo
    .locator('[data-record-form-column="right"] [data-form-field]')
    .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-form-field")));
  expect(rightOrder).toEqual([...CAMPAIGNS_FORM_INFORMATION_COLUMNS[1]]);

  // Parent Campaign is omitted from the rendered form
  expect(await page.locator('[data-form-field="Parent_Campaign"]').count()).toBe(0);

  // Description Information section has Description multiline input
  const descInfo = page
    .getByRole("heading", { name: "Description Information", exact: true })
    .locator("xpath=ancestor::*[@data-record-form-section][1]");
  await expect(descInfo.locator('[data-form-field="Description"] textarea')).toBeVisible();
});

test("required markers, owner focus, Type and Status picklist inventories", async ({ page }) => {
  await openCreate(page);

  // CF-05 / CF-06: Owner is prefilled and focused on load
  const ownerField = page.locator('[data-form-field="Owner"]');
  await expect(ownerField).toBeVisible();
  await expect(ownerField.getByRole("button", { name: "Open owner picker" })).toBeVisible();

  // CF-07 & CF-14: Campaign Name and Type carry required markers
  await expect(
    page.locator('[data-form-field="Campaign_Name"] [data-required]').first(),
  ).toBeVisible();
  await expect(page.locator('[data-form-field="Type"] [data-required]').first()).toBeVisible();

  // Currency fields have TL prefix and information icon (CF-09/09.1/10, CF-11/11.1/12, CF-17/17.1/18)
  for (const fieldName of ["Expected_Revenue", "Actual_Cost", "Budgeted_Cost"]) {
    const field = page.locator(`[data-form-field="${fieldName}"]`);
    await expect(field.locator(".record-currency-prefix")).toHaveText("TL");
    await expect(field.getByRole("img", { name: "Currency information" })).toBeVisible();
  }

  // Type picklist (CF-14 / CF-14.1 – CF-14.8): search input and options in metadata order
  const typeField = page.locator('[data-form-field="Type"]');
  await typeField.getByRole("button", { name: "Type", exact: true }).click();
  const searchInput = page.getByRole("textbox", { name: "Search", exact: true });
  await expect(searchInput).toBeVisible();
  await expect(searchInput).toBeFocused();
  const typeOptions = await page
    .getByRole("option")
    .evaluateAll((nodes) => nodes.map((node) => node.textContent?.trim()));
  expect(typeOptions).toEqual([
    "-None-",
    "Conference",
    "Webinar",
    "Trade Show",
    "Public Relations",
    "Partners",
    "Referral Program",
    "Advertisement",
    "Banner Ads",
    "Direct mail",
    "Email",
    "Telemarketing",
    "Others",
  ]);
  await page.keyboard.press("Escape");

  // Status picklist (CF-15 / CF-15.1 – CF-15.5): five options and no search input
  const statusField = page.locator('[data-form-field="Status"]');
  await statusField.getByRole("button", { name: "Status", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "Search", exact: true })).toHaveCount(0);
  const statusOptions = await page
    .getByRole("option")
    .evaluateAll((nodes) => nodes.map((node) => node.textContent?.trim()));
  expect(statusOptions).toEqual(["-None-", "Planning", "Active", "Inactive", "Complete"]);
  await page.keyboard.press("Escape");
});

test("creates with all fields and arrives at the record route", async ({ page }) => {
  const { org } = await openCreate(page);

  await page.getByRole("textbox", { name: "Campaign Name", exact: true }).fill("Q4 Global Launch");

  // Type selection
  await page.locator('[data-form-field="Type"]').getByRole("button", { name: "Type" }).click();
  await page.getByRole("option", { name: "Conference", exact: true }).click();

  // Status selection
  await page.locator('[data-form-field="Status"]').getByRole("button", { name: "Status" }).click();
  await page.getByRole("option", { name: "Planning", exact: true }).click();

  // Dates
  await page.getByRole("textbox", { name: "Start Date", exact: true }).fill("15.11.2026");
  await page.getByRole("textbox", { name: "End Date", exact: true }).fill("20.11.2026");

  // Currency fields
  await page.getByRole("textbox", { name: "Expected Revenue", exact: true }).fill("150000");
  await page.getByRole("textbox", { name: "Budgeted Cost", exact: true }).fill("40000");
  await page.getByRole("textbox", { name: "Actual Cost", exact: true }).fill("35000");

  // Bigint fields
  await page.getByRole("textbox", { name: "Expected Response", exact: true }).fill("1200");
  await page.getByRole("textbox", { name: "Numbers sent", exact: true }).fill("50000");

  // Description
  await page
    .getByRole("textbox", { name: "Description", exact: true })
    .fill("End-to-end e2e test campaign");

  const createRequest = page.waitForRequest(
    (request) => request.method() === "POST" && new URL(request.url()).pathname === CREATE_PATH,
  );
  await page.getByRole("button", { name: "Save", exact: true }).click();
  const request = await createRequest;
  const body = request.postDataJSON().data[0];

  expect(body.Campaign_Name).toBe("Q4 Global Launch");
  expect(body.Type).toBe("Conference");
  expect(body.Status).toBe("Planning");
  expect(body.Start_Date).toBe("2026-11-15");
  expect(body.End_Date).toBe("2026-11-20");
  expect(body.Expected_Revenue).toBe(150000);
  expect(body.Budgeted_Cost).toBe(40000);
  expect(body.Actual_Cost).toBe(35000);
  expect(body.Expected_Response).toBe("1200");
  expect(body.Num_sent).toBe("50000");
  expect(body.Description).toBe("End-to-end e2e test campaign");

  await expectRecordRoute(page, org.slug);
});

test("Save and New resets the create form", async ({ page }) => {
  const { org } = await openCreate(page);
  await page
    .getByRole("textbox", { name: "Campaign Name", exact: true })
    .fill("Campaign Save And New");
  await page.locator('[data-form-field="Type"]').getByRole("button", { name: "Type" }).click();
  await page.getByRole("option", { name: "Conference", exact: true }).click();
  await page.getByRole("button", { name: "Save and New", exact: true }).click();
  await expect(page).toHaveURL(moduleCreatePath(org.slug, CAMPAIGNS_TAB));
  await expect(page.getByRole("textbox", { name: "Campaign Name", exact: true })).toHaveValue("");
});

test("Cancel returns to the list without saving", async ({ page }) => {
  const { list } = await openCreate(page);
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(page).toHaveURL(list);
});

test("edit loads saved record values and updates on Save", async ({ page }) => {
  const { org } = await openCreate(page);
  await page.getByRole("textbox", { name: "Campaign Name", exact: true }).fill("Editable Campaign");
  await page.locator('[data-form-field="Type"]').getByRole("button", { name: "Type" }).click();
  await page.getByRole("option", { name: "Webinar", exact: true }).click();

  const createRequest = page.waitForRequest(
    (request) => request.method() === "POST" && new URL(request.url()).pathname === CREATE_PATH,
  );
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await createRequest;
  await expectRecordRoute(page, org.slug);
  const id = campaignRecordIdFromPath(new URL(page.url()).pathname);

  // Navigate to edit route
  await page.goto(moduleRecordEditPath(org.slug, CAMPAIGNS_TAB, id));
  await expect(page.getByRole("heading", { name: "Edit Campaign" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Campaign Name", exact: true })).toHaveValue(
    "Editable Campaign",
  );
  await expect(
    page.locator('[data-form-field="Type"]').getByRole("button", { name: "Type" }),
  ).toHaveText("Webinar");

  // Modify fields
  await page
    .getByRole("textbox", { name: "Campaign Name", exact: true })
    .fill("Updated Campaign Name");
  await page.locator('[data-form-field="Status"]').getByRole("button", { name: "Status" }).click();
  await page.getByRole("option", { name: "Active", exact: true }).click();

  const updateRequest = page.waitForRequest(
    (request) =>
      request.method() === "PUT" && new URL(request.url()).pathname.startsWith(`${CREATE_PATH}/`),
  );
  await page.getByRole("button", { name: "Save", exact: true }).click();
  const request = await updateRequest;
  const edited = request.postDataJSON().data[0];
  expect(edited.Campaign_Name).toBe("Updated Campaign Name");
  expect(edited.Status).toBe("Active");
  await expectRecordRoute(page, org.slug);
});

test("laterModule controls do not navigate or open dialogs (CF-01, CF-22, CF-23, CF-24)", async ({
  page,
}) => {
  await openCreate(page);
  const url = page.url();

  // CF-01 Edit Page Layout (M11)
  await page.getByRole("button", { name: "Edit Page Layout", exact: true }).click({ force: true });
  await expect(page).toHaveURL(url);
  await expect(page.getByRole("dialog")).toHaveCount(0);

  // CF-24 Client Script (M11)
  await page.getByRole("button", { name: "Client Script", exact: true }).click({ force: true });
  await expect(page).toHaveURL(url);
  await expect(page.getByRole("dialog")).toHaveCount(0);

  // CF-22 / CF-23 Footer controls (M11)
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
