import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { expect, type Locator, test } from "@playwright/test";
import { expectNoA11yViolations } from "./support/a11y";
import { expectType } from "./support/typography";

// Expected geometry: record-detail.md › Visual layout › Status strip,
// Hidden-rail layout and Stage menu and terminal popover (including corrected pointer/divider).
test("status ribbon matches measured geometry at both rail widths", async ({ page }) => {
  await page.setViewportSize({ width: 1470, height: 835 });
  await page.goto("/dev/ui");
  await page.evaluate(() => document.fonts.ready);
  await page.keyboard.press("Escape");
  await page.keyboard.press("Escape");
  const demo = page.getByRole("region", { name: "status ribbon", exact: true });
  const report: Record<string, unknown> = {};
  async function box(label: string, target: Locator, width: number | null, height: number) {
    const bounds = await target.boundingBox();
    expect(bounds).not.toBeNull();
    expect(Math.abs((bounds?.height ?? 0) - height)).toBeLessThanOrEqual(1);
    if (width !== null) expect(Math.abs((bounds?.width ?? 0) - width)).toBeLessThanOrEqual(1);
    report[label] = bounds;
  }
  for (const [state, width, arrows] of [
    ["wide", 1126, 0],
    ["narrow", 906, 2],
  ] as const) {
    const example = demo.locator(`[data-status-demo="${state}"]`);
    const card = example.locator("[data-status-ribbon]");
    await card.evaluate((element) => element.scrollIntoView({ block: "center" }));
    await box(`${state}: Status strip card`, card, width, 68);
    await expect(card).toHaveCSS("border-radius", "8px");
    await expect(card).toHaveCSS("background-color", "rgb(255, 255, 255)");
    await expect(card).toHaveCSS("padding-left", "20px");
    await expect(card).toHaveCSS("padding-right", "20px");
    await box(`${state}: Status ribbon chevrons`, card.locator(".status-track"), null, 28);
    report[`${state}: individual stages`] = await card
      .locator(".status-stage")
      .evaluateAll((elements) =>
        elements.map((element) => ({
          label: element.textContent,
          width: element.getBoundingClientRect().width,
        })),
      );
    const band = card.locator(".status-chevron").first();
    await expect(band).toHaveCSS("background-color", "rgb(220, 219, 238)");
    const current = card.locator('[aria-current="step"]');
    await expect(current.locator(".status-chevron")).toHaveCSS(
      "background-color",
      "rgb(84, 100, 242)",
    );
    expect(
      await current
        .locator(".status-chevron")
        .evaluate((el) => getComputedStyle(el, "::after").backgroundColor),
    ).toBe("rgb(238, 239, 252)");
    await expect(current.getByRole("button")).toHaveCSS("color", "rgb(84, 100, 242)");
    await expectType(page, current, "--text-sm", "--font-weight-normal");
    const terminal = card.getByRole("button", { name: "Choose terminal stage" });
    await box(`${state}: Terminal control`, terminal, 52, 27);
    await expect(terminal).toHaveCSS("border-radius", "4px");
    await expect(terminal).toHaveCSS("border-width", "1px");
    await expect(terminal).toHaveCSS("border-color", "rgb(255, 173, 172)");
    await expect(terminal).toHaveCSS("background-color", "rgb(255, 236, 236)");
    await expect(terminal).toHaveCSS("color", "rgb(255, 93, 90)");
    await box(`${state}: Terminal icon`, terminal.locator("svg"), 28.5, 14);
    await expect(card.locator(".status-scroll")).toHaveCount(arrows);
    if (arrows) {
      await expect(card.getByRole("button", { name: "Scroll previous stages" })).toBeDisabled();
      await card.getByRole("button", { name: "Scroll next stages" }).click();
      await expect
        .poll(() => card.locator(".status-viewport").evaluate((el) => el.scrollLeft))
        .toBeGreaterThan(0);
      await expect(card.getByRole("button", { name: "Scroll previous stages" })).toBeEnabled();
    }
    await current.getByRole("button").click();
    const panel = page.locator(".picklist-stage");
    await box(`${state}: Stage dropdown panel`, panel, 207, 244);
    await expect(panel).toHaveCSS("border-color", "rgb(206, 208, 225)");
    await expect(panel).toHaveCSS("border-bottom-left-radius", "4px");
    await expect(panel).toHaveCSS("background-color", "rgb(255, 255, 255)");
    const search = panel.getByRole("textbox");
    await box(`${state}: Stage search input`, search, 205, 31);
    await expect(search).toBeFocused();
    await expectType(page, search, "--text-md", "--font-weight-normal");
    await expect(panel.locator(".picklist-magnifier")).toHaveCSS("color", "rgb(140, 145, 171)");
    await expect(search).toHaveCSS("border-bottom-width", "1px");
    await expect(search).toHaveCSS("border-bottom-color", "rgb(84, 100, 242)");
    const first = panel.getByRole("menuitemradio", { name: "-None-" });
    await first.hover();
    await box(`${state}: Stage option rows`, first, 193, 35);
    await expect(first).toHaveCSS("background-color", "rgb(240, 244, 252)");
    await expect(first).toHaveCSS("border-radius", "4px");
    await expect(first).toHaveCSS("color", "rgb(49, 57, 73)");
    await expectType(page, first, "--text-md", "--font-weight-normal");
    const check = panel.getByRole("menuitemradio", { name: "Lost Lead" }).locator("svg");
    await box(`${state}: Stage checkmark`, check, 10, 6.5);
    await expect(check).toHaveCSS("color", "rgb(51, 51, 51)");
    const panelBounds = await panel.boundingBox();
    const triggerBounds = await current.getByRole("button").boundingBox();
    expect(
      Math.abs((panelBounds?.y ?? 0) - ((triggerBounds?.y ?? 0) + (triggerBounds?.height ?? 0))),
    ).toBeLessThanOrEqual(1);
    if (process.env.STATUS_RIBBON_ARTIFACT_DIR && state === "wide") {
      await mkdir(process.env.STATUS_RIBBON_ARTIFACT_DIR, { recursive: true });
      await page.screenshot({
        path: join(process.env.STATUS_RIBBON_ARTIFACT_DIR, "status-stage-menu.png"),
      });
    }
    await page.keyboard.press("Escape");
    await expect(panel).toBeHidden();
    await terminal.click();
    const popover = page.locator(".picklist-terminal");
    await box(`${state}: Terminal popover`, popover, 215.5, 178);
    await expect(popover).toHaveCSS("border-width", "0px");
    await expect(popover).toHaveCSS("border-radius", "4px");
    await expect(popover).toHaveCSS("background-color", "rgb(255, 255, 255)");
    await box(`${state}: Terminal search input`, popover.getByRole("textbox"), 215.5, 30.5);
    await expect(popover.getByRole("textbox")).toBeFocused();
    await expect(popover.getByRole("textbox")).toHaveCSS(
      "border-bottom-color",
      "rgb(84, 100, 242)",
    );
    const pointer = popover.locator(".picklist-pointer");
    await box(`${state}: Upward pointer`, pointer, 17, 8.5);
    const pointerBounds = await pointer.boundingBox();
    const terminalBounds = await terminal.boundingBox();
    const popoverBounds = await popover.boundingBox();
    expect(
      Math.abs((pointerBounds?.x ?? 0) + 8.5 - ((terminalBounds?.x ?? 0) + 26)),
    ).toBeLessThanOrEqual(1);
    expect(
      Math.abs((popoverBounds?.x ?? 0) + 215.5 - ((terminalBounds?.x ?? 0) + 52)),
    ).toBeLessThanOrEqual(1);
    expect(
      Math.abs((popoverBounds?.y ?? 0) - ((terminalBounds?.y ?? 0) + 27) - 8.5),
    ).toBeLessThanOrEqual(1);
    await expect(pointer).toHaveCSS("background-color", "rgb(206, 208, 225)");
    expect(await pointer.evaluate((el) => getComputedStyle(el, "::after").backgroundColor)).toBe(
      "rgb(255, 255, 255)",
    );
    const headers = popover.locator(".picklist-heading");
    await expect(headers.first()).toHaveCSS("color", "rgb(32, 33, 35)");
    await expectType(page, headers.first(), "--text-md", "--font-weight-bold");
    await box(`${state}: Terminal group header`, headers.first(), 203.5, 29.5);
    await expect(headers.first()).toHaveCSS("padding-left", "4.5px");
    const terminalOption = popover.getByRole("menuitemradio").first();
    await box(`${state}: Terminal option`, terminalOption, 203.5, 29.5);
    await expect(terminalOption).toHaveCSS("color", "rgb(49, 57, 73)");
    await expectType(page, terminalOption, "--text-md", "--font-weight-normal");
    const firstHeaderBox = await headers.first().boundingBox();
    const secondHeaderBox = await headers.nth(1).boundingBox();
    expect(
      Math.abs((secondHeaderBox?.y ?? 0) - (firstHeaderBox?.y ?? 0) - 74.5),
    ).toBeLessThanOrEqual(1);
    await expect(popover.getByRole("menuitemradio").first()).toHaveCSS("padding-left", "25.5px");
    const divider = await popover
      .locator(".picklist-group")
      .first()
      .evaluate((el) => {
        const css = getComputedStyle(el, "::after");
        return { height: css.height, width: css.width, color: css.backgroundColor };
      });
    expect(divider).toEqual({ height: "1px", width: "203.5px", color: "rgb(206, 208, 225)" });
    report[`${state}: Terminal divider`] = divider;
    if (process.env.STATUS_RIBBON_ARTIFACT_DIR && state === "wide") {
      await mkdir(process.env.STATUS_RIBBON_ARTIFACT_DIR, { recursive: true });
      await page.screenshot({
        path: join(process.env.STATUS_RIBBON_ARTIFACT_DIR, "status-ribbon.png"),
      });
    }
    await page.keyboard.press("Escape");
  }
  if (process.env.STATUS_RIBBON_ARTIFACT_DIR)
    await writeFile(
      join(process.env.STATUS_RIBBON_ARTIFACT_DIR, "status-measurements.json"),
      JSON.stringify(report, null, 2),
    );
});

test("open menu examples mount on demand with valid labels and focused search", async ({
  page,
}) => {
  test.setTimeout(180_000);
  await page.goto("/dev/ui");
  const demo = page.getByRole("region", { name: "status ribbon", exact: true });
  await expect(page.locator(".picklist-popover")).toHaveCount(0);
  for (const [exampleLabel, label] of [
    ["Stage menu open", "Choose stage"],
    ["Terminal menu open", "Choose terminal stage"],
  ] as const) {
    await demo.getByRole("button", { name: exampleLabel, exact: true }).click();
    const dialog = page.getByRole("dialog", { name: label, exact: true });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("textbox")).toBeFocused();
    // Existing empty-list copy keeps its measured contrast; scan both open menus.
    await expectNoA11yViolations(page, { exclude: ["[data-part=empty]"] });
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
  }
});
