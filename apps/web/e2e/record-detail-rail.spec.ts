import { expect, test } from "./support/test";

const PREF_KEY = "crm:pref:dev-ui:dev-ui:record-detail.rail-visible";

test.use({ viewport: { width: 1470, height: 835 } });
test.describe.configure({ mode: "serial" });

test.beforeEach(async ({ page }) => {
  await page.goto("/dev/ui");
  await page.evaluate((key) => localStorage.removeItem(key), PREF_KEY);
});

async function bounds(target: import("@playwright/test").Locator) {
  const value = await target.boundingBox();
  if (!value) throw new Error("Expected visible geometry");
  return value;
}

test("hidden-rail layout matches Visual layout measurements on the demo frame", async ({
  page,
}) => {
  const demo = page.getByRole("region", { name: "record detail" });
  const frame = demo.locator('[data-record-demo="frame"]');
  await frame.scrollIntoViewIfNeeded();

  const firstCard = frame.locator("article").first();
  const widthBefore = (await firstCard.boundingBox())?.width ?? 0;

  await frame.getByRole("button", { name: "Hide Related List" }).click();
  await expect(frame.locator("[data-record-rail]")).toHaveCount(0);

  const toggle = frame.getByRole("button", { name: "Show Related List" });
  await expect(toggle).toHaveAttribute("aria-pressed", "false");
  const toggleBox = await bounds(toggle);
  expect(Math.abs(toggleBox.width - 36)).toBeLessThanOrEqual(1);
  expect(Math.abs(toggleBox.height - 36)).toBeLessThanOrEqual(1);
  await expect(toggle).toHaveCSS("background-color", "rgb(255, 255, 255)");
  await expect(toggle).toHaveCSS("border-width", "1px");
  await expect(toggle).toHaveCSS("border-color", "rgb(226, 231, 238)");

  const tabRow = frame.locator("[data-record-tab-row]");
  const tabRowBox = await bounds(tabRow);
  expect(Math.abs(toggleBox.x - tabRowBox.x - 12)).toBeLessThanOrEqual(1);

  const tabs = frame.getByRole("tablist", { name: "Record views" });
  const tabsBox = await bounds(tabs);
  expect(Math.abs(tabsBox.x - toggleBox.x - toggleBox.width - 12)).toBeLessThanOrEqual(1);
  expect(Math.abs(tabsBox.width - 222.5)).toBeLessThanOrEqual(1);
  expect(Math.abs(tabsBox.height - 37)).toBeLessThanOrEqual(1);

  const scroller = frame.locator("[data-record-scroller]");
  const scrollerBox = await bounds(scroller);
  const cardBox = await bounds(firstCard);
  expect(Math.abs(cardBox.x - scrollerBox.x - 12)).toBeLessThanOrEqual(1);

  const cardRight = cardBox.x + cardBox.width;
  const scrollerRight = scrollerBox.x + scrollerBox.width - 12;
  expect(Math.abs(cardRight - scrollerRight)).toBeLessThanOrEqual(1);
  expect(Math.abs(cardBox.width - widthBefore - 220)).toBeLessThanOrEqual(2);
});

test("rail preference survives reload on the demo frame", async ({ page }) => {
  const frame = page
    .getByRole("region", { name: "record detail" })
    .locator('[data-record-demo="frame"]');
  await frame.scrollIntoViewIfNeeded();
  await frame.getByRole("button", { name: "Hide Related List" }).click();
  await expect
    .poll(() => page.evaluate((key) => localStorage.getItem(key), PREF_KEY))
    .toBe("false");
  await page.reload({ waitUntil: "networkidle" });
  await frame.scrollIntoViewIfNeeded();
  await expect(frame.getByRole("button", { name: "Show Related List" })).toBeVisible({
    timeout: 15_000,
  });
  await expect(frame.locator("[data-record-rail]")).toHaveCount(0);
  await frame.getByRole("button", { name: "Show Related List" }).click();
  await expect.poll(() => page.evaluate((key) => localStorage.getItem(key), PREF_KEY)).toBe("true");
  await page.reload({ waitUntil: "networkidle" });
  await expect(frame.getByRole("button", { name: "Hide Related List" })).toBeVisible({
    timeout: 15_000,
  });
  await expect(frame.locator("[data-record-rail]")).toHaveCount(1);
});
