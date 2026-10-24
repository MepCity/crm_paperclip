import { type AutomationPort, createMemoryAutomationPort } from "@crm/core/automation";
import type { OrgContext } from "@crm/core/records";
import { syntheticAssignmentRules } from "./synthetic-fixture";

/** Organizations whose name starts with this prefix get the populated fixture (test only). */
export const POPULATED_FIXTURE_ORG_PREFIX = "Synthetic Populated";

/**
 * Server-side factory for the read-only automation port (workflow and assignment).
 * Default fixture is empty and fully synthetic; no reference data, no write capability.
 * The populated synthetic fixture is opt-in: `MEP_AUTOMATION_FIXTURE=populated` and an
 * organization name with the prefix above (used by component and e2e tests).
 */
export function createAutomationPort(): AutomationPort {
  if (process.env.MEP_AUTOMATION_FIXTURE !== "populated") return createMemoryAutomationPort();
  const forOrg = (ctx: OrgContext) =>
    createMemoryAutomationPort({
      fixtures: ctx.orgName.startsWith(POPULATED_FIXTURE_ORG_PREFIX)
        ? { [ctx.orgId]: syntheticAssignmentRules }
        : {},
    });
  return {
    list: (ctx, query) => forOrg(ctx).list(ctx, query),
    get: (ctx, query) => forOrg(ctx).get(ctx, query),
  };
}
