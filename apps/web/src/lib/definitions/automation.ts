import type { AutomationPort } from "@crm/core/automation";
import { createAutomationPort, POPULATED_FIXTURE_ORG_PREFIX } from "@/modules/automation/port";
import { definitionPorts } from "./ports";

/** Legacy synthetic ids remain readable; all new assignment shells use persistence. */
export function assignmentReadPort(): AutomationPort {
  const legacy = createAutomationPort();
  return {
    async list(ctx, query) {
      if (query.kind !== "assignment") return legacy.list(ctx, query);
      try {
        const result = await (await definitionPorts()).automation.list(ctx, query);
        // Retain the explicit populated-test fixture only while no saved shell matches.
        if (
          ctx.orgName.startsWith(POPULATED_FIXTURE_ORG_PREFIX) &&
          ((result.ok && !result.value.items.length) ||
            (!result.ok && result.error.code === "invalid_query"))
        ) {
          return legacy.list(ctx, query);
        }
        return result;
      } catch {
        return { ok: false, error: { code: "unavailable" } };
      }
    },
    async get(ctx, query) {
      if (query.id.startsWith("synthetic-")) return legacy.get(ctx, query);
      try {
        return (await definitionPorts()).automation.get(ctx, query);
      } catch {
        return { ok: false, error: { code: "unavailable" } };
      }
    },
  };
}
