import { expect, test } from "@playwright/test";
import { expectType } from "./support/typography";

// record-detail.md › Layout › Visual layout › Timeline
test("timeline history matches scoped Visual layout measurements", async ({ page }) => {
  await page.setViewportSize({ width: 1470, height: 835 });
  await page.goto("/dev/ui");
  const demo = page.getByRole("region", { name: "timeline history" });
  const open = demo.locator('[data-timeline-demo="filter-open"]');
  const surface = open.locator("[data-timeline-surface]");
  await expect(surface).toBeVisible();
  await expect(surface).toHaveCSS("width", "906px");
  await expect(surface).toHaveCSS("border-top-left-radius", "8px");
  await expect(surface).toHaveCSS("border-top-right-radius", "8px");

  const activeTab = open.getByRole("tab", { name: "History" });
  await expect(activeTab).toHaveCSS("color", "rgb(49, 57, 73)");
  await expectType(page, activeTab, "--text-lg", "--font-weight-semibold");
  const underline = await activeTab.evaluate(
    (element) => getComputedStyle(element, "::after").backgroundColor,
  );
  expect(underline).toBe("rgb(84, 100, 242)");

  const filterButton = open.getByRole("button", { name: "History filter" });
  await expect(filterButton).toHaveCSS("height", "32px");
  await expect(filterButton).toHaveCSS("border-top-width", "1px");
  await expect(filterButton).toHaveCSS("border-top-color", "rgb(197, 196, 211)");
  await expect(filterButton).toHaveCSS("background-color", "rgb(237, 240, 249)");

  const panel = open.locator("[data-timeline-filter-panel]");
  await expect(panel).toBeVisible();
  await expect(panel).toHaveCSS("background-color", "rgb(249, 250, 255)");
  await expect(panel).toHaveCSS("border-top-width", "1px");
  await expect(panel).toHaveCSS("border-top-color", "rgb(220, 219, 238)");
  for (const side of ["left", "right"]) {
    await expect(panel).toHaveCSS(`padding-${side}`, "16px");
  }

  const modules = open.getByRole("button", { name: "Modules" });
  await expect(modules).toHaveCSS("width", "250px");
  await expect(modules).toHaveCSS("height", "34px");
  await expect(modules).toHaveCSS("border-top-width", "1px");
  await expect(modules).toHaveCSS("border-top-color", "rgb(197, 196, 211)");

  const apply = open.getByRole("button", { name: "Apply Filter" });
  await expect(apply).toHaveCSS("background-color", "rgb(173, 179, 238)");

  const icon = open.locator(".timeline-event-icon").first();
  await expect(icon).toHaveCSS("width", "36px");
  await expect(icon).toHaveCSS("height", "36px");

  const dateBadge = open.locator(".timeline-event-date-badge").first();
  await expectType(page, dateBadge, "--text-sm", "--font-weight-semibold");
  await expect(dateBadge).toHaveCSS("color", "rgb(97, 110, 136)");

  const time = open.locator(".timeline-event-time").first();
  await expectType(page, time, "--text-sm", "--font-weight-normal");
  await expect(time).toHaveCSS("color", "rgb(97, 110, 136)");

  const byline = open.locator(".timeline-event-byline").first();
  await expectType(page, byline, "--text-sm", "--font-weight-normal");
  await expect(byline).toHaveCSS("color", "rgb(97, 110, 136)");

  const title = open.locator(".timeline-event-title").first();
  await expectType(page, title, "--text-md", "--font-weight-normal");
  await expect(title).toHaveCSS("color", "rgb(49, 57, 73)");
});
