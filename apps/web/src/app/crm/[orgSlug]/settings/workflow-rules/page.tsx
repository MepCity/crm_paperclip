import { PageTitle } from "@/components/shell/page-title";
import { requireOrgContext } from "@/lib/session";
import { shellPageMetadata, shellPageTitle } from "@/lib/shell-page-title";
import { createAutomationPort } from "@/modules/automation/port";
import { getSyntheticWorkflowFixtures } from "@/modules/workflow-rules/fixtures";
import { WorkflowRulesListScreen } from "@/modules/workflow-rules/workflow-rules-list-screen";

export const metadata = shellPageMetadata(shellPageTitle.settings);

export default async function WorkflowRulesPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const ctx = await requireOrgContext(orgSlug);
  const fixtures = getSyntheticWorkflowFixtures(ctx.orgId);
  const port = createAutomationPort({ fixtures });
  const result = await port.list(ctx, {
    kind: "workflow",
    limit: 50,
  });

  return (
    <>
      <PageTitle title={shellPageTitle.settings} />
      <WorkflowRulesListScreen orgSlug={orgSlug} ctx={ctx} initialResult={result} />
    </>
  );
}
