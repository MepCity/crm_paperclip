import { expect, test } from "@playwright/test";
import {
  type InkBox,
  pageRasterInk,
  pageRasterInkShared,
  svgPathGeometrySize,
  svgStrokeInclusiveInkSize,
} from "./support/geometry";

const fixture = `
  <style>
    html, body { margin: 0; background: #ffffff; }
    body { color: rgb(97, 110, 136); font: 400 13px/18px Arial, sans-serif; }
    #row { display: flex; align-items: flex-start; width: 400px; padding-left: 20px; }
    #label { width: 120px; text-align: right; }
    #wrap { position: relative; flex: 1; }
    #pencil {
      position: absolute; left: 180px; top: -1.6px;
      width: 11.5px; height: 11.5px; color: rgb(97, 110, 136);
    }
    #pencil svg { overflow: visible; width: 100%; height: 100%; }
  </style>
  <div id="spacer"></div>
  <div id="row">
    <div id="label">Rating</div>
    <div id="wrap"><span id="value">—</span>
      <span id="pencil"><svg viewBox="0 0 11.5 11.5" fill="none">
        <path transform="translate(-0.5 0.5) scale(1.38 1.23) translate(-1.38 0.11)"
          d="M1.38 9.66h1.1l6.07-6.07-1.1-1.1-6.07 6.07v1.1zM9.11 3.04l1.1-1.1c.28-.28.28-.74 0-1.01l-.83-.83c-.28-.28-.74-.28-1.01 0l-1.1 1.1 1.1 1.1z"
          fill="currentColor" />
      </svg></span>
    </div>
  </div>
`;

test.describe("page raster ink deltas", () => {
  test.use({ viewport: { width: 1470, height: 835 }, deviceScaleFactor: 2 });

  /** An empty measurement must fail the guard, not read as ink at offset 0: with `?? 0` every
   * delta would be 0 and the spread gate below would stay green while nothing was measured. */
  function requireInk(box: InkBox | null | undefined, target: string, height: number): InkBox {
    const message = `${target} produced no ink at spacer height ${height}`;
    const measured: InkBox | null = box ?? null;
    expect(measured, message).not.toBeNull();
    if (measured === null) throw new Error(message);
    return measured;
  }

  test("ink deltas do not move with the content above the row", async ({ page }) => {
    // MEP-269: unrelated content above a row moves the row's subpixel alignment. Two effects
    // then show up in a cross-target ink offset: each target measured in its own crop adds the
    // crop origin and the scroll bookkeeping of two independent calls, and comparing an
    // antialiased edge with a solid one rounds the two edges in opposite directions. Both are
    // cancelled by one shared crop and one ink criterion on both targets.
    await page.setContent(fixture);
    const row = page.locator("#row");
    const pencil = page.locator("#pencil");
    const label = page.locator("#label");
    const targets = {
      pencil: { locator: pencil, icon: true },
      label: { locator: label },
    };

    const likeForLike: number[] = [];
    const mixedCriterion: number[] = [];
    const separateCrops: number[] = [];
    const heights = [0, 0.5, 1, 1.5, 2, 33.5, 100.25, 233, 6000, 6000.5, 6001, 6033.5, 6480.75];
    for (const height of heights) {
      await page.evaluate((h) => {
        (document.getElementById("spacer") as HTMLDivElement).style.height = `${h}px`;
      }, height);
      const ink = await pageRasterInkShared(row, targets);
      const pencilAntialiased = requireInk(
        ink.pencil?.antialiased.box,
        "pencil antialiased",
        height,
      );
      requireInk(ink.pencil?.solid.box, "pencil solid", height);
      const labelAntialiased = requireInk(ink.label?.antialiased.box, "label antialiased", height);
      const labelSolid = requireInk(ink.label?.solid.box, "label solid", height);
      likeForLike.push(pencilAntialiased.top - labelAntialiased.top);
      mixedCriterion.push(pencilAntialiased.top - labelSolid.top);
      const pencilInk = await pageRasterInk(pencil, true);
      const labelInk = await pageRasterInk(label);
      const ownPencil = requireInk(
        pencilInk.antialiased.box,
        "own-crop pencil antialiased",
        height,
      );
      const ownLabel = requireInk(labelInk.solid.box, "own-crop label solid", height);
      separateCrops.push(ownPencil.top - ownLabel.top);
    }
    expect(likeForLike, "one delta per spacer height").toHaveLength(heights.length);
    const spread = (values: number[]) => Math.max(...values) - Math.min(...values);
    console.log(
      `like-for-like: ${likeForLike.map((v) => v.toFixed(2)).join(", ")} ` +
        `(spread ${spread(likeForLike).toFixed(2)} px)\n` +
        `mixed criterion: ${mixedCriterion.map((v) => v.toFixed(2)).join(", ")} ` +
        `(spread ${spread(mixedCriterion).toFixed(2)} px)\n` +
        `separate crops: ${separateCrops.map((v) => v.toFixed(2)).join(", ")} ` +
        `(spread ${spread(separateCrops).toFixed(2)} px)`,
    );
    // One device pixel per ink edge is all a raster measurement can resolve at DPR 2, so a
    // shared crop with one criterion on both targets must stay inside 1 CSS px. Anything wider
    // means the crop origin or the scroll bookkeeping of two independent calls leaked into the
    // offset — which is what the ±1 px parity gate cannot afford (MEP-269).
    expect(spread(likeForLike)).toBeLessThanOrEqual(1);
  });
});

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
