import type { Page } from "@playwright/test";
import { TASKS_FORM_INFORMATION_COLUMNS } from "../src/modules/tasks/tasks-form-rules";
import { signUpNewUser } from "./support/auth";
import { moduleListDefaultPath, moduleRecordEditPath } from "./support/crm-paths";
import { createOrganization } from "./support/org";
import { expect, test } from "./support/test";

const TASKS_TAB = "Tasks";

test.use({ deviceScaleFactor: 2 });

async function openCreate(page: Page) {
  await signUpNewUser(page);
  const org = await createOrganization(page);
  await page.goto(moduleListDefaultPath(org.slug, TASKS_TAB));
  await page.getByRole("link", { name: "Create Task", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Create Task" })).toBeVisible();
  return org;
}

async function expectActivityLayout(page: Page) {
  await expect(page.getByRole("button", { name: "Client Script" })).toHaveCount(0);
  await expect(page.getByText("Create Form Views :")).toHaveCount(0);
  await expect(page.locator(".record-form-card")).toHaveCount(0);
  for (const [field, label, value] of [
    ["Who_Id", "Contact Name", "Contact"],
    ["What_Id", "Related To", "Account"],
  ] as const) {
    const row = page.locator(`[data-form-field="${field}"]`);
    await expect(
      row.locator(".record-form-row__label").getByRole("button", { name: `${label} module` }),
    ).toContainText(value);
    await expect(row.locator("[data-record-form-control-slot] .record-prefix-select")).toHaveCount(
      0,
    );
    await expect(row.getByRole("button", { name: `Open ${label} lookup` })).toBeVisible();
  }
  const marker = await page
    .locator('[data-form-field="Subject"] [data-record-form-row]')
    .evaluate((row) => {
      const style = getComputedStyle(row, "::after");
      return { width: style.width, height: style.height, color: style.backgroundColor };
    });
  expect(marker).toEqual({ width: "25px", height: "2px", color: "rgb(242, 123, 119)" });
}

function taskIdFromPath(pathname: string): string {
  const parts = pathname.split("/").filter(Boolean);
  const id = parts[parts.indexOf(TASKS_TAB) + 1];
  if (!id || id === "list" || id === "create") throw new Error(`No task id in ${pathname}`);
  return id;
}

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1470, height: 835 });
});

test("Task Information is one column in the spec order with the create defaults", async ({
  page,
}) => {
  await openCreate(page);
  await expectActivityLayout(page);
  await expect(page.getByRole("button", { name: "Client Script" })).toHaveCount(0);
  await expect(page.getByText("Create Form Views :")).toHaveCount(0);
  const row = page.locator('[data-form-field="Subject"] [data-record-form-row]');
  const geometry = await row.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const control = element.querySelector("input");
    const style = getComputedStyle(control as Element);
    const marker = getComputedStyle(element, "::after");
    return {
      width: rect.width,
      border: style.borderTopWidth,
      shadow: style.boxShadow,
      markerWidth: marker.width,
      markerHeight: marker.height,
      labelAlign: getComputedStyle(element.querySelector("label") as Element).textAlign,
    };
  });
  expect(geometry).toEqual({
    width: 548,
    border: "0px",
    shadow: "none",
    markerWidth: "25px",
    markerHeight: "2px",
    labelAlign: "left",
  });
  if (process.env.PAPERCLIP_RUN_SCRATCH_DIR) {
    await page.screenshot({
      path: `${process.env.PAPERCLIP_RUN_SCRATCH_DIR}/activity-task-create.png`,
    });
  }
  const repeatColor = await page
    .locator('[data-form-field="Recurring_Activity"] [data-switch-track]')
    .evaluate((track) => getComputedStyle(track).backgroundColor);
  expect(repeatColor).toBe("rgb(222, 225, 230)");
  const controls = await page
    .locator('[data-form-field="Owner"], [data-form-field="Remind_At"]')
    .evaluateAll((nodes) =>
      nodes.map((node) => ({
        field: node.getAttribute("data-form-field"),
        elements: [
          ...node.querySelectorAll(
            "[data-record-form-control-slot], .record-choice-shell, .record-choice-trigger, [data-switch-track]",
          ),
        ].map((element) => ({
          className: element.className,
          x: element.getBoundingClientRect().x,
          width: element.getBoundingClientRect().width,
          height: element.getBoundingClientRect().height,
          grid: getComputedStyle(element).gridColumn,
        })),
      })),
    );
  expect(controls[0]?.elements[0]?.x).toBe(551);
  expect(
    controls[0]?.elements.find((element) => element.className.includes("record-choice-trigger"))?.x,
  ).toBe(551);
  const ownerValueX = await page
    .locator('[data-form-field="Owner"] .record-choice-trigger > span')
    .first()
    .evaluate((value) => value.getBoundingClientRect().x);
  expect(ownerValueX).toBe(551);
  expect(controls[1]?.elements.at(-1)?.width).toBe(28);
  expect(controls[1]?.elements.at(-1)?.height).toBe(15);
  const order = await page
    .getByRole("heading", { name: "Task Information", exact: true })
    .locator("xpath=ancestor::*[@data-record-form-section][1]")
    .locator("[data-form-field]")
    .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-form-field")));
  expect(order.filter((name) => name !== "Who_Id__module")).toEqual([
    ...TASKS_FORM_INFORMATION_COLUMNS[0],
  ]);
  await expect(page.getByRole("button", { name: "Status", exact: true })).toContainText(
    "Not Started",
  );
  await expect(page.getByRole("button", { name: "Priority", exact: true })).toContainText("High");
  await expect(page.getByRole("switch", { name: "Reminder" })).not.toBeChecked();
  await expect(page.getByRole("switch", { name: "Repeat" })).not.toBeChecked();
  await expect(page.getByRole("textbox", { name: "Description", exact: true })).toBeVisible();
});

