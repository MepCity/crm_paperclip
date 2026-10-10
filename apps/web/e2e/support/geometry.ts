import { expect, type Locator, type Page } from "@playwright/test";

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

export function expectWithin(actual: number, expected: number, tolerance: number, label?: string) {
  const delta = Math.abs(actual - expected);
  expect(
    delta,
    label ?? `actual=${actual} expected=${expected} delta=${delta}`,
  ).toBeLessThanOrEqual(tolerance);
}

export async function expectCapTop(locator: Locator, expected: number) {
  expectWithin1(await textCapTop(locator), expected);
}

export async function expectBaseline(locator: Locator, expected: number) {
  expectWithin1(await textBaseline(locator), expected);
}

/** Path geometry bounds in screen space (stroke excluded; SVG path boxes). */
export async function svgPathGeometrySize(svg: Locator) {
  return svg.evaluate((root) => {
    const shapes = root.querySelectorAll("path, line, polyline, circle, rect, polygon");
    if (shapes.length === 0) {
      throw new Error("svgPathGeometrySize: no vector shapes");
    }
    let left = Number.POSITIVE_INFINITY;
    let top = Number.POSITIVE_INFINITY;
    let right = Number.NEGATIVE_INFINITY;
    let bottom = Number.NEGATIVE_INFINITY;
    for (const shape of shapes) {
      const box = shape.getBoundingClientRect();
      left = Math.min(left, box.left);
      top = Math.min(top, box.top);
      right = Math.max(right, box.right);
      bottom = Math.max(bottom, box.bottom);
    }
    return { width: right - left, height: bottom - top };
  });
}

