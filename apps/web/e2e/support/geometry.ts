import { expect, type Locator } from "@playwright/test";

export type InkBox = { left: number; top: number; width: number; height: number };

/** Legacy range coordinates for existing layout specs; use raster helpers for ink. */
export async function textCapTop(locator: Locator) {
  return locator.evaluate((element) => {
    const range = document.createRange();
    range.selectNodeContents(element);
    return range.getBoundingClientRect().y;
  });
}

export async function textCapLeft(locator: Locator) {
  return locator.evaluate((element) => {
    const range = document.createRange();
    range.selectNodeContents(element);
    return range.getBoundingClientRect().x;
  });
}

export async function textBaseline(locator: Locator) {
  return locator.evaluate((element) => {
    const probe = document.createElement("span");
    probe.style.cssText = "display:inline-block;width:0;height:0";
    element.prepend(probe);
    const baseline = probe.getBoundingClientRect().bottom;
    probe.remove();
    return baseline;
  });
}

export function expectWithin1(actual: number, expected: number) {
  const delta = Math.abs(actual - expected);
  expect(delta, `actual=${actual} expected=${expected} delta=${delta}`).toBeLessThanOrEqual(1);
}

export async function expectCapTop(locator: Locator, expected: number) {
  expectWithin1(await textCapTop(locator), expected);
}

export async function expectBaseline(locator: Locator, expected: number) {
  expectWithin1(await textBaseline(locator), expected);
}

/** Measure the browser's PNG pixels. DOM ranges only select the crop, never ink edges.
 * Exact foreground RGB is solid ink; every non-background pixel includes antialiasing.
 * Crops include a margin so overflowing SVG ink is not clipped by the measurement.
 */
export async function pageRasterInk(locator: Locator, icon = false) {
  const page = locator.page();
  await page.evaluate(() => document.fonts.ready);
  const originalScroll = await page.evaluate(() => ({ x: scrollX, y: scrollY }));
  await locator.scrollIntoViewIfNeeded();
  if (icon) await locator.hover();
  const crop = await locator.evaluate((node, isIcon) => {
    const element = isIcon ? (node.querySelector("svg") ?? node) : node;
    const range = document.createRange();
    range.selectNodeContents(element);
    const rect = isIcon ? element.getBoundingClientRect() : range.getBoundingClientRect();
    const color = getComputedStyle(node).color;
    let ancestor: Element | null = node;
    let background = "rgba(0, 0, 0, 0)";
    while (ancestor && background === "rgba(0, 0, 0, 0)") {
      background = getComputedStyle(ancestor).backgroundColor;
      ancestor = ancestor.parentElement;
    }
    const margin = isIcon ? 2 : 0;
    return {
      x: Math.floor(rect.left - margin),
      y: Math.floor(rect.top - margin),
      width: Math.ceil(rect.right + margin) - Math.floor(rect.left - margin),
      height: Math.ceil(rect.bottom + margin) - Math.floor(rect.top - margin),
      scrollX,
      scrollY,
      color,
      background,
    };
  }, icon);
  const png = await page.screenshot({
    fullPage: false,
    clip: { x: crop.x, y: crop.y, width: crop.width, height: crop.height },
    animations: "disabled",
  });
  const result = await page.evaluate(
    async ({ crop, png, originalScroll }) => {
      const image = new Image();
      image.src = `data:image/png;base64,${png}`;
      await image.decode();
      const canvas = document.createElement("canvas");
      canvas.width = image.width;
      canvas.height = image.height;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) throw new Error("PNG decoding requires a canvas context");
      ctx.drawImage(image, 0, 0);
      const pixels = ctx.getImageData(0, 0, image.width, image.height).data;
      const rgb = (color: string) => (color.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number);
      const foreground = rgb(crop.color);
      const background = rgb(crop.background);
      const scale = image.width / crop.width;
      const bounds = (solid: boolean) => {
        let left = Infinity,
          top = Infinity,
          right = -Infinity,
          bottom = -Infinity;
        const rows: number[] = [];
        for (let y = 0; y < image.height; y++) {
          let occupied = false;
          for (let x = 0; x < image.width; x++) {
            const offset = (y * image.width + x) * 4;
            const match = solid
              ? foreground.every((value, channel) => pixels[offset + channel] === value)
              : background.some((value, channel) => pixels[offset + channel] !== value);
            if (!match) continue;
            occupied = true;
            left = Math.min(left, x);
            right = Math.max(right, x);
            top = Math.min(top, y);
            bottom = Math.max(bottom, y);
          }
          if (occupied) rows.push(y);
        }
        const lineTops = rows
          .filter((y, index) => index === 0 || y > (rows[index - 1] ?? 0) + 1)
          .map((y) => crop.y + crop.scrollY - originalScroll.y + y / scale);
        return {
          box: Number.isFinite(left)
            ? {
                left: crop.x + crop.scrollX - originalScroll.x + left / scale,
                top: crop.y + crop.scrollY - originalScroll.y + top / scale,
                width: (right - left + 1) / scale,
                height: (bottom - top + 1) / scale,
              }
            : null,
          lineTops,
        };
      };
      return { solid: bounds(true), antialiased: bounds(false), scale };
    },
    { crop, png: png.toString("base64"), originalScroll },
  );
  await page.evaluate(({ x, y }) => scrollTo(x, y), originalScroll);
  return result;
}

export async function textSolidInkBand(locator: Locator): Promise<InkBox> {
  const { solid } = await pageRasterInk(locator);
  if (!solid.box) throw new Error("No exact foreground pixels in text crop");
  return solid.box;
}

export async function textSolidInkLeft(locator: Locator) {
  return (await textSolidInkBand(locator)).left;
}

export async function textSolidInkRight(locator: Locator) {
  const box = await textSolidInkBand(locator);
  return box.left + box.width;
}

export async function firstLineSolidCapTop(locator: Locator) {
  return (await textSolidInkBand(locator)).top;
}

export async function wrappedLineSolidCapTops(locator: Locator) {
  return (await pageRasterInk(locator)).solid.lineTops;
}

export async function svgRasterInkBoxes(locator: Locator) {
  const ink = await pageRasterInk(locator, true);
  return { solid: ink.solid.box, antialiased: ink.antialiased.box };
}