test("an empty save asks for the Subject", async ({ page }) => {
  await openCreate(page);
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByText("Subject cannot be empty.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Create Task" })).toBeVisible();
});

test("creates a task and edits it from the record route", async ({ page }) => {
  const org = await openCreate(page);
  await page.getByRole("combobox", { name: "Subject", exact: true }).fill("Call back");
  await page.getByRole("textbox", { name: "Due Date", exact: true }).fill("30.11.2026");
  await page.getByRole("button", { name: "Status", exact: true }).click();
  await page.getByRole("option", { name: "In Progress", exact: true }).click();
  await page.locator("[data-form-field=Remind_At] [aria-hidden=true]").first().click();
  await page.locator("[data-form-field=Recurring_Activity] [aria-hidden=true]").first().click();
  await page.getByRole("button", { name: "Save", exact: true }).click();

  await expect(page).toHaveURL(new RegExp(`/crm/${org.slug}/tab/Tasks/\\d+$`), {
    timeout: 60_000,
  });
  await expect(
    page.locator("[data-record-header]").getByRole("heading", { level: 1 }),
  ).toContainText("Call back");
  const id = taskIdFromPath(new URL(page.url()).pathname);

  await page.goto(moduleRecordEditPath(org.slug, TASKS_TAB, id));
  await expect(page.getByRole("heading", { name: "Edit Task" })).toBeVisible();
  await expectActivityLayout(page);
  if (process.env.PAPERCLIP_RUN_SCRATCH_DIR) {
    await page.screenshot({
      path: `${process.env.PAPERCLIP_RUN_SCRATCH_DIR}/activity-task-edit.png`,
    });
  }
  await expect(page.getByRole("combobox", { name: "Subject", exact: true })).toHaveValue(
    "Call back",
  );
  await expect(page.getByRole("switch", { name: "Reminder" })).toBeChecked();
  await expect(page.getByRole("switch", { name: "Repeat" })).toBeChecked();
  await page.getByRole("combobox", { name: "Subject", exact: true }).fill("Call back later");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/crm/${org.slug}/tab/Tasks/${id}$`), {
    timeout: 60_000,
  });
  await expect(
    page.locator("[data-record-header]").getByRole("heading", { level: 1 }),
  ).toContainText("Call back later");
});

test("label type selectors change the lookup target and retain the existing search windows", async ({
  page,
}) => {
  await openCreate(page);
  await page.getByRole("button", { name: "Open Contact Name lookup" }).click();
  await expect(page.getByRole("dialog", { name: "Choose Contact" })).toBeVisible();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Contact Name module" }).click();
  await expect(page.getByRole("option", { name: "Contact", exact: true })).toBeVisible();
  await page.getByRole("option", { name: "Lead", exact: true }).click();
  await page.getByRole("button", { name: "Open Contact Name lookup" }).click();
  await expect(page.getByRole("dialog", { name: "Choose Lead" })).toBeVisible();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Related To module" }).click();
  await expect(page.getByRole("textbox", { name: "Search", exact: true })).toBeVisible();
  for (const name of [
    "Account",
    "Deal",
    "Product",
    "Quote",
    "Sales Order",
    "Purchase Order",
    "Invoice",
  ]) {
    await expect(page.getByRole("option", { name, exact: true })).toBeVisible();
  }
  await page.getByRole("option", { name: "Account", exact: true }).click();
  await page.getByRole("button", { name: "Open Related To lookup" }).click();
  await expect(page.getByRole("dialog", { name: "Choose Account" })).toBeVisible();
});

async function pickRecord(page: Page, lookupName: string): Promise<string> {
  await page.getByRole("button", { name: lookupName, exact: true }).click();
  const dialog = page.getByRole("dialog");
  const radio = dialog.getByRole("radio").first();
  await expect(radio).toBeVisible();
  const name = await radio.getAttribute("aria-label");
  if (!name) throw new Error("The picker has no seeded record");
  await dialog.getByRole("row", { name }).click();
  await dialog.getByRole("button", { name: "Done", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  return name;
}

test("Who and What types pick a lead and a deal, save, and survive an edit", async ({ page }) => {
  const org = await openCreate(page);
  await page.getByRole("combobox", { name: "Subject", exact: true }).fill("Follow up");

  await page
    .getByRole("button", { name: /module$/ })
    .first()
    .click();
  await page.getByRole("option", { name: "Lead", exact: true }).click();
  const lead = await pickRecord(page, "Open Contact Name lookup");

  await page
    .getByRole("button", { name: /module$/ })
    .nth(1)
    .click();
  await page.getByRole("option", { name: "Deal", exact: true }).click();
  const deal = await pickRecord(page, "Open Related To lookup");

  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/crm/${org.slug}/tab/Tasks/\\d+$`), {
    timeout: 60_000,
  });
  await expect(page.getByText(lead).first()).toBeVisible();
  await expect(page.getByText(deal).first()).toBeVisible();
  const id = taskIdFromPath(new URL(page.url()).pathname);

  await page.goto(moduleRecordEditPath(org.slug, TASKS_TAB, id));
  await expect(page.getByRole("heading", { name: "Edit Task" })).toBeVisible();
  await expect(page.getByRole("button", { name: /module$/ }).first()).toContainText("Lead");
  await expect(page.getByRole("button", { name: /module$/ }).nth(1)).toContainText("Deal");
  await expect(page.locator("[data-form-field=Who_Id] input")).toHaveValue(lead);
  await expect(page.locator("[data-form-field=What_Id] input")).toHaveValue(deal);
});

