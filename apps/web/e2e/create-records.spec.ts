import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { expect, type Locator, type Page } from "@playwright/test";
import { expectNoA11yViolations } from "./support/a11y";
import { signUpNewUser } from "./support/auth";
import { createOrganization } from "./support/org";
import { test } from "./support/test";
import { expectType, tokenValue } from "./support/typography";

// research/specs/record-detail.md, Layout → Visual layout → Global create menu: measured viewport.
const viewport = { width: 1470, height: 835 };
test.use({ viewport });

async function openCreateRecords(page: Page): Promise<Locator> {
  await page.getByRole("button", { name: "Create Records" }).click();
  const dialog = page.getByRole("dialog", { name: "Create Records" });
  await expect(dialog).toBeVisible();
  return dialog;
}

test.beforeEach(async ({ page }) => {
  await signUpNewUser(page);
  await createOrganization(page);
  // pending-announcement workaround
  await page.reload();
  await expect(page.getByRole("heading", { level: 1, name: "Home" })).toBeVisible();
});

test("the toolbar plus button opens the Create Records menu", async ({ page }) => {
  const trigger = page.getByRole("button", { name: "Create Records" });
  await expect(trigger).toBeVisible();
  const dialog = await openCreateRecords(page);
  // The reference opens with the search box focused.
  await expect(dialog.getByRole("textbox", { name: "Search" })).toBeFocused();
  await expect(dialog.getByRole("link", { name: "Lead" })).toHaveAttribute(
    "href",
    /\/tab\/Leads\/create$/,
  );
  await expectNoA11yViolations(page);

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();

  await trigger.click();
  await dialog.getByRole("link", { name: "Lead" }).click();
  await expect(dialog).toBeHidden();
  const slug = new URL(page.url()).pathname.split("/")[2] ?? "";
  await expect(page).toHaveURL(`/crm/${slug}/tab/Leads/create`);
  // MEP-145 delivers the Create Lead page; until it merges the route 404s inside the shell.
  await expect(
    page.getByRole("banner").getByRole("heading", { name: "Page not found" }),
  ).toBeVisible();
  await expectNoA11yViolations(page);
});

test("typing in the search box filters the module rows", async ({ page }) => {
  const dialog = await openCreateRecords(page);
  const search = dialog.getByRole("textbox", { name: "Search" });
  await search.fill("lea");
  await expect(dialog.getByRole("link", { name: "Lead" })).toBeVisible();
  await search.fill("zzz");
  await expect(dialog.getByRole("link")).toHaveCount(0);
  await search.fill("");
  await expect(dialog.getByRole("link", { name: "Lead" })).toBeVisible();
  await expectNoA11yViolations(page);
});

test("an outside click closes the menu", async ({ page }) => {
  const dialog = await openCreateRecords(page);
  // A modal popover covers the page, so the outside press lands on that cover.
  await page.mouse.click(700, 600);
  await expect(dialog).toBeHidden();
});

