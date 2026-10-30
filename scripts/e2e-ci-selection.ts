// Measured text geometry differs on Linux. Keep the CTO-approved OS split here.
export const macosSpecs = [
  "dev-ui.spec.ts",
  "leads-form.spec.ts",
  "record-detail-cards.spec.ts",
  "timeline-history.spec.ts",
] as const;

export function ciTestSelection(group: string | undefined) {
  const patterns = macosSpecs.map((name) => `**/${name}`);
  if (!group) return {};
  if (group === "ubuntu") return { testIgnore: patterns };
  if (group === "macos") return { testMatch: patterns };
  throw new Error(`Unknown MEP_E2E_CI_GROUP: ${group}`);
}
