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

/** Painted stroke/fill bounds of vector children (not the SVG viewport box). */
export async function svgPaintedInkSize(svg: Locator) {
  return svg.evaluate((root) => {
    const shapes = root.querySelectorAll("path, line, polyline, circle, rect, polygon");
    if (shapes.length === 0) {
      const box = root.getBoundingClientRect();
      return { width: box.width, height: box.height };
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

export function expectWithin(actual: number, expected: number, tolerance: number, label?: string) {
  const delta = Math.abs(actual - expected);
  expect(
    delta,
    label ?? `actual=${actual} expected=${expected} delta=${delta}`,
  ).toBeLessThanOrEqual(tolerance);
}