test("the open menu matches every measured Global create menu row", async ({ page }, testInfo) => {
  const trigger = page.getByRole("button", { name: "Create Records" });
  const triggerBox = await boxOf(trigger);

  // app-shell.md › Top bar/right controls: 28 × 28 box, 1 px #5464F2 edge, about 6 px radius.
  await expectBox(trigger, { width: 28, height: 28, y: 10.5 });
  await expect(trigger).toHaveCSS("border-width", "1px");
  await expect(trigger).toHaveCSS("border-color", "rgb(84, 100, 242)");
  await expect(trigger).toHaveCSS("border-radius", "6px");
  await expect(trigger).toHaveCSS("background-color", "rgb(240, 241, 255)");

  await openCreateRecords(page);
  // The measured panel box is the popover's outer border box, so it is read on that element.
  const panel = page.locator("div.create-records-panel");
  await expect(panel).toHaveCount(1);
  const header = panel.getByRole("heading", { name: "Create Records" });
  const search = panel.getByRole("textbox", { name: "Search" });
  const row = panel.getByRole("link", { name: "Lead" });
  const glyph = row.locator("svg");
  const label = row.locator("span");

  // Popover panel: 670 × 429, y 50–479, white, 1 px #CED0E1, 4 px bottom corners, anchored to the
  // trigger's right edge (spec: panel x 534–1204 under the quick-create box ending at x 1204).
  await expectBox(panel, {
    width: 670,
    height: 429,
    y: 50,
    right: triggerBox.x + triggerBox.width,
  });
  await expect(panel).toHaveCSS("background-color", "rgb(255, 255, 255)");
  await expect(panel).toHaveCSS("border-width", "1px");
  await expect(panel).toHaveCSS("border-color", "rgb(206, 208, 225)");
  await expect(panel).toHaveCSS("border-bottom-left-radius", "4px");
  await expect(panel).toHaveCSS("border-bottom-right-radius", "4px");
  await expect(panel).toHaveCSS("border-top-left-radius", "0px");

  // Left column header: ink starts 31.5 px inside the panel; ink band y 63.5–75 (13.5–25 inside).
  await expectInset(header, panel, { x: 31.5 });
  await expectInk(header, panel, { top: 13.5, bottom: 25 });
  await expect(header).toHaveCSS("color", "rgb(49, 57, 73)");
  await expectType(page, header, "--text-lg", "--font-weight-bold");

  // Search box: 287.5 × 30 at x 565–852.5, y 90–120; focused edge 1 px #5464F2.
  await expectInset(search, panel, { x: 31, y: 40, width: 287.5, height: 30 });
  await expect(search).toHaveCSS("border-width", "1px");
  await expect(search).toHaveCSS("border-color", "rgb(84, 100, 242)");
  await expectType(page, search, "--text-md", "--font-weight-normal");
  // Placeholder ink #8C91AB, candidate 14.5 px/400 → --text-md, --font-weight-normal.
  await expectPlaceholder(page, search);

  // Magnifier: ink x 576.5–590, y 98–111.5 (13.5 × 13.5), #313949.
  await expectInset(panel.locator(".create-records-search svg"), panel, {
    x: 42.5,
    y: 48,
    width: 13.5,
    height: 13.5,
  });

  // Module list: the row band starts at y 125 and repeats on the 34 px pitch.
  await expectInset(row, panel, { y: 75, height: 34 });
  // Glyph ink x 579.5–586.5, y 138.5–145.5 — the 7 × 7 box is the ink.
  await expectInset(glyph, panel, { x: 45.5, y: 88.5, width: 7, height: 7 });
  await expect(glyph).toHaveCSS("color", "rgb(49, 57, 73)");
  // Label: text starts x 599.5–600.5, ink #313949, cap top y 136.5, baseline y 147.
  await expectInset(label, panel, { x: 65.5 });
  await expectInk(label, panel, { top: 86.5, bottom: 97 });
  await expect(row).toHaveCSS("color", "rgb(49, 57, 73)");
  await expectType(page, row, "--text-md", "--font-weight-normal");
  await expectNoA11yViolations(page);

  // Review evidence only; no screenshot comparison or snapshot assertion.
  const evidenceDir = process.env.CREATE_RECORDS_EVIDENCE_DIR;
  if (evidenceDir) {
    await mkdir(evidenceDir, { recursive: true });
    const geometry = await panel.evaluate((node) => {
      const panelBox = node.getBoundingClientRect();
      // Colours and metrics the reviewer compares with the spec, read from the cascade.
      const picked = (style: CSSStyleDeclaration) => ({
        color: style.color,
        backgroundColor: style.backgroundColor,
        borderColor: style.borderColor,
        borderWidth: style.borderWidth,
        borderRadius: style.borderRadius,
        boxShadow: style.boxShadow,
        fontSize: style.fontSize,
        fontWeight: style.fontWeight,
        lineHeight: style.lineHeight,
      });
      const box = (target: Element) => {
        const rect = target.getBoundingClientRect();
        return {
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
          insetX: rect.x - panelBox.x,
          insetY: rect.y - panelBox.y,
          style: picked(getComputedStyle(target)),
        };
      };
      const header = node.querySelector("h2");
      const search = node.querySelector("input");
      const magnifier = node.querySelector("svg");
      const row = node.querySelector("a");
      const label = row?.querySelector("span");
      const glyph = row?.querySelector("svg");
      if (!header || !search || !magnifier || !row || !label || !glyph) {
        throw new Error("Missing a measured element in the create menu.");
      }
      return {
        panel: box(node),
        header: box(header),
        search: {
          ...box(search),
          placeholder: getComputedStyle(search, "::placeholder").color,
        },
        magnifier: box(magnifier),
        row: box(row),
        glyph: box(glyph),
        label: box(label),
      };
    });
    const report = {
      ...geometry,
      headerInk: await inkMetrics(header),
      labelInk: await inkMetrics(label),
    };
    await writeFile(join(evidenceDir, "create-records.json"), JSON.stringify(report, null, 2));
    await page.screenshot({ path: join(evidenceDir, "create-records.png") });
    await testInfo.attach("Create Records measurements", {
      body: JSON.stringify(report),
      contentType: "application/json",
    });
  }
});

