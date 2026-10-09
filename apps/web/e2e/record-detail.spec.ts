import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { expect, type Locator, test } from "@playwright/test";
import { expectWithin, svgPathGeometrySize, svgStrokeInclusiveInkSize } from "./support/geometry";
import { expectType } from "./support/typography";

// Binding geometry/color expectations: record-detail.md > Layout > Visual layout.
// Typography: typography.md > List and detail text roles (CTO token mapping).
async function bounds(target: Locator) {
  const value = await target.boundingBox();
  if (!value) throw new Error("Expected visible geometry");
  return value;
}

test.use({ viewport: { width: 1470, height: 835 } });

test("record frame matches the header, rail, tab and grouped-menu measurements", async ({
  page,
}) => {
  await page.goto("/dev/ui");
  const demo = page.getByRole("region", { name: "record detail" });
  const frame = demo.locator('[data-record-demo="frame"]');
  await frame.scrollIntoViewIfNeeded();
  const measurements: Record<string, unknown> = {};
  async function metric(label: string, target: Locator, width: number | null, height: number) {
    const box = await target.boundingBox();
    expect(box).not.toBeNull();
    expect(Math.abs((box?.height ?? 0) - height), label).toBeLessThanOrEqual(1);
    if (width !== null) expect(Math.abs((box?.width ?? 0) - width), label).toBeLessThanOrEqual(1);
    measurements[label] = box;
    if (!box) throw new Error("Expected visible geometry");
    return box;
  }
  // Record header: y 50–123; 1px DCDBEE; portrait 48 square; title ink 313949.
  const header = frame.locator("[data-record-header]");
  await metric("Record header", header, null, 73);
  await expect(header).toHaveCSS("border-bottom-width", "1px");
  await expect(header).toHaveCSS("border-bottom-color", "rgb(220, 219, 238)");
  await expect(header).toHaveCSS("background-color", "rgb(255, 255, 255)");
  const portrait = frame.locator("[data-record-portrait]");
  const portraitBox = await metric("Portrait", portrait, 48, 48);
  const headerBox = await bounds(header);
  expect(portraitBox.x - headerBox.x).toBe(52);
  const title = header.getByRole("heading", { level: 1 });
  const titleBox = await bounds(title);
  expect(titleBox.x - portraitBox.x - portraitBox.width).toBe(15);
  // record-detail.md > Record page > Record header: portrait corners ~6 px.
  await expect(portrait).toHaveCSS("border-radius", "6px");
  const titleName = title.locator("span").first();
  const titleHyphen = title.locator("span").nth(1);
  const titleCompany = title.locator("span").nth(2);
  await expect(titleName).toHaveCSS("color", "rgb(49, 57, 73)");
  // record-detail.md > Record page > Record header: title name/company weight and separator gaps.
  await expectType(page, titleName, "--text-2xl", "--font-weight-bold");
  await expectType(page, titleCompany, "--text-md", "--font-weight-normal");
  const nameBox = await bounds(titleName);
  const hyphenBox = await bounds(titleHyphen);
  const companyBox = await bounds(titleCompany);
  expect(Math.abs(hyphenBox.x - nameBox.x - nameBox.width - 6.5)).toBeLessThanOrEqual(1);
  expect(Math.abs(companyBox.x - hyphenBox.x - hyphenBox.width - 6)).toBeLessThanOrEqual(1);
  // record-detail.md > Record page > Record header: Back shaft arrow ink ~16 × 13.5 px.
  const backIcon = header.getByRole("link", { name: "Back" }).locator("svg");
  const backIconBox = await bounds(backIcon);
  expectWithin(backIconBox.width, 16, 1.5, "Back icon viewport width");
  expectWithin(backIconBox.height, 13.5, 1.5, "Back icon viewport height");
  const backGeom = await svgPathGeometrySize(backIcon);
  const backInk = await svgStrokeInclusiveInkSize(backIcon);
  expectWithin(backGeom.width, 14.5, 1.5, "Back path geometry width");
  expectWithin(backGeom.height, 12, 1.5, "Back path geometry height");
  expectWithin(backInk.width, 16, 1.5, "Back stroke-inclusive ink width");
  expectWithin(backInk.height, 13.5, 1.5, "Back stroke-inclusive ink height");
  // Header buttons: 32 high, radius6; detail-specific primary/secondary gradients.
  const primary = header.getByRole("button", { name: "Primary action" });
  const secondary = header.getByRole("button", { name: "Edit", exact: true });
  const more = header.getByRole("button", { name: "More Options" });
  for (const button of [primary, secondary, more]) {
    await metric(
      (await button.getAttribute("aria-label")) ?? (await button.innerText()),
      button,
      null,
      32,
    );
    await expect(button).toHaveCSS("border-radius", "6px");
  }
  await expect(primary).toHaveCSS("background-image", /rgb\(87, 103, 246\).*rgb\(19, 77, 196\)/);
  await expect(primary).toHaveCSS("color", "rgb(255, 255, 255)");
  await expectType(page, primary, "--text-md", "--font-weight-semibold");
  for (const button of [secondary, more]) {
    await expect(button).toHaveCSS(
      "background-image",
      /rgb\(253, 253, 254\).*rgb\(241, 240, 247\)/,
    );
    await expect(button).toHaveCSS("border-width", "1px");
    await expect(button).toHaveCSS("border-color", "rgb(213, 216, 233)");
    await expect(button).toHaveCSS("color", "rgb(49, 57, 73)");
  }
  await expectType(page, secondary, "--text-md", "--font-weight-normal");
  await expect(header.getByRole("button", { name: "Previous Record" })).toHaveCSS(
    "color",
    "rgb(173, 176, 182)",
  );
  await expect(header.getByRole("button", { name: "Previous Record" })).toHaveCSS("opacity", "1");
  const nextRecord = header.getByRole("link", { name: "Next Record" });
  await expect(nextRecord).toHaveCSS("color", "rgb(49, 57, 73)");
  // record-detail.md > Record page > Record header: Next chevron centred from header right edge.
  const nextBox = await bounds(nextRecord);
  expectWithin(
    headerBox.x + headerBox.width - (nextBox.x + nextBox.width / 2),
    36,
    1,
    "Next control centre inset from header right",
  );
  for (const nav of [header.getByRole("button", { name: "Previous Record" }), nextRecord]) {
    await metric("Record nav control", nav, 24, 24);
    const navSvg = nav.locator("svg");
    const navIconBox = await bounds(navSvg);
    // record-detail.md > Record page > Record header: Previous / Next chevron ink 7 × 13 px.
    expectWithin(navIconBox.width, 24, 1, "Record nav icon viewport width");
    expectWithin(navIconBox.height, 24, 1, "Record nav icon viewport height");
    const navGeom = await svgPathGeometrySize(navSvg);
    const navInk = await svgStrokeInclusiveInkSize(navSvg);
    expectWithin(navGeom.width, 7, 1.5, "Record nav chevron path geometry width");
    expectWithin(navGeom.height, 13, 1.5, "Record nav chevron path geometry height");
    expectWithin(navInk.width, 8.5, 1.5, "Record nav chevron stroke-inclusive ink width");
    expectWithin(navInk.height, 14.5, 1.5, "Record nav chevron stroke-inclusive ink height");
    measurements[`${await nav.getAttribute("aria-label")} icon box`] = navIconBox;
    measurements[`${await nav.getAttribute("aria-label")} icon geometry`] = navGeom;
    measurements[`${await nav.getAttribute("aria-label")} icon ink`] = navInk;
  }
  // Related-list rail:220 width; pitch32; selected height30, fillEDF0F9; inset12/8.5.
  const rail = frame.locator("[data-record-rail]");
  await expect(rail).toHaveCSS("width", "220px");
  await expect(rail).toHaveCSS("background-color", "rgb(255, 255, 255)");
  const heading = rail.getByRole("heading");
  await expectType(page, heading, "--text-lg", "--font-weight-bold");
  const selected = rail.getByRole("link", { name: "Example Section 1" });
  const rowBox = await metric("Selected rail row", selected, 196, 30);
  const railBox = await bounds(rail);
  expect(rowBox.x - railBox.x).toBe(12);
  expect(rowBox.y - railBox.y).toBe(38);
  await expect(selected).toHaveCSS("padding-left", "8.5px");
  await expect(selected).toHaveCSS("background-color", "rgb(237, 240, 249)");
  await expect(selected).toHaveAttribute("aria-current", "page");
  await expectType(page, selected, "--text-md", "--font-weight-normal");
  const second = await bounds(rail.getByRole("link", { name: "Example Section 2" }));
  expect(second.y - rowBox.y).toBe(32);
  // Canvas/tab row:canvasEEF1F9; inset12; reserved36 slot; selected108x29.
  const tabs = frame.getByRole("tablist", { name: "Record views" });
  await metric("Tab pill", tabs, 222.5, 37);
  await expect(tabs).toHaveCSS("border-width", "1px");
  await expect(tabs).toHaveCSS("border-color", "rgb(220, 219, 238)");
  const active = frame.getByRole("tab", { name: "Overview" });
  await metric("Selected tab", active, 108, 29);
  await expect(active).toHaveCSS("background-color", "rgb(235, 237, 255)");
  await expect(active).toHaveCSS("border-width", "1px");
  await expect(active).toHaveCSS("border-color", "rgb(163, 172, 255)");
  await expect(active).toHaveCSS("color", "rgb(32, 33, 35)");
  await expectType(page, active, "--text-lg", "--font-weight-semibold");
  await expectType(
    page,
    frame.getByRole("tab", { name: "Timeline" }),
    "--text-lg",
    "--font-weight-normal",
  );
  const tabRow = frame.locator("[data-record-tab-row]");
  await metric("Tab row", tabRow, null, 62);
  await expect(tabRow.locator("..")).toHaveCSS("background-color", "rgb(238, 241, 249)");
  await expect(tabRow).toHaveCSS("padding-left", "12px");
  await expect(tabRow).toHaveCSS("padding-top", "14px");
  const railToggle = frame.getByRole("button", { name: "Hide Related List" });
  await metric("Rail toggle button (rail shown)", railToggle, 36, 36);
  await expect(railToggle).toHaveAttribute("aria-pressed", "true");
  await expect(railToggle).toHaveCSS("background-color", "rgb(223, 228, 239)");
  const toggleBox = await bounds(railToggle);
  const tabListBox = await bounds(tabs);
  expect(tabListBox.x - toggleBox.x - toggleBox.width).toBe(12);
  const scroller = frame.locator("[data-record-scroller]");
  await expect(scroller).toHaveCSS("padding-left", "12px");
  await expect(scroller).toHaveCSS("padding-right", "12px");
  const cards = frame.locator("article");
  const firstCard = await bounds(cards.nth(0));
  const secondCard = await bounds(cards.nth(1));
  expect(secondCard.y - firstCard.y - firstCard.height).toBe(12);
  // More Options Popover:217width,4radius,CED0E1; Rows:30pitch,F0F4FC,insets6/17.
  await more.focus();
  await page.keyboard.press("ArrowDown");
  const menu = page.getByRole("menu", { name: "More Options" });
  const popover = menu.locator("..");
  const moreBox = await bounds(more);
  const popBoxOpen = await bounds(popover);
  // record-detail.md > More Options menu > Popover: top flush with ellipsis, right edges align.
  expectWithin(popBoxOpen.y - (moreBox.y + moreBox.height), 0, 1, "Menu popover vertical gap");
  expectWithin(
    popBoxOpen.x + popBoxOpen.width - (moreBox.x + moreBox.width),
    0,
    1,
    "Menu popover right edge delta",
  );
  await expect(popover).toHaveCSS("width", "217px");
  await expect(popover).toHaveCSS("border-radius", "4px");
  await expect(popover).toHaveCSS("border-width", "1px");
  await expect(popover).toHaveCSS("border-color", "rgb(206, 208, 225)");
  await expect(popover).toHaveCSS("background-color", "rgb(255, 255, 255)");
  const item = menu.getByRole("menuitem", { name: "Example One" });
  const itemBox = await metric("Highlighted menu row", item, 203.5, 30);
  const popBox = await bounds(popover);
  expect(Math.abs(itemBox.x - popBox.x - 6.5)).toBeLessThanOrEqual(1);
  expect(itemBox.y - popBox.y).toBe(6);
  await expect(item).toHaveCSS("background-color", "rgb(240, 244, 252)");
  await expect(item).toHaveCSS("padding-left", "10.25px");
  // record-detail.md > More Options menu > Rows and groups: highlighted row ~5 px corners.
  await expect(item).toHaveCSS("border-radius", "5px");
  await expectType(page, item, "--text-md", "--font-weight-normal");
  const item2 = await bounds(menu.getByRole("menuitem", { name: "Example Two" }));
  expect(item2.y - itemBox.y).toBe(30);
  const separator = menu.getByRole("separator");
  const separatorBox = await bounds(separator);
  // record-detail.md > More Options menu > Rows and groups: group rule same width as row.
  expectWithin(separatorBox.width, itemBox.width, 1, "Menu divider width vs row");
  expectWithin(separatorBox.x, itemBox.x, 1, "Menu divider x vs row");
  await expect(separator).toHaveCSS("height", "1px");
  await expect(separator).toHaveCSS("background-color", "rgb(206, 208, 225)");
  await expect(separator).toHaveCSS("margin-top", "5px");
  await expect(separator).toHaveCSS("margin-bottom", "5px");
  await page.keyboard.press("Escape");
  await expect(more).toBeFocused();
  // Header/tab remain still while content moves; related selection scrolls its card.
  const beforeHeader = await header.boundingBox();
  const beforeTabs = await tabRow.boundingBox();
  await expect(frame.getByRole("button", { name: "Scroll To Top" })).toHaveCount(0);
  await scroller.evaluate((element) => {
    element.scrollTop = 250;
  });
  const toTop = frame.getByRole("button", { name: "Scroll To Top" });
  await expect(toTop).toBeVisible();
  expect(await header.boundingBox()).toEqual(beforeHeader);
  expect(await tabRow.boundingBox()).toEqual(beforeTabs);
  const afterCard = await bounds(cards.nth(0));
  expect(firstCard.y - afterCard.y).toBe(250);
  await toTop.click();
  await expect.poll(() => scroller.evaluate((element) => element.scrollTop)).toBe(0);
  await rail.getByRole("link", { name: "Example Section 2" }).click();
  await expect(rail.getByRole("link", { name: "Example Section 2" })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await expect
    .poll(async () => {
      const card = await bounds(cards.nth(1));
      const area = await bounds(scroller);
      return Math.abs(card.y - area.y);
    })
    .toBeLessThanOrEqual(1);
  await frame.getByRole("button", { name: "Scroll To Top" }).click();
  // All four navigation states; absent command/menu states; empty rail.
  for (const state of ["neither", "previous", "next", "both"]) {
    const example = demo.locator(`[data-record-demo="${state}"]`);
    await expect(example.getByRole("button", { name: "More Options" })).toHaveCount(0);
    for (const [name, enabled] of [
      ["Previous Record", state === "previous" || state === "both"],
      ["Next Record", state === "next" || state === "both"],
    ] as const) {
      if (enabled)
        await expect(example.getByRole("link", { name })).toHaveAttribute("href", /record=/);
      else await expect(example.getByRole("button", { name })).toBeDisabled();
    }
  }
  await expectType(
    page,
    demo.locator('[data-record-demo="both"]').getByRole("link", { name: "Edit", exact: true }),
    "--text-md",
    "--font-weight-normal",
  );
  const empty = demo.locator('[data-record-demo="empty-rail"]');
  await expect(empty.getByRole("navigation").getByRole("link")).toHaveCount(0);
  await expect(empty.getByRole("heading", { name: "Empty Related List" })).toBeVisible();
  if (process.env.RECORD_DETAIL_ARTIFACT_DIR) {
    await mkdir(process.env.RECORD_DETAIL_ARTIFACT_DIR, { recursive: true });
    await frame.scrollIntoViewIfNeeded();
    await rail.getByRole("link", { name: "Example Section 1" }).click();
    await page.mouse.move(0, 0);
    await frame.screenshot({
      path: join(process.env.RECORD_DETAIL_ARTIFACT_DIR, "record-frame.png"),
    });
    await more.focus();
    await page.keyboard.press("ArrowDown");
    await popover.screenshot({
      path: join(process.env.RECORD_DETAIL_ARTIFACT_DIR, "record-menu.png"),
    });
    await writeFile(
      join(process.env.RECORD_DETAIL_ARTIFACT_DIR, "measurements.json"),
      JSON.stringify(measurements, null, 2),
    );
  }
});
