import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { expect, type Locator, type Page, test } from "@playwright/test";

/** Computed value of a token applied to a temporary element. */
async function tokenValue(page: Page, property: "font-size" | "font-weight", token: string) {
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
  const pill = chrome.locator("[data-view-pill]");
  await box("selected pill", pill, 75.5, 26);
  await expect(pill).toHaveCSS("border-radius", "6px");
  await expect(pill).toHaveCSS("background-color", "rgb(240, 244, 252)");
  await expect(pill).toHaveCSS("font-size", await tokenValue(page, "font-size", "--text-13"));
  await expect(pill).toHaveCSS(
    "font-weight",
    await tokenValue(page, "font-weight", "--font-weight-semibold"),
  );
  // Toolbar; Selected / disabled; Text roles.
  await box("toolbar", chrome.locator("[data-list-toolbar]"), null, 47);
  const filter = chrome.getByRole("button", { name: "Filter", exact: true });
  await box("Filter", filter, 69.5, 27);
  await expect(filter).toHaveCSS("background-color", "rgb(237, 240, 249)");
  await expect(filter).toHaveCSS("font-size", await tokenValue(page, "font-size", "--text-sm"));
  await expect(filter).toHaveCSS(
    "font-weight",
    await tokenValue(page, "font-weight", "--font-weight-medium"),
  );
  await expect(filter).toHaveCSS("color", "rgb(49, 57, 73)");
  const list = chrome.getByRole("img", { name: "List presentation" });
  await box("presentation", list, 26, 26);
  await expect(list).toHaveCSS("background-color", "rgb(240, 241, 255)");
  await expect(list).toHaveCSS("color", "rgb(84, 100, 242)");
  await box("Filter icon", filter.locator("svg"), 16, 16);
  await box(
    "Refresh icon",
    chrome.getByRole("button", { name: "Refresh Custom View" }).locator("svg"),
    16,
    16,
  );
  // Create and action buttons.
  const split = chrome.locator("[data-split-button]");
  const primary = chrome.getByRole("button", { name: "Create Lead" });
  const more = chrome.getByRole("button", { name: "More" });
  const actions = chrome.getByRole("button", { name: "Actions" });
  await box("split", split, 137.5, 33);
  await box("primary", primary, 102.5, 33);
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
  const cancel = page.getByRole("button", { name: "Cancel" });
  const apply = page.getByRole("button", { name: "Apply" });
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
  await expect(page.getByRole("button", { name: "Apply" })).toBeEnabled();
  await page.getByRole("button", { name: "Cancel" }).click();
  await expect(popover).toHaveCount(0);
  await trigger.click();
  await expect(field).toContainText("None");
  await field.click();
  await page.getByRole("option", { name: "Company", exact: true }).click();
  await page.getByRole("button", { name: "Apply" }).click();
  await expect(demo.getByRole("status")).toContainText("Company: asc");
});
