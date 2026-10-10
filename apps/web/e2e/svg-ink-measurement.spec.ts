import { expect, test } from "@playwright/test";
import { svgPathGeometrySize, svgStrokeInclusiveInkSize } from "./support/geometry";

test("svgStrokeInclusiveInkSize grows when stroke width increases", async ({ page }) => {
  await page.setContent(`
    <div style="padding: 20px">
      <svg id="thin" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="rgb(0,0,0)" stroke-width="1">
        <path d="M4 12h16" stroke-linecap="round" />
      </svg>
      <svg id="thick" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="rgb(0,0,0)" stroke-width="4">
        <path d="M4 12h16" stroke-linecap="round" />
      </svg>
    </div>
  `);
  const thinInk = await svgStrokeInclusiveInkSize(page.locator("#thin"));
  const thickInk = await svgStrokeInclusiveInkSize(page.locator("#thick"));
  expect(thickInk.height).toBeGreaterThan(thinInk.height + 2);
  expect(thickInk.width).toBeGreaterThanOrEqual(thinInk.width);
});

test("svgPathGeometrySize fails when no vector shapes exist", async ({ page }) => {
  await page.setContent('<svg id="empty" width="10" height="10"></svg>');
  await expect(svgPathGeometrySize(page.locator("#empty"))).rejects.toThrow(/no vector shapes/);
});
