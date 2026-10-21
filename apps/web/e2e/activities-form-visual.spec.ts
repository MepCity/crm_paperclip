import type { Locator, Page } from "@playwright/test";
import { signUpNewUser } from "./support/auth";
import { moduleListDefaultPath, moduleRecordEditPath } from "./support/crm-paths";
import { createOrganization } from "./support/org";
import { expect, test } from "./support/test";

// Measured values come from research/specs/activities-form.md › "Visual layout — … (measured)".
// No reference image or pixel snapshot is used; only computed styles and bounding boxes.
const TOLERANCE = 2;
const screenshotDir = process.env.ACTIVITIES_SCREENSHOT_DIR || process.env.PAPERCLIP_SCRATCH_DIR;

test.use({ viewport: { width: 1470, height: 835 }, deviceScaleFactor: 2 });

function near(actual: number, expected: number) {
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(TOLERANCE);
}

async function box(locator: Locator) {
  const rect = await locator.boundingBox();
  if (!rect) throw new Error("element has no bounding box");
  return rect;
}

async function saveVisualScreenshot(page: Page, filename: string) {
  if (screenshotDir) {
    await page.screenshot({ path: `${screenshotDir}/${filename}` });
  }
}

async function expectNoFormChrome(scope: Page | Locator) {
  await expect(scope.getByRole("button", { name: "Client Script" })).toHaveCount(0);
  await expect(scope.getByText("Create Form Views :")).toHaveCount(0);
}

async function expectUnboxedRow(page: Page, field: string, rowX: number, rowWidth: number) {
  const row = page.locator(`[data-form-field="${field}"] [data-record-form-row]`);
  const rect = await box(row);
  near(rect.x, rowX);
  near(rect.width, rowWidth);
  const style = await row.evaluate((element) => {
    const input = element.querySelector("input, textarea");
    const cs = getComputedStyle(input as Element);
    const label = getComputedStyle(element.querySelector("label") as Element);
    return {
      top: cs.borderTopWidth,
      left: cs.borderLeftWidth,
      right: cs.borderRightWidth,
      labelAlign: label.textAlign,
    };
  });
  expect(style).toEqual({ top: "0px", left: "0px", right: "0px", labelAlign: "left" });
}

