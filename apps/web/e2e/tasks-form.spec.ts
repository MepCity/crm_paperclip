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
  await page.getByRole("textbox", { name: "Subject", exact: true }).fill("Call back");
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
  await expect(page.getByRole("textbox", { name: "Subject", exact: true })).toHaveValue(
    "Call back",
  );
  await expect(page.getByRole("switch", { name: "Reminder" })).toBeChecked();
  await expect(page.getByRole("switch", { name: "Repeat" })).toBeChecked();
  await page.getByRole("textbox", { name: "Subject", exact: true }).fill("Call back later");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/crm/${org.slug}/tab/Tasks/${id}$`), {
    timeout: 60_000,
  });
  await expect(
    page.locator("[data-record-header]").getByRole("heading", { level: 1 }),
  ).toContainText("Call back later");
});
