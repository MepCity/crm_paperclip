import { PageTitle } from "@/components/shell/page-title";
import { getUiTranslations } from "@/i18n/request";
import { requireOrgContext } from "@/lib/session";
import { ReviewLogsScreen } from "@/modules/approvals/review-logs-screen";

export const metadata = { title: "Gözden Geçirme Günlükleri" };

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
