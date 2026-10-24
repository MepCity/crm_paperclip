import {
  type AutomationPort,
  createMemoryAutomationPort,
  type MemoryAutomationOptions,
} from "@crm/core/automation";
import type { OrgContext } from "@crm/core/records";
import { syntheticAssignmentRules } from "./synthetic-fixture";
import { SYNTHETIC_WORKFLOW_RULES } from "./synthetic-workflow-fixture";

/** Organizations whose name starts with this prefix get the populated fixture (test only). */
export const POPULATED_FIXTURE_ORG_PREFIX = "Synthetic Populated";

/**
 * Server-side factory for the read-only automation port (workflow and assignment).
 * Default fixture is empty and fully synthetic; no reference data, no write capability.
 * The populated synthetic fixture is opt-in by organization name prefix (above), so e2e runs
 * it in CI without an environment switch; all other organizations get the empty fixture.
 * Explicit options (tests) bypass the prefix selection.
 */
export function createAutomationPort(options?: MemoryAutomationOptions): AutomationPort {
  if (options) return createMemoryAutomationPort(options);
  const forOrg = (ctx: OrgContext) =>
    createMemoryAutomationPort({
      fixtures: ctx.orgName.startsWith(POPULATED_FIXTURE_ORG_PREFIX)
        ? { [ctx.orgId]: [...syntheticAssignmentRules, ...SYNTHETIC_WORKFLOW_RULES] }
        : {},
    });
  return {
    list: (ctx, query) => forOrg(ctx).list(ctx, query),
    get: (ctx, query) => forOrg(ctx).get(ctx, query),
  };
}
