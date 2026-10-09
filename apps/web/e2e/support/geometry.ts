import { expect, type Locator } from "@playwright/test";

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

export function expectWithin(actual: number, expected: number, tolerance: number, label?: string) {
  const delta = Math.abs(actual - expected);
  expect(
    delta,
    label ?? `actual=${actual} expected=${expected} delta=${delta}`,
  ).toBeLessThanOrEqual(tolerance);
}
