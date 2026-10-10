import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";

const WCAG_21_A_AND_AA = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

/** Measured sub-AA placeholder ink on white (ADR 0003 §8). Used on `/dev/ui` timeline filter demos. */
export const DEV_UI_A11Y_EXCLUDE = [
  "[data-part=empty]",
  "[data-part=empty-value]",
  '.timeline-filter-selector-wrap[data-tone="checkbox-placeholder"] .timeline-filter-selector-label',
  '.timeline-filter-selector-wrap[data-tone="user-placeholder"] .timeline-filter-selector-label',
  /** Reference CRM measured validation ink (`--color-form-required`, ~3.04:1 on white). */
  ".record-form-validation-error",
] as const;

type AxeViolations = Awaited<ReturnType<AxeBuilder["analyze"]>>["violations"];
type AxeTarget = AxeViolations[number]["nodes"][number]["target"];

export type A11yCheckOptions = {
  /** Selectors left out of the scan. Every call site must comment why. */
  exclude?: readonly string[];
  /** When set, only these roots are scanned (faster on large gallery pages). */
  include?: readonly string[];
};

function formatTarget(target: AxeTarget): string {
  return target.map((part) => (typeof part === "string" ? part : part.join(" >>> "))).join(" >> ");
}

/**
 * Contrast is read from the colours on screen. A fade still in progress
 * composites text toward whatever sits behind it, so a resting pair that
 * passes 4.5:1 can fail mid-animation. Finite animations are moved to their
 * end state instead of waiting on the clock: a busy browser can stall that
 * clock until a short-lived toast has already gone. Infinite animations,
 * such as a spinner, never finish and are left running.
 */
async function settleFiniteAnimations(page: Page): Promise<void> {
  await page.evaluate(() => {
    for (const animation of document.getAnimations()) {
      if (animation.playState !== "running") continue;
      const timing = animation.effect?.getComputedTiming();
      if (!timing || timing.iterations === Infinity) continue;
      if (typeof timing.duration === "number" && !Number.isFinite(timing.duration)) continue;
      try {
        animation.finish();
      } catch {
        // Not seekable. The scan then sees whatever is already on screen.
      }
    }
  });
}

function formatViolations(violations: AxeViolations): string {
  return violations
    .map((violation) => {
      const impact = violation.impact ?? "unknown";
      const selectors = violation.nodes.map((node) => formatTarget(node.target)).join(", ");
      return [
        `- ${violation.id} (${impact})`,
        `  selectors: ${selectors}`,
        `  help: ${violation.helpUrl}`,
      ].join("\n");
    })
    .join("\n");
}

/**
 * Fails when the page violates WCAG 2.1 A or AA.
 * Pass `exclude` only with a comment at the call site explaining why those selectors are skipped.
 */
export async function expectNoA11yViolations(
  page: Page,
  options?: A11yCheckOptions,
): Promise<void> {
  await settleFiniteAnimations(page);
  const builder = new AxeBuilder({ page }).withTags(WCAG_21_A_AND_AA);
  for (const selector of options?.include ?? []) {
    builder.include(selector);
  }
  for (const selector of options?.exclude ?? []) {
    builder.exclude(selector);
  }

  const results = await builder.analyze();
  if (results.violations.length === 0) return;

  const details = formatViolations(results.violations);
  throw new Error(`Accessibility violations (${results.violations.length}):\n${details}`);
}