/**
 * Visible ink band of a text element, from the metrics the browser used to lay it out. The spec
 * measures ink, not the DOM box, so headings and labels are compared through this.
 */
async function inkMetrics(
  target: Locator,
): Promise<{ top: number; bottom: number; width: number }> {
  return target.evaluate((node) => {
    const style = getComputedStyle(node);
    const size = Number.parseFloat(style.fontSize);
    const lineHeight =
      style.lineHeight === "normal" ? size * 1.2 : Number.parseFloat(style.lineHeight);
    const context = document.createElement("canvas").getContext("2d");
    if (!context) throw new Error("Canvas metrics are unavailable.");
    context.font = `${style.fontWeight} ${size}px ${style.fontFamily}`;
    const metrics = context.measureText(node.textContent ?? "");
    const rect = node.getBoundingClientRect();
    const baseline =
      rect.top +
      (lineHeight - (metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent)) / 2 +
      metrics.fontBoundingBoxAscent;
    return {
      top: baseline - metrics.actualBoundingBoxAscent,
      bottom: baseline + metrics.actualBoundingBoxDescent,
      width: metrics.actualBoundingBoxLeft + metrics.actualBoundingBoxRight,
    };
  });
}

type Measured = { x: number; y: number; width: number; height: number };

async function boxOf(locator: Locator): Promise<Measured> {
  const box = await locator.boundingBox();
  if (!box) throw new Error(`Expected a visible box for ${String(locator)}`);
  return { x: box.x, y: box.y, width: box.width, height: box.height };
}

/** Spec coordinates for the element's own box; ±1 px is the review threshold. */
async function expectBox(
  locator: Locator,
  expected: Partial<Measured & { right: number }>,
): Promise<void> {
  const box = await boxOf(locator);
  for (const [key, value] of Object.entries(expected) as [string, number][]) {
    const measured = key === "right" ? box.x + box.width : box[key as keyof Measured];
    expect(Math.abs(measured - value), `${key} ${measured} vs spec ${value}`).toBeLessThanOrEqual(
      1,
    );
  }
}

/**
 * Offsets inside the panel. The panel follows the trigger, and the top-bar controls that sit
 * between quick create and settings are later modules, so absolute x is not comparable yet.
 */
async function expectInset(
  target: Locator,
  panel: Locator,
  expected: Partial<Pick<Measured, "x" | "y" | "width" | "height">>,
): Promise<void> {
  const box = await boxOf(target);
  const origin = await boxOf(panel);
  for (const [key, value] of Object.entries(expected) as [string, number][]) {
    const measured =
      key === "x" ? box.x - origin.x : key === "y" ? box.y - origin.y : box[key as keyof Measured];
    expect(Math.abs(measured - value), `${key} ${measured} vs spec ${value}`).toBeLessThanOrEqual(
      1,
    );
  }
}

/** Ink band of a text element, as an offset from the panel top (spec ink minus y 50). */
async function expectInk(
  target: Locator,
  panel: Locator,
  expected: { top: number; bottom: number },
): Promise<void> {
  const [ink, origin] = await Promise.all([inkMetrics(target), boxOf(panel)]);
  expect(
    Math.abs(ink.top - (origin.y + expected.top)),
    `ink top ${ink.top} vs ${origin.y + expected.top}`,
  ).toBeLessThanOrEqual(1);
  expect(
    Math.abs(ink.bottom - (origin.y + expected.bottom)),
    `ink bottom ${ink.bottom} vs ${origin.y + expected.bottom}`,
  ).toBeLessThanOrEqual(1);
}

/** Placeholder ink #8C91AB at the regular body role (typography.md → --text-md / normal). */
async function expectPlaceholder(page: Page, target: Locator) {
  const style = await target.evaluate((node) => {
    const computed = getComputedStyle(node, "::placeholder");
    return {
      color: computed.color,
      fontSize: computed.fontSize,
      fontWeight: computed.fontWeight,
    };
  });
  expect(style.color, `placeholder colour ${style.color}`).toBe("rgb(140, 145, 171)");
  expect(style.fontSize, `placeholder size ${style.fontSize}`).toBe(
    await tokenValue(page, "font-size", "--text-md"),
  );
  expect(style.fontWeight, `placeholder weight ${style.fontWeight}`).toBe(
    await tokenValue(page, "font-weight", "--font-weight-normal"),
  );
}
