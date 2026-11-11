import { PageTitle } from "@/components/shell/page-title";
import { getUiTranslations } from "@/i18n/request";
import { requireFeatureView } from "@/lib/access/settings-gate";
import { shellPageMetadata, shellPageTitle } from "@/lib/shell-page-title";
import { JourneysListScreen } from "@/modules/journeys/journeys-list-screen";

export const metadata = shellPageMetadata(shellPageTitle.settings);

export default async function JourneyBuilderPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  await requireFeatureView(orgSlug, "journeys");
  const t = await getUiTranslations();

  return (
    <>
      <PageTitle title={t("modules.journeys.list.title")} />
      <JourneysListScreen orgSlug={orgSlug} />
    </>
  );
}
