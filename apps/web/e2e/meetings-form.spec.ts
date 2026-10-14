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

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1470, height: 835 });
});

test("the Meeting Information window shows its fields in order with the defaults", async ({
  page,
}) => {
  const { dialog } = await openDialog(page);
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
  await dialog.locator("input[name=End_DateTime-date]").fill("2000-01-01");
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

test("Add more details opens the full form with the typed values", async ({ page }) => {
  const { org, dialog } = await openDialog(page);
  await dialog.getByRole("textbox", { name: "Title", exact: true }).fill("Quarterly review");
  await dialog.getByRole("button", { name: "Add more details" }).click();
  await expect(page).toHaveURL(new RegExp(`/crm/${org.slug}/tab/Meetings/create`));
  await expect(page.getByRole("heading", { name: "Create Meeting" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Title", exact: true })).toHaveValue(
    "Quarterly review",
  );
  await expect(page.getByRole("switch", { name: "Repeat" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "Description", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Participants Reminder" })).toBeVisible();
});

test("adds a participant in the window and edits the meeting from the record", async ({ page }) => {
  const { org, dialog } = await openDialog(page);
  await dialog.getByRole("textbox", { name: "Title", exact: true }).fill("Customer call");
  await dialog.getByRole("button", { name: "Add", exact: true }).click();
  const picker = page.getByRole("dialog").last();
  await picker.getByRole("radio").first().click();
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
