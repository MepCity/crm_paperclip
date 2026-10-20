import type { Page } from "@playwright/test";
import { signUpNewUser } from "./support/auth";
import { moduleListDefaultPath, moduleRecordEditPath } from "./support/crm-paths";
import { createOrganization } from "./support/org";
import { expect, test } from "./support/test";

const TAB = "Meetings";

async function openDialog(page: Page) {
  await signUpNewUser(page);
  const org = await createOrganization(page);
  await page.goto(moduleListDefaultPath(org.slug, TAB));
  await page.getByRole("button", { name: "Create Meeting", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Meeting Information" });
  await expect(dialog).toBeVisible();
  return { org, dialog };
}

function meetingIdFromPath(pathname: string): string {
  const parts = pathname.split("/").filter(Boolean);
  const id = parts[parts.indexOf(TAB) + 1];
  if (!id || id === "list" || id === "create") throw new Error(`No meeting id in ${pathname}`);
  return id;
}

test.use({
  viewport: { width: 1470, height: 835 },
});

test("the Meeting Information window shows its fields in order with the defaults", async ({
  page,
}) => {
  const { dialog } = await openDialog(page);
  await expect(dialog.getByRole("textbox", { name: "Title", exact: true })).toBeFocused();
  const fromDate = await dialog.getByLabel("From date", { exact: true }).boundingBox();
  const fromTime = await dialog.getByLabel("From time", { exact: true }).boundingBox();
  expect(Math.abs((fromDate?.y ?? 0) - (fromTime?.y ?? 99))).toBeLessThan(2);
  expect(fromTime?.x ?? 0).toBeGreaterThan(fromDate?.x ?? 0);
  await expect(dialog.getByRole("button", { name: "Add", exact: true })).toHaveText("+ Add");
  const order = await dialog
    .locator("[data-form-field]")
    .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-form-field")));
  expect(order).toEqual([
    "Event_Title",
    "Meeting_Venue__s",
    "Venue",
    "All_day",
    "Start_DateTime",
    "End_DateTime",
    "Owner",
    "Participants",
  ]);
  await expect(dialog.getByRole("textbox", { name: "Title", exact: true })).toHaveValue(
    "New Meeting",
  );
  await expect(dialog.getByRole("button", { name: "Meeting Venue", exact: true })).toContainText(
    "Client location",
  );
  await expect(dialog.getByRole("checkbox", { name: "All day" })).not.toBeChecked();
  await expect(dialog.getByRole("button", { name: "Add more details" })).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Cancel", exact: true })).toBeVisible();
  await dialog.getByRole("button", { name: "Meeting Venue", exact: true }).click();
  await expect(page.getByRole("option")).toHaveText([
    "-None-",
    "In-office",
    "Client location",
    "Online",
  ]);
});

test("Cancel creates nothing and closes the window", async ({ page }) => {
  const { org, dialog } = await openDialog(page);
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(dialog).toBeHidden();
  await expect(page).toHaveURL(new RegExp(`/crm/${org.slug}/tab/Meetings`));
});

test("To earlier than From blocks Save and reports under To", async ({ page }) => {
  const { dialog } = await openDialog(page);
  await dialog.getByLabel("To date", { exact: true }).fill("01.01.2000");
  await dialog.getByRole("button", { name: "Save", exact: true }).click();
  await expect(dialog.getByText("Please enter a valid To.")).toBeVisible();
  await expect(dialog).toBeVisible();
});

test("Save creates the meeting and opens its record", async ({ page }) => {
  const { org, dialog } = await openDialog(page);
  await dialog.getByRole("textbox", { name: "Title", exact: true }).fill("Planning sync");
  await dialog.getByRole("textbox", { name: "Location", exact: true }).fill("Room 4");
  await dialog.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/crm/${org.slug}/tab/Meetings/\\d+$`), {
    timeout: 60_000,
  });
  await expect(
    page.locator("[data-record-header]").getByRole("heading", { level: 1 }),
  ).toContainText("Planning sync");
});

test("Add more details expands the same window and saves the extra field", async ({ page }) => {
  const { org, dialog } = await openDialog(page);
  const windowUrl = page.url();
  await dialog.getByRole("textbox", { name: "Title", exact: true }).fill("Quarterly review");
  const save = dialog.getByRole("button", { name: "Save", exact: true });
  const before = await dialog.boundingBox();
  const footerBefore = await save.boundingBox();
  expect(before?.y).toBe(0);
  expect(before?.height).toBe(547);
  await dialog.getByRole("button", { name: "Add more details" }).click();
  expect(page.url()).toBe(windowUrl);
  await expect(dialog.getByRole("button", { name: "Add more details" })).toHaveCount(0);
  const after = await dialog.boundingBox();
  const footerAfter = await save.boundingBox();
  expect(after?.y).toBe(0);
  expect(after?.height).toBe(547);
  expect(footerAfter?.y).toBe(footerBefore?.y);
  await expect
    .poll(() => dialog.locator(".meeting-window__body").evaluate((el) => el.scrollTop))
    .toBeGreaterThan(0);
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("switch", { name: "Repeat" })).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Save", exact: true })).toBeVisible();
  await dialog.getByRole("textbox", { name: "Description", exact: true }).fill("Agenda notes");
  await dialog.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/crm/${org.slug}/tab/Meetings/\\d+$`), {
    timeout: 60_000,
  });
  await expect(page.getByText("Agenda notes").first()).toBeVisible();
});

test("adds a participant in the window and edits the meeting from the record", async ({ page }) => {
  const { org, dialog } = await openDialog(page);
  await dialog.getByRole("textbox", { name: "Title", exact: true }).fill("Customer call");
  await dialog.getByRole("button", { name: "Add", exact: true }).click();
  const picker = page.getByRole("dialog").last();
  await expect(picker.getByRole("button", { name: /Module/ })).toBeVisible();
  await picker.locator("label.table-radio").first().click();
  await picker.getByRole("button", { name: "Done" }).click();
  await expect(dialog.getByText("1 selected")).toBeVisible();
  await dialog.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/crm/${org.slug}/tab/Meetings/\\d+$`), {
    timeout: 60_000,
  });
  await expect(page.locator("[data-meetings-participants-card] li")).toHaveCount(1);
  const id = meetingIdFromPath(new URL(page.url()).pathname);

  await page.goto(moduleRecordEditPath(org.slug, TAB, id));
  await expect(page.getByRole("heading", { name: "Edit Meeting" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Title", exact: true })).toHaveValue(
    "Customer call",
  );
  await page.getByRole("textbox", { name: "Title", exact: true }).fill("Customer call (moved)");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/crm/${org.slug}/tab/Meetings/${id}$`), {
    timeout: 60_000,
  });
  await expect(
    page.locator("[data-record-header]").getByRole("heading", { level: 1 }),
  ).toContainText("Customer call (moved)");
});
