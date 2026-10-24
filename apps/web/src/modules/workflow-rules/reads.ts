import type { AutomationPort, ReadResult, RulePage, WorkflowRule } from "@crm/core/automation";
import type { OrgContext } from "@crm/core/records";

/** Keep failed reads in the screen's existing error state, including rejected adapters. */
export async function readWorkflowRule(
  port: AutomationPort,
  ctx: OrgContext,
  id: string,
): Promise<ReadResult<WorkflowRule>> {
  try {
    const result = await port.get(ctx, { kind: "workflow", id });
    if (!result.ok) return result;
    return result.value.kind === "workflow"
      ? { ok: true, value: result.value }
      : { ok: false, error: { code: "unavailable" } };
  } catch {
    return { ok: false, error: { code: "unavailable" } };
  }
}

export async function readWorkflowRules(
  port: AutomationPort,
  ctx: OrgContext,
  query: { module?: string; cursor?: string },
) {
  let result: ReadResult<RulePage>;
  try {
    result = await port.list(ctx, { ...query, kind: "workflow", limit: 50 });
  } catch {
    result = { ok: false, error: { code: "unavailable" } };
  }
  const triggerResults: Record<string, ReadResult<WorkflowRule>> = {};
  // Read only this page's summaries, sequentially to bound adapter concurrency.
  if (result.ok) {
    for (const item of result.value.items) {
      if (!Object.hasOwn(triggerResults, item.id)) {
        triggerResults[item.id] = await readWorkflowRule(port, ctx, item.id);
      }
    }
  }
  return { result, triggerResults };
}
