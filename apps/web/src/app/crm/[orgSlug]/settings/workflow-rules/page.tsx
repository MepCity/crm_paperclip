import { PageTitle } from "@/components/shell/page-title";
import { getUiTranslations } from "@/i18n/request";
import { requireOrgContext } from "@/lib/session";
import { shellPageMetadata, shellPageTitle } from "@/lib/shell-page-title";
import { createAutomationPort } from "@/modules/automation/port";
import { readWorkflowRules } from "@/modules/workflow-rules/reads";
import { WorkflowRulesListScreen } from "@/modules/workflow-rules/workflow-rules-list-screen";

export const metadata = shellPageMetadata(shellPageTitle.settings);

export default async function WorkflowRulesPage({
  params,
  searchParams,
}: {
  params: Promise<{ orgSlug: string }>;
  searchParams: Promise<{ module?: string; cursor?: string }>;
}) {
  const { orgSlug } = await params;
  const ctx = await requireOrgContext(orgSlug);
  const { module, cursor } = await searchParams;
  const { result, triggerResults } = await readWorkflowRules(createAutomationPort(), ctx, {
    ...(module && module !== "all" ? { module } : {}),
    ...(cursor ? { cursor } : {}),
  });

  const t = await getUiTranslations();
  return (
    <>
      <PageTitle title={t("shell.settings")} />
      <WorkflowRulesListScreen
        orgSlug={orgSlug}
        result={result}
        triggerResults={triggerResults}
        module={module === "all" ? undefined : module}
        cursor={cursor}
      />
    </>
  );
}
