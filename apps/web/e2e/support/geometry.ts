import { expect, type Locator } from "@playwright/test";

export type InkBox = { left: number; top: number; width: number; height: number };

export async function textCapTop(locator: Locator) {
  return (await textSolidInkBand(locator)).top;
}

export async function textCapLeft(locator: Locator) {
  return (await textSolidInkBand(locator)).left;
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

/** Solid text ink band from canvas font metrics (not DOM line box). */
export async function textSolidInkBand(locator: Locator): Promise<InkBox> {
  return locator.evaluate((node) => {
    const element = node instanceof HTMLElement ? node : node.parentElement;
    if (!element) {
      throw new Error("Expected an HTMLElement for ink measurement.");
    }
    const style = getComputedStyle(element);
    const size = Number.parseFloat(style.fontSize);
    const lineHeight =
      style.lineHeight === "normal" ? size * 1.2 : Number.parseFloat(style.lineHeight);
    const context = document.createElement("canvas").getContext("2d");
    if (!context) {
      throw new Error("Canvas metrics are unavailable.");
    }
    context.font = `${style.fontWeight} ${size}px ${style.fontFamily}`;
    const text = element.textContent ?? "";
    const metrics = context.measureText(text);
    const range = document.createRange();
    range.selectNodeContents(element);
    const lineRect = range.getBoundingClientRect();
    const boxRect = element.getBoundingClientRect();
    const baseline =
      lineRect.top +
      (lineHeight - (metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent)) / 2 +
      metrics.fontBoundingBoxAscent;
    const top = baseline - metrics.actualBoundingBoxAscent;
    const bottom = baseline + metrics.actualBoundingBoxDescent;
    const inkWidth = metrics.actualBoundingBoxLeft + metrics.actualBoundingBoxRight;
    const anchorRect = style.textAlign === "right" ? boxRect : lineRect;
    const left =
      style.textAlign === "right"
        ? anchorRect.right - metrics.actualBoundingBoxRight - inkWidth
        : anchorRect.left + metrics.actualBoundingBoxLeft;
    return { left, top, width: inkWidth, height: bottom - top };
  });
}

/** Solid ink left edge of the first rendered glyph. */
export async function textSolidInkLeft(locator: Locator): Promise<number> {
  return locator.evaluate((node) => {
    const element = node instanceof HTMLElement ? node : node.parentElement;
    if (!element) {
      throw new Error("Expected an HTMLElement for ink measurement.");
    }
    const textNode = [...element.childNodes].find((child) => child.nodeType === Node.TEXT_NODE);
    const text = textNode?.textContent ?? element.textContent ?? "";
    const style = getComputedStyle(element);
    const context = document.createElement("canvas").getContext("2d");
    if (!context) {
      throw new Error("Canvas metrics are unavailable.");
    }
    context.font = `${style.fontWeight} ${style.fontSize}px ${style.fontFamily}`;
    const range = document.createRange();
    if (textNode) {
      range.setStart(textNode, 0);
      range.setEnd(textNode, 1);
    } else {
      range.selectNodeContents(element);
    }
    const rect = range.getBoundingClientRect();
    const metrics = context.measureText(text[0] ?? "M");
    return rect.left + metrics.actualBoundingBoxLeft;
  });
}

/** Solid ink right edge of the full label text. */
export async function textSolidInkRight(locator: Locator): Promise<number> {
  return locator.evaluate((node) => {
    const element = node instanceof HTMLElement ? node : node.parentElement;
    if (!element) {
      throw new Error("Expected an HTMLElement for ink measurement.");
    }
    const style = getComputedStyle(element);
    const context = document.createElement("canvas").getContext("2d");
    if (!context) {
      throw new Error("Canvas metrics are unavailable.");
    }
    context.font = `${style.fontWeight} ${style.fontSize}px ${style.fontFamily}`;
    const text = element.textContent ?? "";
    const metrics = context.measureText(text);
    const range = document.createRange();
    range.selectNodeContents(element);
    const lineRect = range.getBoundingClientRect();
    return lineRect.right - metrics.actualBoundingBoxRight;
  });
}

/** Solid cap top of the first rendered line in a (possibly wrapped) text node. */
export async function firstLineSolidCapTop(locator: Locator): Promise<number | null> {
  return locator.evaluate((node) => {
    const measureSolidCapFromLineBox = (
      style: CSSStyleDeclaration,
      context: CanvasRenderingContext2D,
      rect: DOMRect,
      sample: string,
    ) => {
      const size = Number.parseFloat(style.fontSize);
      const lineHeight =
        style.lineHeight === "normal" ? size * 1.2 : Number.parseFloat(style.lineHeight);
      const metrics = context.measureText(sample);
      const baseline =
        rect.top +
        (lineHeight - (metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent)) / 2 +
        metrics.fontBoundingBoxAscent;
      return baseline - metrics.actualBoundingBoxAscent;
    };

    const element = node instanceof HTMLElement ? node : node.parentElement;
    if (!element) {
      return null;
    }
    const textNode = [...element.childNodes].find((child) => child.nodeType === Node.TEXT_NODE);
    const text = textNode?.textContent ?? element.textContent ?? "";
    if (!text) {
      return null;
    }
    const style = getComputedStyle(element);
    const context = document.createElement("canvas").getContext("2d");
    if (!context) {
      return null;
    }
    context.font = `${style.fontWeight} ${style.fontSize}px ${style.fontFamily}`;
    const range = document.createRange();
    if (textNode) {
      range.setStart(textNode, 0);
      range.setEnd(textNode, 1);
    } else {
      range.selectNodeContents(element);
    }
    const rect = range.getBoundingClientRect();
    return measureSolidCapFromLineBox(style, context, rect, text[0] ?? "M");
  });
}

/** Per wrapped line solid cap tops using caret sampling + font metrics. */
export async function wrappedLineSolidCapTops(locator: Locator): Promise<number[] | null> {
  return locator.evaluate((node) => {
    const measureSolidCapFromLineBox = (
      style: CSSStyleDeclaration,
      context: CanvasRenderingContext2D,
      rect: DOMRect,
      sample: string,
    ) => {
      const size = Number.parseFloat(style.fontSize);
      const lineHeight =
        style.lineHeight === "normal" ? size * 1.2 : Number.parseFloat(style.lineHeight);
      const metrics = context.measureText(sample);
      const baseline =
        rect.top +
        (lineHeight - (metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent)) / 2 +
        metrics.fontBoundingBoxAscent;
      return baseline - metrics.actualBoundingBoxAscent;
    };

    const element = node instanceof HTMLElement ? node : node.parentElement;
    if (!element) {
      return null;
    }
    const style = getComputedStyle(element);
    const size = Number.parseFloat(style.fontSize);
    const context = document.createElement("canvas").getContext("2d");
    if (!context) {
      return null;
    }
    context.font = `${style.fontWeight} ${size}px ${style.fontFamily}`;

    const range = document.createRange();
    range.selectNodeContents(element);
    const rects = [...range.getClientRects()];
    if (rects.length < 2) {
      return null;
    }

    const capTops: number[] = [];
    for (const rect of rects) {
      const position = document.caretPositionFromPoint(
        rect.left + Math.min(rect.width / 2, 4),
        rect.top + rect.height / 2,
      );
      const textNode = position?.offsetNode;
      const offset = position?.offset ?? 0;
      const sample =
        textNode?.nodeType === Node.TEXT_NODE
          ? (textNode.textContent?.[offset] ?? textNode.textContent?.[0] ?? "M")
          : "M";
      capTops.push(measureSolidCapFromLineBox(style, context, rect, sample));
    }
    return capTops;
  });
}

/** Raster solid (alpha ≥ 0.88) and antialiased (alpha ≥ 0.04) ink for SVG icons. */
export async function svgRasterInkBoxes(locator: Locator): Promise<{
  solid: InkBox | null;
  antialiased: InkBox | null;
}> {
  return locator.evaluate(async (root) => {
    const inkBoundsFromImageData = (
      data: ImageData,
      originLeft: number,
      originTop: number,
      scale: number,
      minAlpha: number,
      solidInk: boolean,
    ) => {
      const { width, height } = data;
      let left = Infinity;
      let right = -Infinity;
      let top = Infinity;
      let bottom = -Infinity;
      for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
          const i = (y * width + x) * 4;
          const alpha = (data.data[i + 3] ?? 0) / 255;
          if (alpha < minAlpha) {
            continue;
          }
          if (solidInk && alpha < 0.88) {
            continue;
          }
          const dr = data.data[i] ?? 0;
          const dg = data.data[i + 1] ?? 0;
          const db = data.data[i + 2] ?? 0;
          const luminance = 0.299 * dr + 0.587 * dg + 0.114 * db;
          if (luminance > 235) {
            continue;
          }
          const cssX = originLeft + x / scale;
          const cssY = originTop + y / scale;
          left = Math.min(left, cssX);
          right = Math.max(right, cssX);
          top = Math.min(top, cssY);
          bottom = Math.max(bottom, cssY);
        }
      }
      if (!Number.isFinite(left)) {
        return null;
      }
      return { left, top, width: right - left, height: bottom - top };
    };

    const svg = root.querySelector("svg");
    const path = root.querySelector("path");
    if (!svg || !path) {
      return { solid: null, antialiased: null };
    }
    const color = getComputedStyle(root).color;
    const rect = svg.getBoundingClientRect();
    const scale = 8;
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.ceil(rect.width * scale));
    canvas.height = Math.max(1, Math.ceil(rect.height * scale));
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) {
      return { solid: null, antialiased: null };
    }

    const clone = svg.cloneNode(true) as SVGSVGElement;
    clone.setAttribute("width", String(rect.width));
    clone.setAttribute("height", String(rect.height));
    const filled = clone.querySelector("path");
    if (filled) {
      filled.setAttribute("fill", color);
    }
    const serialized = new XMLSerializer().serializeToString(clone);
    const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(serialized)}`;

    await new Promise<void>((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        ctx.scale(scale, scale);
        ctx.drawImage(img, 0, 0, rect.width, rect.height);
        resolve();
      };
      img.onerror = () => reject(new Error("SVG rasterization failed."));
      img.src = url;
    });

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const solid = inkBoundsFromImageData(imageData, rect.left, rect.top, scale, 0.88, true);
    const antialiased = inkBoundsFromImageData(imageData, rect.left, rect.top, scale, 0.04, false);
    return { solid, antialiased };
  });
}
