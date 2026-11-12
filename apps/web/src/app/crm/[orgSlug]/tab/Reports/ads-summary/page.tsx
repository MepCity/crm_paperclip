import { AccessDenied } from "@/components/shell/access-denied";
import { PageTitle } from "@/components/shell/page-title";
import { getUiTranslations } from "@/i18n/request";
import { canViewFeature } from "@/lib/access/settings-gate";
import { requireOrgContext } from "@/lib/session";
import { AdsSummaryReportScreen } from "@/modules/ads/ads-summary-report-screen";

export default async function AdsSummaryReportPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const ctx = await requireOrgContext(orgSlug);
  if (!(await canViewFeature(ctx, "reports"))) return <AccessDenied />;
  const t = await getUiTranslations();
  return (
    <>
      <PageTitle title={t("modules.adsSummary.title")} />
      <AdsSummaryReportScreen orgSlug={orgSlug} />
    </>
  );
}
