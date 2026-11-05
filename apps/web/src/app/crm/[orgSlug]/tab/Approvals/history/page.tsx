import { PageTitle } from "@/components/shell/page-title";
import { getUiTranslations } from "@/i18n/request";
import { requireOrgContext } from "@/lib/session";
import { shellPageMetadata, shellPageTitle } from "@/lib/shell-page-title";
import { ReviewLogsScreen } from "@/modules/approvals/review-logs-screen";

export const metadata = shellPageMetadata(shellPageTitle.myJobs);

export default async function ApprovalsHistoryPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  await requireOrgContext(orgSlug);
  const t = await getUiTranslations();
  return (
    <>
      <PageTitle title={t("shell.my-jobs")} />
      <ReviewLogsScreen orgSlug={orgSlug} />
    </>
  );
}
