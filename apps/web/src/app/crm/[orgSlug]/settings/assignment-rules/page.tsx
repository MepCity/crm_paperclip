import { PageTitle } from "@/components/shell/page-title";
import { requireOrgContext } from "@/lib/session";
import { shellPageMetadata, shellPageTitle } from "@/lib/shell-page-title";
import { AssignmentRulesScreen } from "@/modules/assignment-rules/assignment-rules-screen";
import { createSyntheticAssignmentRulesPort } from "@/modules/assignment-rules/fixture-port";

export const metadata = shellPageMetadata(shellPageTitle.settings);

export default async function AssignmentRulesPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const ctx = await requireOrgContext(orgSlug);
  const result = await createSyntheticAssignmentRulesPort(ctx.orgId).list(ctx, {
    kind: "assignment",
    limit: 50,
  });
  return (
    <>
      <PageTitle title={shellPageTitle.settings} />
      <AssignmentRulesScreen result={result} />
    </>
  );
}
