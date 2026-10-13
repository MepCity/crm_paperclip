import { expect, test } from "@playwright/test";

test("board supports successful and rejected native moves and horizontal scrolling", async ({
  page,
}) => {
  await page.goto("/dev/ui");
  const demo = page.locator("[data-board-demo]");
  await demo.scrollIntoViewIfNeeded();
  const card = demo.locator('[data-board-card="example"]');
  const first = demo.locator('[data-board-column="first"]');
  const second = demo.locator('[data-board-column="second"]');
  const rejected = demo.locator('[data-board-column="reject"]');
  await card.dragTo(second);
  await expect(second.locator("article")).toHaveCount(1);
  await expect(card).toHaveAttribute("draggable", "true");
  await card.dragTo(rejected);
  await expect(rejected.locator("article")).toHaveCount(1);
  await expect(second.locator("article")).toHaveCount(1);
  await expect(first.locator("article")).toHaveCount(0);
  const scroller = demo.locator("[data-board-scroll]");
  expect(await scroller.evaluate((element) => element.scrollWidth > element.clientWidth)).toBe(
    true,
  );
  await scroller.evaluate((element) => {
    element.scrollLeft = element.scrollWidth;
  });
  expect(await scroller.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
  await expect(demo.locator('[data-board-column="fourth"]')).toBeInViewport();
});
