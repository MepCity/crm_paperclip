import { PageTitle } from "@/components/shell/page-title";
import { requireOrgContext } from "@/lib/session";
import { shellPageMetadata, shellPageTitle } from "@/lib/shell-page-title";
import { createAutomationPort } from "@/modules/automation/port";
import { readWorkflowRule } from "@/modules/workflow-rules/reads";
import { WorkflowRuleDetailScreen } from "@/modules/workflow-rules/workflow-rule-detail-screen";

export const metadata = shellPageMetadata(shellPageTitle.settings);

export default async function WorkflowRuleDetailPage({
  params,
}: {
  params: Promise<{ orgSlug: string; ruleId: string }>;
}) {
  const { orgSlug, ruleId } = await params;
  const ctx = await requireOrgContext(orgSlug);
  const result = await readWorkflowRule(createAutomationPort(), ctx, ruleId);

  return (
    <>
      <PageTitle title={shellPageTitle.settings} />
      <WorkflowRuleDetailScreen orgSlug={orgSlug} ruleId={ruleId} result={result} />
    </>
  );
}
