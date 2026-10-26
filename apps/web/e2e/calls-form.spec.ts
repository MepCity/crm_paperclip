import type { Page } from "@playwright/test";
import { signUpNewUser } from "./support/auth";
import { moduleListDefaultPath, moduleRecordPath } from "./support/crm-paths";
import { createOrganization } from "./support/org";
import { expect, ignoreFailedResponses, test } from "./support/test";

const CALLS_TAB = "Calls";
// Seeded scheduled call that reads as Overdue and is linked to a contact.
const SCHEDULED_CALL_ID = "150000000000000001";

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1470, height: 835 });
});

async function openCreate(page: Page) {
  await signUpNewUser(page);
  const org = await createOrganization(page);
  await page.goto(moduleListDefaultPath(org.slug, CALLS_TAB));
  await page.goto(`/crm/${org.slug}/tab/Calls/create`);
  await expect(page.getByRole("heading", { name: "Create Call" })).toBeVisible();
  return org;
}

async function pickCallFrom(page: Page): Promise<string> {
  await page.getByRole("button", { name: "Open Call From/To lookup", exact: true }).click();
  const dialog = page.getByRole("dialog");
  const radio = dialog.getByRole("radio").first();
  await expect(radio).toBeVisible();
  const name = await radio.getAttribute("aria-label");
  if (!name) throw new Error("Missing record name in the picker");
  await dialog.getByRole("row", { name }).click();
  await dialog.getByRole("button", { name: "Done", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  return name;
}

test("Create Call paints the scheduling form with the Outbound and Scheduled defaults", async ({
  page,
}) => {
  await openCreate(page);
  await expect(page.getByRole("button", { name: "Client Script" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Call Type", exact: true })).toContainText(
    "Outbound",
  );
  await expect(
    page.getByRole("button", { name: "Outgoing Call Status", exact: true }),
  ).toContainText("Scheduled");
  const order = await page
    .getByRole("heading", { name: "Call Information", exact: true })
    .locator("xpath=ancestor::*[@data-record-form-section][1]")
    .locator("[data-form-field]")
    .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-form-field")));
  expect(order).toEqual([
    "Who_Id",
    "What_Id",
    "Call_Type",
    "Outgoing_Call_Status",
    "Call_Start_Time",
    "Owner",
    "Subject",
    "Reminder",
  ]);
  await expect(page.getByRole("heading", { name: "Purpose Of Outgoing Call" })).toBeVisible();
});

test("an empty save asks for the required fields", async ({ page }) => {
  await openCreate(page);
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByText("Call From/To cannot be empty.")).toBeVisible();
  await expect(page.getByText("Call Start Time cannot be empty.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Create Call" })).toBeVisible();
});

test("Inbound switches the form to record mode with a required duration", async ({ page }) => {
  await openCreate(page);
  await page.getByRole("button", { name: "Call Type", exact: true }).click();
  await page.getByRole("option", { name: "Inbound", exact: true }).click();
  await expect(page.getByRole("button", { name: "Reminder", exact: true })).toHaveCount(0);
  await expect(page.locator("[data-form-field=Call_Duration]")).toBeVisible();
  await expect(page.locator("[data-form-field=Call_Result]")).toBeVisible();
  await page.getByRole("button", { name: "Call Type", exact: true }).click();
  await page.getByRole("option", { name: "Missed", exact: true }).click();
  await expect(page.locator("[data-form-field=Call_Duration]")).toHaveCount(0);
  await page.getByRole("button", { name: "Call Type", exact: true }).click();
  await page.getByRole("option", { name: "Outbound", exact: true }).click();
  await expect(page.getByRole("button", { name: "Reminder", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Outgoing Call Status", exact: true }).click();
  await page.getByRole("option", { name: "Completed", exact: true }).click();
  await expect(page.locator("[data-form-field=Call_Duration]")).toBeVisible();
});

test("a Missed call with Completed status saves with a duration", async ({ page, pageErrors }) => {
  const org = await openCreate(page);
  await pickCallFrom(page);
  await page.getByRole("button", { name: "Call Type", exact: true }).click();
  await page.getByRole("option", { name: "Missed", exact: true }).click();
  await page.getByRole("button", { name: "Outgoing Call Status", exact: true }).click();
  await page.getByRole("option", { name: "Completed", exact: true }).click();
  const duration = page.locator("[data-form-field=Call_Duration]");
  await expect(duration).toBeVisible();
  await duration.getByRole("textbox", { name: "Call Duration minutes" }).fill("01");
  await duration.getByRole("textbox", { name: "Call Duration seconds" }).fill("05");
  await page.getByRole("textbox", { name: "Call Start Time date" }).fill("30.11.2030");
  await page.getByRole("textbox", { name: "Call Start Time time" }).fill("10:30");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/crm/${org.slug}/tab/Calls/\\d+$`), {
    timeout: 60_000,
  });
  ignoreFailedResponses(pageErrors, [400]);
});

test("creates a scheduled call and opens its detail", async ({ page, pageErrors }) => {
  const org = await openCreate(page);
  await pickCallFrom(page);
  await page.getByRole("textbox", { name: "Subject", exact: true }).fill("Follow-up call");
  await page.getByRole("textbox", { name: "Call Start Time date" }).fill("30.11.2030");
  await page.getByRole("textbox", { name: "Call Start Time time" }).fill("10:30");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/crm/${org.slug}/tab/Calls/\\d+$`), {
    timeout: 60_000,
  });
  const header = page.locator("[data-record-header]");
  await expect(header.getByRole("link", { name: "Reschedule Call" })).toBeVisible();
  ignoreFailedResponses(pageErrors, [400]);
});

test("Save and Create Follow-up Task saves the call and opens a prefilled Task form", async ({
  page,
}) => {
  const org = await openCreate(page);
  await expect(page.getByRole("button", { name: "Save and New" })).toHaveCount(0);
  await expect(page.getByRole("textbox", { name: "Call Start Time date" })).toHaveAttribute(
    "placeholder",
    "DD.MM.YYYY",
  );
  const who = await pickCallFrom(page);
  const whatField = page.locator("[data-form-field=What_Id]");
  await whatField.getByRole("button", { name: /^Open .* lookup$/ }).click();
  const dialog = page.getByRole("dialog");
  const radio = dialog.getByRole("radio").first();
  await expect(radio).toBeVisible();
  const what = (await radio.getAttribute("aria-label")) ?? "";
  await dialog.getByRole("row", { name: what }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(whatField.locator("input")).toHaveValue(what);
  await page.getByRole("textbox", { name: "Subject", exact: true }).fill("Intro call");
  await page.getByRole("textbox", { name: "Call Start Time date" }).fill("30.11.2030");
  await page.getByRole("textbox", { name: "Call Start Time time" }).fill("10:30");
  const followUp = page.getByRole("button", {
    name: "Save and Create Follow-up Task",
    exact: true,
  });
  const [cancelBox, followBox, saveBox] = await Promise.all([
    page.getByRole("button", { name: "Cancel", exact: true }).boundingBox(),
    followUp.boundingBox(),
    page.getByRole("button", { name: "Save", exact: true }).boundingBox(),
  ]);
  if (!cancelBox || !followBox || !saveBox) throw new Error("Missing action buttons");
  expect(followBox.x + followBox.width).toBeLessThanOrEqual(cancelBox.x);
  expect(cancelBox.x + cancelBox.width).toBeLessThanOrEqual(saveBox.x);
  const textWidth = await followUp.evaluate((el) => el.scrollWidth - el.clientWidth);
  expect(textWidth).toBeLessThanOrEqual(0);
  await followUp.click();
  await expect(page).toHaveURL(new RegExp(`/crm/${org.slug}/tab/Tasks/create`), {
    timeout: 60_000,
  });
  await expect(page.getByRole("heading", { name: "Create Task" })).toBeVisible();
  await expect(page.getByRole("combobox", { name: "Subject", exact: true })).toHaveValue(
    "Follow-up: Intro call",
  );
  await expect(page.locator("[data-form-field=Who_Id] input")).toHaveValue(who);
  await expect(page.locator("[data-form-field=What_Id] input")).toHaveValue(what);
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/crm/${org.slug}/tab/Tasks/\\d+$`), {
    timeout: 60_000,
  });
  await expect(page.getByText(who).first()).toBeVisible();
  await expect(page.getByText(what).first()).toBeVisible();
  await page.goto(moduleListDefaultPath(org.slug, CALLS_TAB));
  await page.getByRole("link", { name: "Intro call" }).first().click();
  await expect(page).toHaveURL(new RegExp(`/crm/${org.slug}/tab/Calls/\\d+$`));
  await expect(page.getByText(who).first()).toBeVisible();
  await expect(page.getByText(what).first()).toBeVisible();
});

test("Reschedule Call opens Edit with the start time focused", async ({ page }) => {
  await signUpNewUser(page);
  const org = await createOrganization(page);
  await page.goto(moduleRecordPath(org.slug, CALLS_TAB, SCHEDULED_CALL_ID));
  await page.getByRole("link", { name: "Reschedule Call" }).click();
  await expect(page.getByRole("heading", { name: "Edit Call" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Call Start Time date" })).toBeFocused();
  await page.getByRole("textbox", { name: "Call Start Time date" }).fill("30.11.2030");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/crm/${org.slug}/tab/Calls/${SCHEDULED_CALL_ID}$`), {
    timeout: 60_000,
  });
  await expect(page.getByRole("link", { name: "Reschedule Call" })).toBeVisible();
});

test("Mark as Completed asks for a duration and hides Reschedule Call", async ({ page }) => {
  await signUpNewUser(page);
  const org = await createOrganization(page);
  await page.goto(moduleRecordPath(org.slug, CALLS_TAB, SCHEDULED_CALL_ID));
  await page.getByRole("button", { name: "Reschedule options" }).click();
  await page.getByRole("menuitem", { name: "Mark as Completed" }).click();
  await expect(page.getByRole("heading", { name: "Edit Call" })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Outgoing Call Status", exact: true }),
  ).toContainText("Completed");
  await expect(page.locator("[data-form-field=Call_Duration]")).toBeVisible();
  await page.getByLabel("Call Duration minutes").fill("5");
  await page.getByLabel("Call Duration seconds").fill("30");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/crm/${org.slug}/tab/Calls/${SCHEDULED_CALL_ID}$`), {
    timeout: 60_000,
  });
  await expect(page.getByRole("link", { name: "Reschedule Call" })).toHaveCount(0);
});

test("Cancel Call confirms, keeps the record and sets Cancelled", async ({ page }) => {
  await signUpNewUser(page);
  const org = await createOrganization(page);
  await page.goto(moduleRecordPath(org.slug, CALLS_TAB, SCHEDULED_CALL_ID));
  await page.getByRole("button", { name: "Reschedule options" }).click();
  await page.getByRole("menuitem", { name: "Cancel Call" }).click();
  const dialog = page.getByRole("alertdialog");
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Cancel Call" }).click();
  await expect(page.getByRole("link", { name: "Reschedule Call" })).toHaveCount(0);
  await expect(page).toHaveURL(new RegExp(`/Calls/${SCHEDULED_CALL_ID}$`));
  await expect(page.getByText("Cancelled").first()).toBeVisible();
});
