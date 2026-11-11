import { PageTitle } from "@/components/shell/page-title";
import { getUiTranslations } from "@/i18n/request";
import { requireFeatureView } from "@/lib/access/settings-gate";
import { shellPageMetadata, shellPageTitle } from "@/lib/shell-page-title";
import { JourneyReportScreen } from "@/modules/journeys/journey-report-screen";

export const metadata = shellPageMetadata(shellPageTitle.settings);

export default async function JourneyReportPage({
  params,
}: {
  params: Promise<{ orgSlug: string; id: string }>;
}) {
  const { orgSlug, id } = await params;
  await requireFeatureView(orgSlug, "journeys");
  const t = await getUiTranslations();

  return (
    <>
      <PageTitle title={t("modules.journeys.list.title")} />
      <JourneyReportScreen orgSlug={orgSlug} journeyId={id} />
    </>
  );
}
