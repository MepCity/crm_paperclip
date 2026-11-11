import { PageTitle } from "@/components/shell/page-title";
import { getUiTranslations } from "@/i18n/request";
import { requireFeatureView } from "@/lib/access/settings-gate";
import { shellPageMetadata, shellPageTitle } from "@/lib/shell-page-title";
import { JourneyCanvasEditorScreen } from "@/modules/journeys/journey-canvas-editor-screen";

export const metadata = shellPageMetadata(shellPageTitle.settings);

export default async function JourneyCanvasPage({
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
      <JourneyCanvasEditorScreen orgSlug={orgSlug} journeyId={id} />
    </>
  );
}
