import { expect, type Locator, test } from "@playwright/test";
import { expectType } from "./support/typography";

// record-detail.md › Layout › Visual layout › Timeline
test.use({ viewport: { width: 1470, height: 835 } });

function px(value: string) {
  return Number.parseFloat(value);
}

async function surfaceOffset(surface: Locator, target: Locator) {
  const origin = await surface.boundingBox();
  const box = await target.boundingBox();
  expect(origin).not.toBeNull();
  expect(box).not.toBeNull();
  return {
    x: (box?.x ?? 0) - (origin?.x ?? 0),
    y: (box?.y ?? 0) - (origin?.y ?? 0),
    width: box?.width ?? 0,
    height: box?.height ?? 0,
  };
}

async function colorVar(page: import("@playwright/test").Page, token: string) {
  return page.evaluate((name) => {
    const probe = document.createElement("div");
    probe.style.backgroundColor = `var(${name})`;
    document.body.append(probe);
    const value = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return value;
  }, token);
}

test("timeline history matches scoped Visual layout measurements", async ({ page }) => {
  await page.goto("/dev/ui");
  const demo = page.getByRole("region", { name: "timeline history" });
  const open = demo.locator('[data-timeline-demo="filter-open"]');
  const surface = open.locator("[data-timeline-surface]");
  await expect(surface).toBeVisible();

  const surfaceWidth = await page.evaluate(() => {
    const probe = document.createElement("div");
    probe.style.width = "var(--size-detail-timeline-width)";
    document.body.append(probe);
    const value = getComputedStyle(probe).width;
    probe.remove();
    return value;
  });
  await expect(surface).toHaveCSS("width", surfaceWidth);
  await expect(surface).toHaveCSS("border-top-left-radius", "8px");
  await expect(surface).toHaveCSS("border-top-right-radius", "8px");

  const subtabList = open.locator(".timeline-subtab-list");
  const subtabBox = await surfaceOffset(surface, subtabList);
  expect(Math.abs(subtabBox.height - 38.5)).toBeLessThanOrEqual(1);
  const subtabBorder = await subtabList.evaluate(
    (element) => getComputedStyle(element).borderBottomColor,
  );
  expect(subtabBorder).toBe(await colorVar(page, "--color-panel-border"));

  const activeTab = open.getByRole("tab", { name: "History" });
  await expect(activeTab).toHaveCSS("color", await colorVar(page, "--color-text-strong"));
  await expectType(page, activeTab, "--text-lg", "--font-weight-semibold");
  const tabBox = await surfaceOffset(surface, activeTab);
  expect(Math.abs(tabBox.x - 30)).toBeLessThanOrEqual(1);
  const underlineHeight = await activeTab.evaluate(
    (element) => getComputedStyle(element, "::after").height,
  );
  expect(px(underlineHeight)).toBeCloseTo(3, 0);
  const underline = await activeTab.evaluate(
    (element) => getComputedStyle(element, "::after").backgroundColor,
  );
  expect(underline).toBe(await colorVar(page, "--color-primary"));

  const filterButton = open.getByRole("button", { name: "History filter" });
  const filterBox = await surfaceOffset(surface, filterButton);
  expect(Math.abs(filterBox.height - 30)).toBeLessThanOrEqual(1);
  expect(Math.abs(filterBox.width - 42)).toBeLessThanOrEqual(1);
  expect(Math.abs(filterBox.y - 63.5)).toBeLessThanOrEqual(1);
  await expect(filterButton).toHaveCSS("border-top-width", "1px");
  await expect(filterButton).toHaveCSS("border-top-color", "rgb(197, 196, 211)");
  await expect(filterButton).toHaveCSS("background-color", "rgb(237, 240, 249)");

  const panel = open.locator("[data-timeline-filter-panel]");
  await expect(panel).toBeVisible();
  const panelBox = await surfaceOffset(surface, panel);
  expect(Math.abs(panelBox.y - (filterBox.y + filterBox.height + 15))).toBeLessThanOrEqual(1);
  expect(Math.abs(panelBox.height - 156)).toBeLessThanOrEqual(1);
  await expect(panel).toHaveCSS("background-color", "rgb(249, 250, 255)");
  await expect(panel).toHaveCSS("border-top-width", "1px");
  await expect(panel).toHaveCSS("border-top-color", "rgb(220, 219, 238)");
  await expect(panel).toHaveCSS("padding-left", "20px");

  const modules = open.getByRole("button", { name: "Modules" });
  const modulesBox = await surfaceOffset(surface, modules);
  expect(Math.abs(modulesBox.x - 46)).toBeLessThanOrEqual(1);
  expect(Math.abs(modulesBox.y - panelBox.y - 38)).toBeLessThanOrEqual(1);
  await expect(modules).toHaveCSS("width", "250px");
  await expect(modules).toHaveCSS("height", "34px");
  await expect(modules).toHaveCSS("color", await colorVar(page, "--color-text-empty"));

  const users = open.getByRole("button", { name: "Users" });
  const usersBox = await surfaceOffset(surface, users);
  expect(Math.abs(usersBox.x - (modulesBox.x + modulesBox.width + 8))).toBeLessThanOrEqual(1);
  await expect(users).toHaveCSS("color", await colorVar(page, "--color-text-placeholder"));

  const time = open.getByRole("button", { name: "Time" });
  await expect(time).toHaveCSS("color", await colorVar(page, "--color-text"));

  const sources = open.getByRole("button", { name: "Sources" });
  const sourcesBox = await surfaceOffset(surface, sources);
  expect(Math.abs(sourcesBox.y - panelBox.y - 74)).toBeLessThanOrEqual(1);

  const apply = open.getByRole("button", { name: "Apply Filter" });
  const applyBox = await surfaceOffset(surface, apply);
  expect(Math.abs(applyBox.height - 32)).toBeLessThanOrEqual(1);
  expect(Math.abs(applyBox.x - (sourcesBox.x + sourcesBox.width + 8))).toBeLessThanOrEqual(1);
  await expect(apply).toHaveCSS("background-color", "rgb(173, 179, 238)");

  const dateBadge = open.locator(".timeline-event-date-badge").first();
  const badgeBox = await surfaceOffset(surface, dateBadge);
  expect(Math.abs(badgeBox.width - 130)).toBeLessThanOrEqual(1);
  expect(Math.abs(badgeBox.height - 27)).toBeLessThanOrEqual(1);
  expect(Math.abs(badgeBox.x - 25)).toBeLessThanOrEqual(1);
  await expect(dateBadge).toHaveCSS("background-color", "rgb(249, 250, 255)");
  await expect(dateBadge).toHaveCSS("border-top-width", "1px");
  await expect(dateBadge).toHaveCSS(
    "border-top-color",
    await colorVar(page, "--color-detail-timeline-muted-border"),
  );
  await expectType(page, dateBadge, "--text-sm", "--font-weight-normal");
  await expect(dateBadge).toHaveCSS(
    "color",
    await colorVar(page, "--color-detail-timeline-badge-text"),
  );

  const connector = open.locator(".timeline-event-connector").first();
  const connectorBox = await surfaceOffset(surface, connector);
  expect(Math.abs(connectorBox.width - 1)).toBeLessThanOrEqual(1);
  expect(Math.abs(connectorBox.height - 25)).toBeLessThanOrEqual(1);
  expect(Math.abs(connectorBox.x + connectorBox.width / 2 - 125.5)).toBeLessThanOrEqual(1);
  await expect(connector).toHaveCSS(
    "background-color",
    await colorVar(page, "--color-detail-timeline-muted-border"),
  );

  const icon = open.locator(".timeline-event-icon").first();
  const iconBox = await surfaceOffset(surface, icon);
  expect(Math.abs(iconBox.width - 36)).toBeLessThanOrEqual(1);
  expect(Math.abs(iconBox.height - 36)).toBeLessThanOrEqual(1);
  expect(Math.abs(iconBox.x - 108)).toBeLessThanOrEqual(1);
  await expect(icon).toHaveCSS("background-color", "rgb(249, 250, 255)");
  await expect(icon).toHaveCSS(
    "border-top-color",
    await colorVar(page, "--color-detail-timeline-muted-border"),
  );

  const eventTime = open.locator(".timeline-event-time").first();
  const timeBox = await surfaceOffset(surface, eventTime);
  expect(Math.abs(timeBox.x + timeBox.width - (iconBox.x - 9.5))).toBeLessThanOrEqual(1);
  expect(
    Math.abs(timeBox.y + timeBox.height / 2 - (iconBox.y + iconBox.height / 2)),
  ).toBeLessThanOrEqual(1);
  const timeLines = await eventTime.evaluate(
    (element) => element.scrollHeight <= element.clientHeight + 1,
  );
  expect(timeLines).toBe(true);
  await expectType(page, eventTime, "--text-sm", "--font-weight-normal");
  await expect(eventTime).toHaveCSS("color", await colorVar(page, "--color-text-muted"));

  const title = open.locator(".timeline-event-title").first();
  const titleBox = await surfaceOffset(surface, title);
  expect(Math.abs(titleBox.x - 161.5)).toBeLessThanOrEqual(1);
  // Figtree line box vs cap height on the title role can differ by a few px from the icon center.
  expect(
    Math.abs(titleBox.y + titleBox.height / 2 - (iconBox.y + iconBox.height / 2)),
  ).toBeLessThanOrEqual(5);
  await expectType(page, title, "--text-md", "--font-weight-normal");
  await expect(title).toHaveCSS("color", await colorVar(page, "--color-text"));

  const byline = open.locator(".timeline-event-byline").first();
  const bylineBox = await surfaceOffset(surface, byline);
  expect(Math.abs(bylineBox.y - (titleBox.y + titleBox.height))).toBeLessThanOrEqual(1);
  await expectType(page, byline, "--text-sm", "--font-weight-normal");
  await expect(byline).toHaveCSS("color", await colorVar(page, "--color-text-muted"));
});
