import { writeFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";
import { DEV_UI_A11Y_EXCLUDE, expectNoA11yViolations } from "./support/a11y";
import { expectType } from "./support/typography";

const near = (actual: number, expected: number) =>
  expect(Math.abs(actual - expected), `${actual} vs ${expected}`).toBeLessThanOrEqual(0.5);
test.use({ viewport: { width: 1470, height: 835 } });
test("field filter editors match measured rows, keyboard, sticky actions and accessibility", async ({
  page,
}, testInfo) => {
  // Two full-gallery accessibility scans and editor interactions need the same
  // wall-time budget as the gallery smoke test on the shared test machine.
  test.setTimeout(180_000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto("/dev/ui");
  const demo = page.getByRole("region", { name: "filter editors", exact: true });
  const panel = demo.getByRole("region", { name: "Field filter editors", exact: true });
  await panel.scrollIntoViewIfNeeded();
  await expect(panel).toBeVisible();
  const checkbox = panel.getByRole("checkbox", { name: "Sample text", exact: true });
  await expect(checkbox).toBeChecked();
  const box = panel
    .getByRole("listitem")
    .filter({ hasText: "Sample text" })
    .locator("span[aria-hidden='true']")
    .first();
  // list-views.md > Visual layout > Checked filter checkbox.
  await expect(box).toHaveCSS("width", "15px");
  await expect(box).toHaveCSS("height", "15px");
  await expect(box).toHaveCSS("background-color", "rgb(84, 100, 242)");
  await expect(box).toHaveCSS("border-width", "2px");
  await expect(box).toHaveCSS("border-radius", "2px");
  await expect(box.locator("svg")).toHaveCSS("color", "rgb(255, 255, 255)");
  const operator = panel.getByRole("button", { name: /Sample text operator$/ });
  const value = panel.getByRole("textbox", { name: "Sample text value" });
  const frame = value.locator("..");
  // Filter operator dropdown and Filter value input: 24 high, 1px border, 3px corners.
  for (const control of [operator, frame]) {
    await expect(control).toHaveCSS("height", "24px");
    await expect(control).toHaveCSS("border-width", "1px");
    await expect(control).toHaveCSS("border-color", "rgb(197, 196, 211)");
    await expect(control).toHaveCSS("border-radius", "3px");
    await expect(control).toHaveCSS("background-color", "rgb(255, 255, 255)");
    await expectType(page, control, "--text-sm", "--font-weight-normal");
  }
  await expect(operator).toHaveCSS("color", "rgb(49, 57, 73)");
  await expect(value).toHaveCSS("color", "rgb(49, 57, 73)");
  await expect(value).toHaveAttribute("placeholder", "Type here");
  expect(await value.evaluate((element) => getComputedStyle(element, "::placeholder").color)).toBe(
    "rgb(140, 145, 171)",
  );
  const b = await box.boundingBox();
  const o = await operator.boundingBox();
  const v = await frame.boundingBox();
  const s = await panel.getByRole("textbox", { name: "Search field filter choices" }).boundingBox();
  if (!b || !o || !v || !s) throw new Error("Missing filter geometry");
  // Filter operator dropdown: the observed text "contains" selector is 79px wide.
  near(o.width, 79);
  // Coordinate differences in the same four spec rows: 354→377, 527→535, 559→566, right edge 521.
  near(o.x - b.x, 23);
  near(o.y - (b.y + b.height), 8);
  near(v.y - (o.y + o.height), 7);
  near(v.width, 144);
  near(v.x + v.width, s.x + s.width);
  await operator.click();
  const list = page.getByRole("listbox", { name: /Sample text operator$/ });
  const popover = list.locator("..");
  // Open operator list: 146 wide, 220px maximum, rows 27, selected fill #F0F4FC.
  await expect(popover).toHaveCSS("width", "146px");
  await expect(popover).toHaveCSS("max-height", "220px");
  await expect(popover).toHaveCSS("background-color", "rgb(255, 255, 255)");
  const row = list.getByRole("option", { name: "contains", exact: true });
  await expect(row).toHaveCSS("height", "27px");
  await expect(row).toHaveCSS("background-color", "rgb(240, 244, 252)");
  await expect(row).toHaveCSS("color", "rgb(49, 57, 73)");
  await expectType(page, row, "--text-sm", "--font-weight-normal");
  const popup = await popover.boundingBox();
  const anchor = await operator.boundingBox();
  if (!popup || !anchor) throw new Error("Missing dropdown");
  near(popup.height, 220);
  near(popup.y - (anchor.y + anchor.height), 1);
  const measurementPath = testInfo.outputPath("field-filter-measurements.json");
  await writeFile(
    measurementPath,
    JSON.stringify({ checkbox: b, operator: o, value: v, search: s, popup, anchor }),
  );
  await testInfo.attach("field-filter-measurements", {
    path: measurementPath,
    contentType: "application/json",
  });
  await expect(list.getByRole("option")).toHaveText([
    "is",
    "isn't",
    "contains",
    "doesn't contain",
    "starts with",
    "ends with",
    "is empty",
    "is not empty",
  ]);
  // ADR 0003 §8: measured placeholder ink #8C91AB on white is 3.11:1.
  // Exclude only empty text spans (including the two multi-select placeholders)
  // and the other measured gallery placeholders; their triggers stay scanned.
  await expectNoA11yViolations(page, { exclude: DEV_UI_A11Y_EXCLUDE });
  const screenshotPath = testInfo.outputPath("field-filter-editors.png");
  await page.screenshot({ path: screenshotPath });
  await testInfo.attach("field-filter-editors", {
    path: screenshotPath,
    contentType: "image/png",
  });
  await page.keyboard.press("Home");
  await page.keyboard.press("Enter");
  const equality = await operator.boundingBox();
  if (!equality) throw new Error("Missing equality selector");
  near(equality.width, 36);
  await page.keyboard.press("Tab");
  await expect(value).toBeFocused();
  await page.keyboard.press("Escape");
  const footer = panel.getByRole("button", { name: "Apply Filter" });
  await expect(footer).toBeDisabled();
  const before = await footer.boundingBox();
  const scrollTop = await panel.locator(".filter-panel-content").evaluate((element) => {
    element.scrollTop = element.scrollHeight;
    return element.scrollTop;
  });
  expect(scrollTop).toBeGreaterThan(0);
  const after = await footer.boundingBox();
  if (!before || !after) throw new Error("Missing footer");
  near(after.y, before.y);
  await expect(footer).toBeVisible();
  await panel.getByRole("button", { name: "Clear" }).click();
  await expect(panel.getByRole("checkbox", { checked: true })).toHaveCount(0);
  await panel.getByText("Sample text", { exact: true }).click();
  await value.fill("sample");
  await panel.getByText("Sample boolean", { exact: true }).click();
  await expect(footer).toBeEnabled();
  await footer.click();
  await expect(demo.getByRole("status")).toContainText('"value":"sample"');
  await expect(demo.getByRole("status")).toContainText('"value":true');
  // The closed-popup scan includes the other gallery demos. Their empty-list
  // #8B9AB9 and empty-selection #8C91AB inks on white retain the measured
  // contrast exceptions from ADR 0003 §8, as in the gallery smoke test.
  // Only those text elements are excluded; filter triggers and selected values remain included.
  await expectNoA11yViolations(page, {
    exclude: DEV_UI_A11Y_EXCLUDE,
  });
  expect(errors).toEqual([]);
});

test("filter multi-select placeholders use measured ink until an option is selected", async ({
  page,
}, testInfo) => {
  await page.goto("/dev/ui");
  const demo = page.getByRole("region", { name: "filter editors", exact: true });
  const panel = demo.getByRole("region", { name: "Field filter editors", exact: true });
  const measurements = [];
  for (const [field, placeholder] of [
    ["picklist", "None"],
    ["ownerlookup", "Click to Select Users."],
  ] as const) {
    const trigger = panel.getByRole("button", { name: `Sample ${field} value`, exact: true });
    const label = trigger.locator("span");
    await trigger.scrollIntoViewIfNeeded();
    await expect(label).toHaveText(placeholder);
    await expect(trigger).toHaveAttribute("data-empty");
    // list-views.md > Visual layout > Filter value input: placeholder #8C91AB.
    await expect(label).toHaveCSS("color", "rgb(140, 145, 171)");
    await expect(label).toHaveAttribute("data-part", "empty-value");
    // The decorative arrow retains the normal control ink.
    await expect(trigger.locator("svg")).toHaveCSS("color", "rgb(49, 57, 73)");
    const emptyColor = await label.evaluate((element) => getComputedStyle(element).color);
    const screenshotPath = testInfo.outputPath(`filter-${field}-placeholder.png`);
    await page.screenshot({ path: screenshotPath });
    await testInfo.attach(`filter-${field}-placeholder`, {
      path: screenshotPath,
      contentType: "image/png",
    });
    await trigger.click();
    const option = page
      .getByRole("listbox", { name: `Sample ${field} value`, exact: true })
      .getByRole("option", { name: /^Sample One/ });
    await option.click();
    await page.keyboard.press("Escape");
    await expect(label).toHaveText("Sample One");
    await expect(trigger).not.toHaveAttribute("data-empty");
    await expect(label).not.toHaveAttribute("data-part", "empty-value");
    // Same spec row: completed selection text #313949.
    await expect(label).toHaveCSS("color", "rgb(49, 57, 73)");
    const selectedColor = await label.evaluate((element) => getComputedStyle(element).color);
    await trigger.click();
    await option.click();
    await page.keyboard.press("Escape");
    await expect(label).toHaveText(placeholder);
    await expect(label).toHaveCSS("color", "rgb(140, 145, 171)");
    measurements.push({ field, placeholder, emptyColor, selectedColor });
  }
  const measurementPath = testInfo.outputPath("filter-placeholder-colors.json");
  await writeFile(measurementPath, JSON.stringify(measurements, null, 2));
  await testInfo.attach("filter-placeholder-colors", {
    path: measurementPath,
    contentType: "application/json",
  });
});

test("observed value lists and currency range use measured dimensions", async ({ page }) => {
  await page.goto("/dev/ui");
  const demo = page.getByRole("region", { name: "filter editors", exact: true });
  const panel = demo.getByRole("region", { name: "Field filter editors", exact: true });
  await panel.getByRole("button", { name: "Clear", exact: true }).click();
  await panel.getByText("Sample boolean", { exact: true }).click();
  const state = panel.getByRole("button", { name: /Sample boolean value$/ });
  const stateBox = await state.boundingBox();
  if (!stateBox) throw new Error("Missing state");
  near(stateBox.width, 81);
  near(stateBox.height, 24);
  await state.click();
  const stateList = page.getByRole("listbox", { name: /Sample boolean value$/ });
  await expect(stateList.getByRole("option")).toHaveText(["Selected", "Not Selected"]);
  await stateList.getByRole("option", { name: "Not Selected", exact: true }).click();
  await panel.getByRole("button", { name: "Apply Filter" }).click();
  await expect(demo.getByRole("status")).toContainText('"value":false');
  await panel.getByRole("button", { name: "Clear", exact: true }).click();
  await panel.getByText("Sample picklist", { exact: true }).click();
  await panel.getByRole("button", { name: "Sample picklist value", exact: true }).click();
  const choices = page.locator(".filter-choice-popover");
  const choiceBox = await choices.boundingBox();
  if (!choiceBox) throw new Error("Missing choice list");
  near(choiceBox.width, 170);
  near(choiceBox.height, 220);
  await expect(choices.getByRole("option")).toHaveCount(16);
  const choice = await choices.getByRole("option").first().boundingBox();
  if (!choice) throw new Error("Missing choice row");
  near(choice.width, 158);
  near(choice.height, 28);
  await page.keyboard.press("Escape");
  await panel.getByRole("button", { name: "Clear", exact: true }).click();
  await panel.getByText("Sample ownerlookup", { exact: true }).click();
  await panel.getByRole("button", { name: "Sample ownerlookup value", exact: true }).click();
  const users = page.locator(".filter-user-popover");
  for (const [selector, width, height] of [
    [".filter-user-header .filter-operator-control", 77, 28],
    [".filter-user-search", 229, 28],
    [".filter-user-body", 327, 174],
    [".filter-user-body [role=option]", 315, 41],
  ] as const) {
    const box = await users.locator(selector).first().boundingBox();
    if (!box) throw new Error(`Missing ${selector}`);
    near(box.width, width);
    near(box.height, height);
  }
  await expect(users.getByText("Logged in User", { exact: true })).toBeVisible();
  await expect(users.getByText("two@example.test", { exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  await panel.getByRole("button", { name: "Clear", exact: true }).click();
  await panel.getByText("Sample currency", { exact: true }).click();
  await panel.getByRole("button", { name: /Sample currency operator$/ }).click();
  await page.getByRole("option", { name: "between", exact: true }).click();
  for (const bound of ["lower", "upper"]) {
    const box = await panel
      .getByRole("textbox", { name: `Sample currency ${bound} value` })
      .locator("..")
      .boundingBox();
    if (!box) throw new Error("Missing range");
    near(box.width, 100);
    near(box.height, 25);
  }
});
