import { PageTitle } from "@/components/shell/page-title";
import { requireOrgContext } from "@/lib/session";
import { shellPageMetadata, shellPageTitle } from "@/lib/shell-page-title";
import { createAutomationPort } from "@/modules/automation/port";
import { getSyntheticWorkflowFixtures } from "@/modules/workflow-rules/fixtures";
import { WorkflowRuleDetailScreen } from "@/modules/workflow-rules/workflow-rule-detail-screen";

export const metadata = shellPageMetadata(shellPageTitle.settings);

export default async function WorkflowRuleDetailPage({
  params,
}: {
  params: Promise<{ orgSlug: string; ruleId: string }>;
}) {
  const { orgSlug, ruleId } = await params;
  const ctx = await requireOrgContext(orgSlug);
  const fixtures = getSyntheticWorkflowFixtures(ctx.orgId);
  const port = createAutomationPort({ fixtures });
  const result = await port.get(ctx, {
    kind: "workflow",
    id: ruleId,
  });

  return (
    <>
      <PageTitle title={shellPageTitle.settings} />
      <WorkflowRuleDetailScreen
        orgSlug={orgSlug}
        ruleId={ruleId}
        ctx={ctx}
        initialResult={
          result.ok && result.value.kind === "workflow"
            ? { ok: true, value: result.value }
            : undefined
        }
      />
    </>
  );
}
