import { expect, type Page, test } from "@playwright/test";
import { DEV_UI_A11Y_EXCLUDE, expectNoA11yViolations } from "./support/a11y";

/** Resolved custom property, so typography expectations follow the token. */
async function computedToken(
  page: Page,
  property: "font-size" | "font-weight",
  token: "--text-md" | "--text-sm" | "--font-weight-semibold",
): Promise<string> {
  return page.evaluate(
    ({ property, token }) => {
      const probe = document.createElement("span");
      probe.style.setProperty(property, `var(${token})`);
      document.body.append(probe);
      const value = getComputedStyle(probe).getPropertyValue(property);
      probe.remove();
      return value;
    },
    { property, token },
  );
}

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

  // Filter content: title about 15 px semibold maps to --text-md / --font-weight-semibold.
  const heading = panel.getByRole("heading", { name: "Filter Leads by" });
  const titleSize = await computedToken(page, "font-size", "--text-md");
  const semibold = await computedToken(page, "font-weight", "--font-weight-semibold");
  const bodySize = await computedToken(page, "font-size", "--text-sm");
  await expect(heading).toHaveCSS("font-size", titleSize);
  await expect(heading).toHaveCSS("font-weight", semibold);
  await expect(heading).toHaveCSS("color", "rgb(49, 57, 73)");
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
  // Filter content: placeholder text starts 32 px inside the outer left edge (1 px border + padding).
  const textStart = await search.evaluate((element) => {
    const style = getComputedStyle(element);
    return Number.parseFloat(style.borderLeftWidth) + Number.parseFloat(style.paddingLeft);
  });
  expect(Math.abs(textStart - 31)).toBeLessThanOrEqual(1);
  const magnifier = search.locator("..").locator("svg");
  await expect(magnifier).toBeVisible();
  await expect(magnifier).toHaveAttribute("aria-hidden", "true");
  await expect(magnifier).toHaveCSS("width", "13.5px");
  await expect(magnifier).toHaveCSS("height", "13.5px");
  await expect(magnifier).toHaveCSS("color", "rgb(49, 57, 73)");
  expect(await magnifier.locator("title").count()).toBe(0);
  const magnifierInset = await search.evaluate((element) => {
    const icon = element.parentElement?.querySelector("svg");
    const field = element.getBoundingClientRect();
    const glyph = icon?.getBoundingClientRect();
    return {
      left: glyph ? glyph.left - field.left : Number.NaN,
      vertical: glyph ? glyph.top + glyph.height / 2 - (field.top + field.height / 2) : Number.NaN,
    };
  });
  expect(Math.abs(magnifierInset.left - 11.5)).toBeLessThanOrEqual(1);
  expect(Math.abs(magnifierInset.vertical)).toBeLessThanOrEqual(1);

  const triggers = panel.getByRole("button");
  for (const trigger of await triggers.all()) {
    // Filter content: group headings about 14 px semibold #202123 via --text-sm / --font-weight-semibold.
    await expect(trigger).toHaveCSS("font-size", bodySize);
    await expect(trigger).toHaveCSS("font-weight", semibold);
    await expect(trigger).toHaveCSS("color", "rgb(32, 33, 35)");
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    const arrow = trigger.locator("svg");
    await expect(arrow).toBeVisible();
    await expect(arrow).toHaveAttribute("aria-hidden", "true");
    await expect(arrow).toHaveCSS("width", "8px");
    await expect(arrow).toHaveCSS("height", "4.5px");
    expect(await arrow.locator("title").count()).toBe(0);
    expect(
      await trigger.evaluate((element) => {
        const icon = element.querySelector("svg");
        const label = element.querySelector("span");
        if (!icon || !label) return false;
        const position = icon.compareDocumentPosition(label);
        return (position & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;
      }),
    ).toBe(true);
  }
  const clippedLabel = panel
    .getByRole("button", { name: "System Defined Filters" })
    .locator("span");
  // Figtree fits this label, so the reference clip is a letter-width deviation.
  // The heading still ellipsizes when the text is wider than the row.
  await expect(clippedLabel).toHaveCSS("text-overflow", "ellipsis");
  await expect(clippedLabel).toHaveCSS("overflow-x", "hidden");
  await expect(clippedLabel).toHaveCSS("white-space", "nowrap");
  const headingText = panel.getByRole("button", { name: "Filter By Fields" }).locator("span");
  await expect(headingText).toHaveCSS("padding-left", "17.5px");
  const longLabel = "Sample related records action";
  const checkboxTop = async (rowText: string) =>
    panel
      .getByRole("listitem")
      .filter({ hasText: rowText })
      .evaluate((element) => {
        const box = element.querySelector('span[aria-hidden="true"]');
        if (!box) return Number.NaN;
        return box.getBoundingClientRect().top - element.getBoundingClientRect().top;
      });
  for (const row of await panel.getByRole("listitem").all()) {
    const name = (await row.innerText()).replace(/\s+/g, " ").trim();
    const box = row.locator('span[aria-hidden="true"]');
    if (name === longLabel) {
      // Filter content: a label that does not fit wraps; two lines are 44 px with 16 px line spacing.
      await expect(row).toHaveCSS("height", "44px");
      await expect(row.getByText(longLabel)).toHaveCSS("line-height", "16px");
    } else {
      // Filter content: one-line checkbox rows stay about 30 px; text role is --text-sm.
      await expect(row).toHaveCSS("height", "30px");
      await expect(row.getByText(/samples|Sample/)).toHaveCSS("font-size", bodySize);
    }
    // Selected / disabled: unselected boxes 15 × 15, 2 px #C5C4D3, 2–3 px corners.
    await expect(box).toHaveCSS("width", "15px");
    await expect(box).toHaveCSS("height", "15px");
    await expect(box).toHaveCSS("border-top-width", "2px");
    await expect(box).toHaveCSS("border-top-color", "rgb(197, 196, 211)");
    await expect(box).toHaveCSS("border-radius", "2px");
  }
  const oneLineOffset = await checkboxTop("Recent samples");
  const twoLineOffset = await checkboxTop(longLabel);
  expect(Math.abs(oneLineOffset - 7)).toBeLessThanOrEqual(1);
  expect(Math.abs(twoLineOffset - oneLineOffset)).toBeLessThanOrEqual(1);
  // Empty-list copy from the sibling record-table demo on /dev/ui is the measured #8B9AB9 on white (2.83:1).
  await expectNoA11yViolations(page, { exclude: [...DEV_UI_A11Y_EXCLUDE] });
  await demo.screenshot({ path: testInfo.outputPath("filter-panel-demo.png") });
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
  const checkedBox = demo
    .getByRole("listitem")
    .filter({ hasText: "Recent samples" })
    .locator('span[aria-hidden="true"]');
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
