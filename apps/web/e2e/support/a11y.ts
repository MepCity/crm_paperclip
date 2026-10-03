import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";

const WCAG_21_A_AND_AA = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

type AxeViolations = Awaited<ReturnType<AxeBuilder["analyze"]>>["violations"];
type AxeTarget = AxeViolations[number]["nodes"][number]["target"];

export type A11yCheckOptions = {
  /** Selectors left out of the scan. Every call site must comment why. */
  exclude?: readonly string[];
};

function formatTarget(target: AxeTarget): string {
  return target.map((part) => (typeof part === "string" ? part : part.join(" >>> "))).join(" >> ");
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
  const builder = new AxeBuilder({ page }).withTags(WCAG_21_A_AND_AA);
  for (const selector of options?.exclude ?? []) {
    builder.exclude(selector);
  }

  const results = await builder.analyze();
  if (results.violations.length === 0) return;

  const details = formatViolations(results.violations);
  throw new Error(`Accessibility violations (${results.violations.length}):\n${details}`);
}