test("Task Subject suggestions and Due Date calendar supplement editable text", async ({
  page,
}) => {
  await openCreate(page);
  const subject = page.getByRole("combobox", { name: "Subject", exact: true });
  await subject.click();
  await expect(page.getByRole("option")).toHaveText([
    "Email",
    "Call",
    "Meeting",
    "Send Letter",
    "Product Demo",
  ]);
  const inputBox = await subject.boundingBox();
  const panelBox = await page.locator(".record-choice-panel").boundingBox();
  expect(inputBox).not.toBeNull();
  expect(panelBox).not.toBeNull();
  // TF-07 open-panel geometry is unobserved: board interim rule is exactly the input width.
  // activities-form.md, label/value columns: x=551–880, 329px value span.
  expect(inputBox?.width).toBeCloseTo(329, 0);
  expect(Math.abs((panelBox?.width ?? 0) - (inputBox?.width ?? 0))).toBeLessThanOrEqual(1);
  if (process.env.PAPERCLIP_RUN_SCRATCH_DIR)
    await page.screenshot({
      path: `${process.env.PAPERCLIP_RUN_SCRATCH_DIR}/task-subject-suggestions.png`,
    });
  await subject.fill("mee");
  await expect(page.getByRole("option")).toHaveText(["Meeting"]);
  await subject.press("ArrowDown");
  await subject.press("Enter");
  await expect(subject).toHaveValue("Meeting");
  await subject.fill("Custom follow up");
  const due = page.getByRole("textbox", { name: "Due Date", exact: true });
  await due.fill("10.11.2026");
  await due.click();
  const calendar = page.getByRole("dialog", { name: "Due Date calendar" });
  await expect(calendar).toBeVisible();
  const calendarBox = await calendar.locator("..").boundingBox();
  expect(calendarBox).not.toBeNull();
  expect(calendarBox?.width).toBeGreaterThanOrEqual(329);
  if (process.env.PAPERCLIP_RUN_SCRATCH_DIR)
    await page.screenshot({
      path: `${process.env.PAPERCLIP_RUN_SCRATCH_DIR}/task-due-date-calendar.png`,
    });
  await calendar.getByRole("button", { name: /November 15, 2026/ }).click();
  await expect(due).toHaveValue("15.11.2026");
  await expect(calendar).toBeHidden();
  await expect(subject).toHaveValue("Custom follow up");
  await due.fill("31.02.2026");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByText("Please enter a valid Due Date.")).toBeVisible();
});
