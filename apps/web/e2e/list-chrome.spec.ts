import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { expect, type Locator, test } from "@playwright/test";

import { expectType } from "./support/typography";

// All expected metrics cite research/specs/list-views.md › Layout › Visual layout.
test("list chrome matches the measured tab, toolbar and button rows", async ({ page }) => {
  await page.goto("/dev/ui");
  const demo = page.getByRole("region", { name: "list chrome" });
  const chrome = demo.locator('[data-list-demo="with-menus"]');
  const measured: Record<string, unknown> = {};
  async function box(label: string, target: Locator, width: number | null, height: number) {
    const bounds = await target.boundingBox();
    expect(bounds).not.toBeNull();
    expect(Math.abs((bounds?.height ?? 0) - height)).toBeLessThanOrEqual(1);
    if (width !== null) expect(Math.abs((bounds?.width ?? 0) - width)).toBeLessThanOrEqual(1);
    measured[label] = bounds;
  }
  // Header and tab strip; Text roles.
  await box("tab strip", chrome.locator("[data-view-tab-strip]"), null, 42);
  // list-views.md › Tab strip bottom rule: a 1 px #DCDBEE divider beneath the strip.
  const tabStrip = chrome.locator("[data-view-tab-strip]");
  await expect(tabStrip).toHaveCSS("border-bottom-width", "1px");
  await expect(tabStrip).toHaveCSS("border-bottom-color", "rgb(220, 219, 238)");
  await expect(tabStrip).toHaveCSS("box-sizing", "border-box");
  const pill = chrome.locator("[data-view-pill]");
  await box("selected pill", pill, 75.5, 26);
  await expect(pill).toHaveCSS("border-radius", "6px");
  await expect(pill).toHaveCSS("background-color", "rgb(240, 244, 252)");
  await expectType(page, pill, "--text-sm", "--font-weight-bold");
  // Toolbar; Selected / disabled; Text roles.
  await box("toolbar", chrome.locator("[data-list-toolbar]"), null, 47);
  const filter = chrome.getByRole("button", { name: "Filter", exact: true });
  await box("Filter", filter, 69.5, 27);
  await expect(filter).toHaveCSS("background-color", "rgb(237, 240, 249)");
  await expectType(page, filter, "--text-md", "--font-weight-semibold");
  await expectType(
    page,
    chrome.getByRole("button", { name: "Sort", exact: true }),
    "--text-md",
    "--font-weight-semibold",
  );
  await expect(filter).toHaveCSS("color", "rgb(49, 57, 73)");
  // list-views.md › Filter toggle, panel open: border none, 3.5–4 px radius, funnel ink
  // #000000 at 15 × 16 px. The demo toolbar renders the pressed (panel-open) toggle.
  await expect(filter).toHaveCSS("border-top-width", "0px");
  await expect(filter).toHaveCSS("border-radius", "3.5px");
  // The single presentation span is replaced by the measured switcher.
  const switcher = chrome.locator("[data-view-type-switcher]");
  const list = chrome.getByRole("button", { name: "List presentation" });
  await box("presentation", list, 26, 26);
  await expect(list).toHaveCSS("background-color", "rgb(240, 241, 255)");
  await expect(list).toHaveCSS("color", "rgb(84, 100, 242)");
  await expect(list).toHaveCSS("border-radius", "3.5px");
  await box("Filter icon", filter.locator("svg"), 15, 16);
  await expect(filter.locator("svg")).toHaveCSS("color", "rgb(0, 0, 0)");
  await box(
    "Refresh icon",
    chrome.getByRole("button", { name: "Refresh Custom View" }).locator("svg"),
    16,
    16,
  );
  // list-views.md › View type switcher: 6 type tiles plus the overflow control, 26 × 26 boxes
  // on a 6 px gap, the active list tile pressed, every other control aria-disabled with the
  // muted glyph colour. Each glyph's svg box is its measured ink box.
  const tiles = switcher.locator("button");
  await expect(tiles).toHaveCount(7);
  for (let i = 0; i < 7; i += 1) {
    const b = await tiles.nth(i).boundingBox();
    if (!b) throw new Error(`Missing view-type tile ${i} box.`);
    expect(Math.abs(b.width - 26)).toBeLessThanOrEqual(0.5);
    expect(Math.abs(b.height - 26)).toBeLessThanOrEqual(0.5);
  }
  for (let i = 1; i < 7; i += 1) {
    const prev = await tiles.nth(i - 1).boundingBox();
    const cur = await tiles.nth(i).boundingBox();
    if (!prev || !cur) throw new Error("Missing tile box for gap.");
    const gap = cur.x - (prev.x + prev.width);
    expect(Math.abs(gap - 6)).toBeLessThanOrEqual(0.5);
  }
  await expect(list).toHaveAttribute("aria-pressed", "true");
  const inkBoxes: [string, number, number][] = [
    ["Split presentation", 16, 16],
    ["Grid presentation", 16, 16],
    ["Chart presentation", 15, 15],
    ["Connected presentation", 17, 13],
    ["Cards presentation", 16, 15.5],
    ["More presentations", 11, 6.5],
  ];
  for (const [name, w, h] of inkBoxes) {
    const svg = chrome.getByRole("button", { name }).locator("svg");
    const b = await svg.boundingBox();
    if (!b) throw new Error(`Missing ${name} svg ink box.`);
    expect(Math.abs(b.width - w), `${name} ink width`).toBeLessThanOrEqual(0.5);
    expect(Math.abs(b.height - h), `${name} ink height`).toBeLessThanOrEqual(0.5);
  }
  for (const name of ["Grid presentation", "More presentations"]) {
    await expect(chrome.getByRole("button", { name })).toHaveAttribute("aria-disabled", "true");
  }
  await expect(chrome.getByRole("button", { name: "Grid presentation" })).toHaveCSS(
    "color",
    "rgb(97, 110, 136)",
  );
  // Create and action buttons.
  const split = chrome.locator("[data-split-button]");
  const primary = chrome.getByRole("button", { name: "Create Lead" });
  const more = chrome.getByRole("button", { name: "More" });
  const actions = chrome.getByRole("button", { name: "Actions" });
  await box("split", split, 137.5, 33);
  await box("primary", primary, 102.5, 33);
  await expectType(page, primary, "--text-md", "--font-weight-semibold");
  await box("More", more, 34, 33);
  await expect(primary).toHaveCSS("border-top-left-radius", "6px");
  await expect(more).toHaveCSS("border-top-right-radius", "6px");
  await expect(primary).toHaveCSS("color", "rgb(255, 255, 255)");
  await expect(primary).toHaveCSS("background-image", /rgb\(87, 103, 246\).*rgb\(21, 78, 197\)/);
  await expect(more).toHaveCSS("background-image", /rgb\(87, 103, 246\).*rgb\(21, 78, 197\)/);
  const divider = chrome.locator("[data-split-divider]");
  await expect(divider).toHaveCSS("width", "1px");
  await expect(divider).toHaveCSS("background-color", "rgb(195, 200, 244)");
  await box("Actions", actions, 44, 32);
  await expect(actions).toHaveCSS("border-radius", "6px");
  await expect(actions).toHaveCSS("border-width", "1px");
  await expect(actions).toHaveCSS("border-color", "rgb(213, 216, 233)");
  await expect(actions).toHaveCSS("background-image", /rgb\(254, 254, 254\).*rgb\(242, 241, 248\)/);
  const splitBounds = await split.boundingBox();
  const actionBounds = await actions.boundingBox();
  const gap = (actionBounds?.x ?? 0) - ((splitBounds?.x ?? 0) + (splitBounds?.width ?? 0));
  expect(gap).toBe(8.5);
  measured.gap = gap;
  const without = demo.locator('[data-list-demo="without-menus"]');
  await expect(without.getByRole("button", { name: "More" })).toHaveCount(0);
  await expect(without.getByRole("button", { name: "Actions" })).toHaveCount(0);
  await expect(without.getByRole("button", { name: "Filter", exact: true })).toHaveAttribute(
    "aria-pressed",
    "false",
  );
  await filter.click();
  await expect(filter).toHaveAttribute("aria-pressed", "false");
  await filter.click();
  // Create More / Actions menus.
  for (const [trigger, width, label] of [
    [more, 180, "More menu"],
    [actions, 200, "Actions menu"],
  ] as const) {
    await trigger.focus();
    await page.keyboard.press("ArrowDown");
    const menu = page.getByRole("menu");
    const popover = page.locator('[data-rac][data-trigger="MenuTrigger"]');
    await expect(menu).toBeVisible();
    await expect(popover).toHaveCSS("width", `${width}px`);
    await expect(popover).toHaveCSS("border-radius", "6px");
    await expect(popover).toHaveCSS("background-color", "rgb(255, 255, 255)");
    measured[label] = await popover.boundingBox();
    await page.keyboard.press("Escape");
    await expect(menu).toHaveCount(0);
    await expect(trigger).toBeFocused();
  }
  if (process.env.LIST_CHROME_ARTIFACT_DIR) {
    await mkdir(process.env.LIST_CHROME_ARTIFACT_DIR, { recursive: true });
    await pill.click();
    await page.mouse.move(0, 0);
    await chrome.screenshot({
      path: join(process.env.LIST_CHROME_ARTIFACT_DIR, "list-chrome.png"),
    });
    await writeFile(
      join(process.env.LIST_CHROME_ARTIFACT_DIR, "measurements.json"),
      JSON.stringify(measured, null, 2),
    );
  }
});

