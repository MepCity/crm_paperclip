import { expect, test } from "@playwright/test";
import { expectNoA11yViolations } from "./support/a11y";

test("filter panel matches the scoped Visual layout measurements", async ({ page }, testInfo) => {
  await page.goto("/dev/ui");
  const demo = page.getByRole("region", { name: "filter panel", exact: true });
  const panel = demo.getByRole("region", { name: "Filter Leads by" });
  await expect(panel).toBeVisible();
  // list-views.md > Visual layout > Filter panel: 202 px including 1 px borders,
  // white surface, 6 px corners, 18 px horizontal inner padding.
  await expect(panel).toHaveCSS("width", "202px");
  await expect(panel).toHaveCSS("box-sizing", "border-box");
  expect((await panel.boundingBox())?.width).toBe(202);
  await expect(panel).toHaveCSS("background-color", "rgb(255, 255, 255)");
  await expect(panel).toHaveCSS("border-radius", "6px");
  for (const side of ["left", "right", "top", "bottom"]) {
    await expect(panel).toHaveCSS(`border-${side}-width`, "1px");
    // Surface and line colors: panel outline #DCDBEE.
    await expect(panel).toHaveCSS(`border-${side}-color`, "rgb(220, 219, 238)");
  }
  for (const side of ["left", "right"]) await expect(panel).toHaveCSS(`padding-${side}`, "18px");

  // Filter content: title about 15 px semibold; search field about 34 px high.
  const heading = panel.getByRole("heading", { name: "Filter Leads by" });
  await expect(heading).toHaveCSS("font-size", "15px");
  await expect(heading).toHaveCSS("font-weight", "600");
  const search = panel.getByRole("textbox", { name: "Search filter choices" });
  await expect(search).toHaveAttribute("placeholder", "Search");
  await expect(search).toHaveCSS("height", "34px");
  // Surface and line colors: search outline about 1 px #C5C4D3.
  await expect(search).toHaveCSS("border-top-width", "1px");
  await expect(search).toHaveCSS("border-top-color", "rgb(197, 196, 211)");
  // Text roles: placeholder #8C91AB.
  expect(await search.evaluate((element) => getComputedStyle(element, "::placeholder").color)).toBe(
    "rgb(140, 145, 171)",
  );

  const triggers = panel.getByRole("button");
  for (const trigger of await triggers.all()) {
    // Filter content: group headings about 14 px semibold, downward arrow when open.
    await expect(trigger).toHaveCSS("font-size", "14px");
    await expect(trigger).toHaveCSS("font-weight", "600");
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await expect(trigger.locator("svg")).toBeVisible();
  }
  const clippedLabel = panel
    .getByRole("button", { name: "System Defined Filters" })
    .locator("span");
  await expect(clippedLabel).toHaveCSS("text-overflow", "ellipsis");
  expect(await clippedLabel.evaluate((element) => element.scrollWidth > element.clientWidth)).toBe(
    true,
  );
  for (const row of await panel.getByRole("listitem").all()) {
    // Filter content: checkbox rows about 30 px high with 14 px text.
    await expect(row).toHaveCSS("height", "30px");
    await expect(row.getByText(/samples|Sample/)).toHaveCSS("font-size", "14px");
    const box = row.locator('span[aria-hidden="true"]');
    // Selected / disabled: unselected boxes 15 × 15, 2 px #C5C4D3, 2–3 px corners.
    await expect(box).toHaveCSS("width", "15px");
    await expect(box).toHaveCSS("height", "15px");
    await expect(box).toHaveCSS("border-top-width", "2px");
    await expect(box).toHaveCSS("border-top-color", "rgb(197, 196, 211)");
    await expect(box).toHaveCSS("border-radius", "2px");
  }
  await expectNoA11yViolations(page);
  await demo.screenshot({
    path: process.env.PAPERCLIP_RUN_SCRATCH_DIR
      ? `${process.env.PAPERCLIP_RUN_SCRATCH_DIR}/filter-panel-demo.png`
      : testInfo.outputPath("filter-panel-demo.png"),
  });
});

test("filter demo exposes closed, searched, selected and disabled states", async ({ page }) => {
  await page.goto("/dev/ui");
  const demo = page.getByRole("region", { name: "filter panel", exact: true });
  const system = demo.getByRole("button", { name: "System Defined Filters" });
  await system.focus();
  await page.keyboard.press("Enter");
  await expect(system).toHaveAttribute("aria-expanded", "false");
  await expect(demo.getByRole("checkbox", { name: "Recent samples" })).toBeHidden();
  await page.keyboard.press("Space");
  await expect(system).toHaveAttribute("aria-expanded", "true");
  const disabled = demo.getByRole("checkbox", { name: "Archived samples" });
  await expect(disabled).toBeDisabled();
  const recent = demo.getByRole("checkbox", { name: "Recent samples" });
  await demo.getByText("Recent samples", { exact: true }).click();
  await expect(recent).toBeChecked();
  await expect(demo.getByRole("status")).toHaveText("Selected: recent");
  // Selected appearance was not measured: preserve the primitive's prior 16 px / 1 px style.
  const checkedBox = demo.getByRole("listitem").first().locator('span[aria-hidden="true"]');
  await expect(checkedBox).toHaveCSS("width", "16px");
  await expect(checkedBox).toHaveCSS("border-top-width", "1px");
  const search = demo.getByRole("textbox", { name: "Search filter choices" });
  await search.fill("CoD");
  await expect(demo.getByRole("checkbox")).toHaveCount(1);
  await expect(demo.getByRole("checkbox", { name: "Sample code" })).toBeVisible();
  await expect(system).toBeHidden();
  await expect(demo.getByRole("button", { name: "Filter By Related Modules" })).toBeHidden();
  await search.fill("no-match");
  await expect(demo.getByRole("checkbox")).toHaveCount(0);
  await search.clear();
  await expect(recent).toBeChecked();
});