async function expectTaskFormVisual(page: Page) {
  await expectNoFormChrome(page);
  // Form column: x=332, width 548 (Task measured, requirement 2).
  await expectUnboxedRow(page, "Subject", 332, 548);
  // Required marker: 25 × 2 px red segment under the label (requirement 7).
  const marker = await page
    .locator('[data-form-field="Subject"] [data-record-form-row]')
    .evaluate((row) => {
      const s = getComputedStyle(row, "::after");
      return { w: s.width, h: s.height, c: s.backgroundColor };
    });
  expect(marker).toEqual({ w: "25px", h: "2px", c: "rgb(242, 123, 119)" });
  // Value column starts at x=551 (requirement 4).
  const subject = await box(page.getByRole("textbox", { name: "Subject", exact: true }));
  near(subject.x, 551);
  // Lookup magnifier icon present on Contact and Account (requirement 8).
  await expect(page.getByRole("button", { name: "Open Contact Name lookup" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Open Related To lookup" })).toBeVisible();
  // Toggles are bare 28 × 15 tracks with no text beside them (requirement 11).
  for (const field of ["Remind_At", "Recurring_Activity"]) {
    const track = await box(page.locator(`[data-form-field="${field}"] [data-switch-track]`));
    near(track.width, 28);
    near(track.height, 15);
    // The label is visually hidden (sr-only): no painted text beside the track.
    const labelWidth = await page
      .locator(
        `[data-form-field="${field}"] [data-record-form-control-slot] [data-switch-track] + span`,
      )
      .evaluate((el) => el.getBoundingClientRect().width);
    expect(labelWidth).toBeLessThanOrEqual(1);
  }
}

async function openTaskCreate(page: Page) {
  await signUpNewUser(page);
  const org = await createOrganization(page);
  await page.goto(moduleListDefaultPath(org.slug, "Tasks"));
  await page.getByRole("link", { name: "Create Task", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Create Task" })).toBeVisible();
  return org;
}

test("Create Task matches the measured layout", async ({ page }) => {
  await openTaskCreate(page);
  await expectTaskFormVisual(page);
  await saveVisualScreenshot(page, "our-task-create.png");
});

test("Task Edit keeps the Create layout", async ({ page }) => {
  const org = await openTaskCreate(page);
  await page.getByRole("textbox", { name: "Subject", exact: true }).fill("Visual check");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/crm/${org.slug}/tab/Tasks/\\d+$`), {
    timeout: 60_000,
  });
  const id = new URL(page.url()).pathname.split("/").filter(Boolean).pop() as string;
  await page.goto(moduleRecordEditPath(org.slug, "Tasks", id));
  await expect(page.getByRole("heading", { name: "Edit Task" })).toBeVisible();
  await expectTaskFormVisual(page);
  await saveVisualScreenshot(page, "our-task-edit.png");
});

async function openMeetingDialog(page: Page) {
  await signUpNewUser(page);
  const org = await createOrganization(page);
  await page.goto(moduleListDefaultPath(org.slug, "Meetings"));
  await page.getByRole("button", { name: "Create Meeting", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Meeting Information" });
  await expect(dialog).toBeVisible();
  return { org, dialog };
}

test("Meeting Information window matches the measured layout", async ({ page }) => {
  const { dialog } = await openMeetingDialog(page);
  await expectNoFormChrome(dialog);
  // Modal: x=485, width 500 (Meeting measured, requirement 1).
  const modal = await box(dialog);
  near(modal.x, 485);
  near(modal.width, 500);
  // Rows span 418 px from x=515; values start at x=682.
  const title = await box(dialog.getByRole("textbox", { name: "Title", exact: true }));
  near(title.x, 682);
  const rowLocator = dialog.locator('[data-form-field="Event_Title"] [data-record-form-row]');
  const row = await box(rowLocator);
  near(row.x, 515);
  near(row.width, 418);
  // Unboxed row and required marker on Title (requirements 5, 6, 7).
  const titleStyle = await rowLocator.evaluate((el) => {
    const s = getComputedStyle(el, "::after");
    const input = el.querySelector("input, textarea");
    const cs = getComputedStyle(input as Element);
    const label = getComputedStyle(el.querySelector("label") as Element);
    return {
      markerWidth: s.width,
      markerHeight: s.height,
      markerColor: s.backgroundColor,
      borderTop: cs.borderTopWidth,
      borderLeft: cs.borderLeftWidth,
      borderRight: cs.borderRightWidth,
      labelAlign: label.textAlign,
    };
  });
  expect(titleStyle).toEqual({
    markerWidth: "25px",
    markerHeight: "2px",
    markerColor: "rgb(242, 123, 119)",
    borderTop: "0px",
    borderLeft: "0px",
    borderRight: "0px",
    labelAlign: "left",
  });
  // All day is a 15 × 15 checkbox, not a switch (requirement 11).
  const check = await box(dialog.getByRole("checkbox", { name: "All day" }));
  near(check.width, 15);
  near(check.height, 15);
  // Date and time sit on one line, 10 px apart (requirement 10).
  const date = await box(dialog.getByLabel("From date", { exact: true }));
  const time = await box(dialog.getByLabel("From time", { exact: true }));
  near(time.x - (date.x + date.width), 10);
  // Footer actions only: Cancel and Save, no Save and New.
  await expect(dialog.getByRole("button", { name: "Save and New" })).toHaveCount(0);
  await saveVisualScreenshot(page, "our-meeting-dialog.png");
});

test("full Meeting form matches the measured layout", async ({ page }) => {
  const { dialog } = await openMeetingDialog(page);
  await dialog.getByRole("button", { name: "Add more details" }).click();
  await expectNoFormChrome(page);
  await expect(dialog.getByRole("switch", { name: "Repeat" })).toBeVisible();
  await expect(dialog.getByRole("textbox", { name: "Description", exact: true })).toBeVisible();
  await saveVisualScreenshot(page, "our-meeting-full.png");
});

test("Activities lists and record detail do not render copied extra elements", async ({ page }) => {
  await signUpNewUser(page);
  const org = await createOrganization(page);
  // Tasks list: no Related List rail, no Form chrome (MEP-590 blocker)
  await page.goto(moduleListDefaultPath(org.slug, "Tasks"));
  await expect(page.locator("[data-record-rail]")).toHaveCount(0);
  await expect(page.locator("[data-record-rail-control]")).toHaveCount(0);
  await expectNoFormChrome(page);

  // Task detail: no Related List rail, no rail control, no Client Script / Create Form Views (MEP-591 blocker)
  await page.getByRole("link", { name: "Create Task", exact: true }).click();
  await page.getByRole("textbox", { name: "Subject", exact: true }).fill("Blocker check");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/crm/${org.slug}/tab/Tasks/\\d+$`), {
    timeout: 60_000,
  });
  await expect(page.locator("[data-record-rail]")).toHaveCount(0);
  await expect(page.locator("[data-record-rail-control]")).toHaveCount(0);
  await expectNoFormChrome(page);
});

// Call layout as measured in research/specs/activities-form.md ("Visual layout —
// Call form"): boxed fields, right-aligned labels, wide selects, 3 px vertical
// required bar. Create is measured; Edit is assumed equal (open question).
async function expectCallFormVisual(page: Page) {
  await expectNoFormChrome(page);
  const row = page.locator('[data-form-field="Call_Type"] [data-record-form-row]');
  const rowStyle = await row.evaluate((el) => {
    const cs = getComputedStyle(el);
    const label = el.querySelector("label") as HTMLElement;
    return {
      labelAlign: getComputedStyle(label).textAlign,
      borders: [cs.borderTopWidth, cs.borderRightWidth, cs.borderBottomWidth, cs.borderLeftWidth],
    };
  });
  // Full perimeter border (not Task's underline) and right-aligned label.
  expect(rowStyle.labelAlign).toBe("right");
  expect(rowStyle.borders.every((w) => w !== "0px")).toBe(true);
  // Call Type select box: x=534.5, width 531 (±2).
  const rect = await box(row);
  near(rect.x, 534.5);
  near(rect.width, 531);
  // Required bar: 3 px wide vertical segment.
  const bar = await row.evaluate((el) => {
    const s = getComputedStyle(el, "::before");
    return { width: s.width, height: s.height };
  });
  expect(bar.width).toBe("3px");
  await expect(page.getByRole("heading", { name: "Call Information", exact: true })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Purpose Of Outgoing Call", exact: true }),
  ).toBeVisible();
  // Title band is white (#FFFFFF), not Task's pale fill.
  const band = await page
    .locator("[data-record-form-strip]")
    .evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(band).toBe("rgb(255, 255, 255)");
  // Call Start Time: date 210 px, time 76 px, 9 px gap.
  const dt = page.locator('[data-form-field="Call_Start_Time"] .record-form-datetime');
  const parts = await dt.evaluate((el) =>
    [...el.children].map((c) => c.getBoundingClientRect()).map((r) => ({ x: r.x, w: r.width })),
  );
  const [date, time] = parts as [{ x: number; w: number }, { x: number; w: number }];
  near(date.w, 210);
  near(time.w, 76);
  near(time.x - (date.x + date.w), 9);
  // No Repeat field; Reminder is a dropdown, not a toggle.
  await expect(page.getByRole("switch", { name: "Repeat" })).toHaveCount(0);
  await expect(page.getByRole("switch", { name: "Reminder" })).toHaveCount(0);
  // Related To lookup shows its magnifier.
  await expect(page.locator('[data-form-field="What_Id"] svg').first()).toBeVisible();
}

async function openCallCreate(page: Page) {
  await signUpNewUser(page);
  const org = await createOrganization(page);
  await page.goto(moduleListDefaultPath(org.slug, "Calls"));
  await page.getByRole("link", { name: "Create Call", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Create Call" })).toBeVisible();
  return org;
}

test("Create Call matches the measured layout", async ({ page }) => {
  await openCallCreate(page);
  await expectCallFormVisual(page);
  await saveVisualScreenshot(page, "our-call-create.png");
});

test("Call Edit keeps the Create layout", async ({ page }) => {
  const org = await openCallCreate(page);
  await page.goto(moduleRecordEditPath(org.slug, "Calls", "150000000000000001"));
  await expect(page.getByRole("heading", { name: "Edit Call" })).toBeVisible();
  await expectCallFormVisual(page);
  await saveVisualScreenshot(page, "our-call-edit.png");
});