test("Sort popover matches its measured size and supports Apply and Cancel", async ({ page }) => {
  await page.goto("/dev/ui");
  const demo = page.getByRole("region", { name: "list chrome" });
  const trigger = demo
    .locator('[data-list-demo="sort"]')
    .getByRole("button", { name: "Sort", exact: true });
  await trigger.click();
  const popover = page.locator(".record-sort-popover");
  await expect(popover).toHaveCSS("width", "385px");
  await expect(popover).toHaveCSS("height", "157px");
  await expect(popover).toHaveCSS("border-top-width", "1px");
  await expect(popover).toHaveCSS("border-top-color", "rgb(206, 208, 225)");
  const field = page.getByRole("button", { name: /Sort By/ });
  const order = page.getByRole("button", { name: /Order/ });
  for (const select of [field, order]) {
    await expect(select).toHaveCSS("width", "150px");
    await expect(select).toHaveCSS("height", "28px");
  }
  await expect(field).toContainText("None");
  await expect(order).toContainText("Ascending");
  const popoverBox = await popover.boundingBox();
  const fieldBox = await field.boundingBox();
  const orderBox = await order.boundingBox();
  expect(popoverBox).not.toBeNull();
  expect(fieldBox).not.toBeNull();
  expect(orderBox).not.toBeNull();
  expect(Math.abs((fieldBox?.x ?? 0) - (popoverBox?.x ?? 0) - 31)).toBeLessThanOrEqual(1);
  expect(Math.abs((fieldBox?.y ?? 0) - (popoverBox?.y ?? 0) - 57)).toBeLessThanOrEqual(1);
  expect(Math.abs((orderBox?.y ?? 0) - (popoverBox?.y ?? 0) - 57)).toBeLessThanOrEqual(1);
  const selectorGap = (orderBox?.x ?? 0) - ((fieldBox?.x ?? 0) + (fieldBox?.width ?? 0));
  expect(Math.abs(selectorGap - 15)).toBeLessThanOrEqual(1);
  expect(Math.abs((fieldBox?.y ?? 0) - (orderBox?.y ?? 0))).toBeLessThanOrEqual(1);
  const orderLabel = popover.getByText("Order", { exact: true });
  await expect(orderLabel).toHaveClass(/sr-only/);
  await expect(orderLabel).toHaveCSS("position", "absolute");
  await expect(orderLabel).toHaveCSS("width", "1px");
  await expect(orderLabel).toHaveCSS("height", "1px");
  const sortByLabel = popover.getByText("Sort By", { exact: true });
  await expect(sortByLabel).not.toHaveClass(/sr-only/);
  const labelBox = await sortByLabel.boundingBox();
  expect(Math.abs((labelBox?.x ?? 0) - (fieldBox?.x ?? 0))).toBeLessThanOrEqual(1);
  const cancel = popover.getByRole("button", { name: "Cancel" });
  const apply = popover.getByRole("button", { name: "Apply", exact: true });
  const cancelBox = await cancel.boundingBox();
  const applyBox = await apply.boundingBox();
  expect(cancelBox).not.toBeNull();
  expect(applyBox).not.toBeNull();
  expect(Math.abs((cancelBox?.height ?? 0) - 27)).toBeLessThanOrEqual(1);
  expect(Math.abs((applyBox?.height ?? 0) - 27)).toBeLessThanOrEqual(1);
  const selectorBottom = (fieldBox?.y ?? 0) + (fieldBox?.height ?? 0);
  expect(Math.abs((cancelBox?.y ?? 0) - selectorBottom - 20)).toBeLessThanOrEqual(1);
  expect(Math.abs((applyBox?.y ?? 0) - selectorBottom - 20)).toBeLessThanOrEqual(1);
  expect(Math.abs((cancelBox?.width ?? 0) - 66.5)).toBeLessThanOrEqual(1);
  expect(Math.abs((applyBox?.width ?? 0) - 60)).toBeLessThanOrEqual(1);
  const buttonGap = (applyBox?.x ?? 0) - ((cancelBox?.x ?? 0) + (cancelBox?.width ?? 0));
  expect(Math.abs(buttonGap - 8)).toBeLessThanOrEqual(1);
  const orderRight = (orderBox?.x ?? 0) + (orderBox?.width ?? 0);
  const applyRight = (applyBox?.x ?? 0) + (applyBox?.width ?? 0);
  const outerRight = (popoverBox?.x ?? 0) + (popoverBox?.width ?? 0);
  expect(Math.abs(applyRight - orderRight)).toBeLessThanOrEqual(1);
  expect(Math.abs(outerRight - applyRight - 39)).toBeLessThanOrEqual(1);
  await expect(cancel).toHaveCSS("border-top-width", "1px");
  await expect(cancel).toHaveCSS("border-top-color", "rgb(213, 216, 233)");
  await expect(cancel).toHaveCSS("background-image", /rgb\(254, 254, 254\).*rgb\(242, 241, 248\)/);
  await expect(apply).toBeDisabled();
  await expect(apply).toHaveCSS("background-color", "rgb(173, 179, 238)");
  await expect(apply).toHaveCSS("opacity", "1");
  await expect(apply).toHaveCSS("color", "rgb(255, 255, 255)");
  await expect(apply).toHaveCSS("background-image", "none");
  if (process.env.LIST_CHROME_ARTIFACT_DIR)
    await popover.screenshot({ path: join(process.env.LIST_CHROME_ARTIFACT_DIR, "list-sort.png") });
  await field.click();
  await page.getByRole("option", { name: "Company", exact: true }).click();
  await expect(apply).toBeEnabled();
  await cancel.click();
  await expect(popover).toHaveCount(0);
  await trigger.click();
  await expect(field).toContainText("None");
  await field.click();
  await page.getByRole("option", { name: "Company", exact: true }).click();
  await apply.click();
  await expect(demo.getByRole("status")).toContainText("Company: asc");
});
