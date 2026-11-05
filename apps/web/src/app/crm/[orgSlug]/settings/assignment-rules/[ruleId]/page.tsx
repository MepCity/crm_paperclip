import { PageTitle } from "@/components/shell/page-title";
import { requireSettingsOrg } from "@/lib/access/settings-gate";
import { assignmentReadPort } from "@/lib/definitions/automation";
import { shellPageMetadata, shellPageTitle } from "@/lib/shell-page-title";
import { AssignmentRuleDetail } from "@/modules/assignment-rules/assignment-rule-detail";

export const metadata = shellPageMetadata(shellPageTitle.settings);

export default async function AssignmentRuleDetailPage({
  params,
}: {
  params: Promise<{ orgSlug: string; ruleId: string }>;
}) {
  const { orgSlug, ruleId } = await params;
  const ctx = await requireSettingsOrg(orgSlug, "manageAutomation");
  const result = await assignmentReadPort().get(ctx, { kind: "assignment", id: ruleId });
  return (
    <>
      <PageTitle title={shellPageTitle.settings} />
      <AssignmentRuleDetail
        result={result}
        listHref={`/crm/${orgSlug}/settings/assignment-rules`}
      />
    </>
  );
}
