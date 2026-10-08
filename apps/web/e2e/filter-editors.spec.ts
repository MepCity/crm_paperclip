import { writeFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";
import { expectNoA11yViolations } from "./support/a11y";
import { expectType } from "./support/typography";

const near = (actual: number, expected: number) =>
  expect(Math.abs(actual - expected), `${actual} vs ${expected}`).toBeLessThanOrEqual(1);
test.use({ viewport: { width: 1470, height: 835 } });
test("field filter editors match measured rows, keyboard, sticky actions and accessibility", async ({
  page,
}, testInfo) => {
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
  await expectNoA11yViolations(page);
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
  await expectNoA11yViolations(page);
  expect(errors).toEqual([]);
});
