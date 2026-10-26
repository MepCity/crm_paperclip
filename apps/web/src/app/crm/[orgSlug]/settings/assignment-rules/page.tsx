import { PageTitle } from "@/components/shell/page-title";
import { getUiTranslations } from "@/i18n/request";
import { requireOrgContext } from "@/lib/session";
import { shellPageMetadata, shellPageTitle } from "@/lib/shell-page-title";
import { AssignmentRulesScreen } from "@/modules/assignment-rules/assignment-rules-screen";
import { createAutomationPort } from "@/modules/automation/port";

export const metadata = shellPageMetadata(shellPageTitle.settings);

export default async function AssignmentRulesPage({
  params,
  searchParams,
}: {
  params: Promise<{ orgSlug: string }>;
  searchParams: Promise<{ module?: string; cursor?: string }>;
}) {
  const { orgSlug } = await params;
  const { module, cursor } = await searchParams;
  const ctx = await requireOrgContext(orgSlug);
  const result = await createAutomationPort().list(ctx, {
    kind: "assignment",
    ...(module ? { module } : {}),
    ...(cursor ? { cursor } : {}),
    limit: 50,
  });
  const t = await getUiTranslations();
  return (
    <>
      <PageTitle title={t("shell.settings")} />
      <AssignmentRulesScreen result={result} orgSlug={orgSlug} module={module} />
    </>
  );
}