/** Stroke-inclusive painted bounds via raster alpha (not the SVG viewport box). */
export async function svgStrokeInclusiveInkSize(svg: Locator) {
  return svg.evaluate(async (root) => {
    const shapes = root.querySelectorAll("path, line, polyline, circle, rect, polygon");
    if (shapes.length === 0) {
      throw new Error("svgStrokeInclusiveInkSize: no vector shapes");
    }

    const screenBox = root.getBoundingClientRect();
    if (screenBox.width <= 0 || screenBox.height <= 0) {
      throw new Error("svgStrokeInclusiveInkSize: empty screen box");
    }

    if (!(root instanceof SVGSVGElement)) {
      throw new Error("svgStrokeInclusiveInkSize: expected SVG root");
    }
    const clone = root.cloneNode(true) as SVGSVGElement;
    const sourceNodes = [root, ...root.querySelectorAll("*")];
    const targetNodes = [clone, ...clone.querySelectorAll("*")];
    for (let index = 0; index < sourceNodes.length; index += 1) {
      const from = sourceNodes[index];
      const to = targetNodes[index];
      if (!(from instanceof SVGElement) || !(to instanceof SVGElement)) continue;
      const computed = getComputedStyle(from);
      if (from.hasAttribute("stroke")) {
        to.setAttribute("stroke", computed.stroke);
      }
      if (from.hasAttribute("fill")) {
        to.setAttribute("fill", computed.fill);
      }
      if (from.hasAttribute("stroke-width") || computed.strokeWidth) {
        to.setAttribute("stroke-width", computed.strokeWidth);
      }
      if (from.hasAttribute("stroke-linecap")) {
        to.setAttribute("stroke-linecap", computed.strokeLinecap);
      }
      if (from.hasAttribute("stroke-linejoin")) {
        to.setAttribute("stroke-linejoin", computed.strokeLinejoin);
      }
    }
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    const viewBox = root.getAttribute("viewBox");
    if (viewBox) clone.setAttribute("viewBox", viewBox);
    clone.setAttribute("width", String(screenBox.width));
    clone.setAttribute("height", String(screenBox.height));

    const scale = 8;
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.ceil(screenBox.width * scale));
    canvas.height = Math.max(1, Math.ceil(screenBox.height * scale));
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) {
      throw new Error("svgStrokeInclusiveInkSize: 2d context unavailable");
    }

    const markup = new XMLSerializer().serializeToString(clone);
    const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`;
    await new Promise<void>((resolve, reject) => {
      const image = new Image();
      image.onload = () => {
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve();
      };
      image.onerror = () => reject(new Error("svgStrokeInclusiveInkSize: rasterize failed"));
      image.src = dataUrl;
    });

    const { data, width, height } = context.getImageData(0, 0, canvas.width, canvas.height);
    let minX = width;
    let minY = height;
    let maxX = -1;
    let maxY = -1;
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const alpha = data[(y * width + x) * 4 + 3] ?? 0;
        if (alpha > 0) {
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
        }
      }
    }
    if (maxX < 0) {
      throw new Error("svgStrokeInclusiveInkSize: no painted pixels");
    }

    return {
      width: (maxX - minX + 1) / scale,
      height: (maxY - minY + 1) / scale,
    };
  });
}

type InkScan = { box: InkBox | null; lineTops: number[] };
type InkResult = { solid: InkScan; antialiased: InkScan; scale: number };

/** Viewport-space rect plus the colours that define the ink of one measurement target. */
type Probe = {
  key: string;
  left: number;
  top: number;
  right: number;
  bottom: number;
  margin: number;
  color: string;
  background: string;
  scrollX: number;
  scrollY: number;
};

async function probeInkTarget(locator: Locator, key: string, icon: boolean): Promise<Probe> {
  const probe = await locator.evaluate(
    (node, { isIcon, inkKey }) => {
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
      return {
        key: inkKey,
        left: rect.left,
        top: rect.top,
        right: rect.right,
        bottom: rect.bottom,
        margin: isIcon ? 2 : 0,
        scrollX,
        scrollY,
        color,
        background,
      };
    },
    { isIcon: icon, inkKey: key },
  );
  return probe;
}

/** Screenshot the union of the probes once and scan each target inside its own window.
 * Every probe shares one crop origin and one paint phase, so offsets between targets are
 * common-mode: content moving above the row cannot change them.
 */
async function rasterInkProbes(
  page: Page,
  probes: Probe[],
  originalScroll: { x: number; y: number },
): Promise<Record<string, InkResult>> {
  for (const probe of probes) {
    if (probe.scrollY !== probes[0]?.scrollY || probe.scrollX !== probes[0]?.scrollX) {
      throw new Error(`pageRasterInk: ${probe.key} scrolled away during the measurement`);
    }
  }
  const left = Math.min(...probes.map((probe) => probe.left - probe.margin));
  const top = Math.min(...probes.map((probe) => probe.top - probe.margin));
  const right = Math.max(...probes.map((probe) => probe.right + probe.margin));
  const bottom = Math.max(...probes.map((probe) => probe.bottom + probe.margin));
  const crop = {
    x: Math.floor(left),
    y: Math.floor(top),
    width: Math.ceil(right) - Math.floor(left),
    height: Math.ceil(bottom) - Math.floor(top),
    scrollX: probes[0]?.scrollX ?? 0,
    scrollY: probes[0]?.scrollY ?? 0,
  };
  const png = await page.screenshot({
    fullPage: false,
    clip: { x: crop.x, y: crop.y, width: crop.width, height: crop.height },
    animations: "disabled",
  });
  return page.evaluate(
    async ({ crop, probes, png, originalScroll }) => {
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
      const scale = image.width / crop.width;
      const results: Record<string, InkResult> = {};
      for (const probe of probes) {
        const foreground = rgb(probe.color);
        const background = rgb(probe.background);
        const xStart = Math.max(0, (Math.floor(probe.left - probe.margin) - crop.x) * scale);
        const xEnd = Math.min(
          image.width,
          (Math.ceil(probe.right + probe.margin) - crop.x) * scale,
        );
        const yStart = Math.max(0, (Math.floor(probe.top - probe.margin) - crop.y) * scale);
        const yEnd = Math.min(
          image.height,
          (Math.ceil(probe.bottom + probe.margin) - crop.y) * scale,
        );
        const bounds = (solid: boolean) => {
          let left = Infinity,
            top = Infinity,
            right = -Infinity,
            bottom = -Infinity;
          const rows: number[] = [];
          for (let y = yStart; y < yEnd; y++) {
            let occupied = false;
            for (let x = xStart; x < xEnd; x++) {
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
        results[probe.key] = { solid: bounds(true), antialiased: bounds(false), scale };
      }
      return results;
    },
    { crop, probes, png: png.toString("base64"), originalScroll },
  );
}

/** Measure one target in its own crop, as it was measured before MEP-269. Cross-target offsets
 * go through `pageRasterInkShared`, which reads both edges from a single paint.
 */
export async function pageRasterInk(locator: Locator, icon = false): Promise<InkResult> {
  const page = locator.page();
  await page.evaluate(() => document.fonts.ready);
  const originalScroll = await page.evaluate(() => ({ x: scrollX, y: scrollY }));
  await locator.scrollIntoViewIfNeeded();
  if (icon) await locator.hover();
  const probe = await probeInkTarget(locator, "ink", icon);
  const results = await rasterInkProbes(page, [probe], originalScroll);
  await page.evaluate(({ x, y }) => scrollTo(x, y), originalScroll);
  const result = results.ink;
  if (!result) throw new Error("pageRasterInk: measurement missing");
  return result;
}

/** Targets measured in a single screenshot, so both edges come from one paint and one crop
 * origin. Keys are the names specs assert on; icon targets are hovered by the helper after the
 * scroll settles, because their ink is only painted while the affordance is visible.
 */
export async function pageRasterInkShared(
  anchor: Locator,
  targets: Record<string, { locator: Locator; icon?: boolean }>,
): Promise<Record<string, InkResult>> {
  const page = anchor.page();
  await page.evaluate(() => document.fonts.ready);
  const originalScroll = await page.evaluate(() => ({ x: scrollX, y: scrollY }));
  await anchor.scrollIntoViewIfNeeded();
  for (const target of Object.values(targets)) {
    if (target.icon) await target.locator.hover();
  }
  const probes = await Promise.all(
    Object.entries(targets).map(([key, target]) =>
      probeInkTarget(target.locator, key, target.icon ?? false),
    ),
  );
  const results = await rasterInkProbes(page, probes, originalScroll);
  await page.evaluate(({ x, y }) => scrollTo(x, y), originalScroll);
  return results;
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
