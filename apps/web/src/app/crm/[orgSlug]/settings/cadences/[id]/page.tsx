import { PageTitle } from "@/components/shell/page-title";
import { getUiTranslations } from "@/i18n/request";
import { requireFeatureView } from "@/lib/access/settings-gate";
import { shellPageMetadata, shellPageTitle } from "@/lib/shell-page-title";
import { CadenceEditorScreen } from "@/modules/cadences/cadence-editor-screen";

export const metadata = shellPageMetadata(shellPageTitle.settings);

export default async function CadenceDetailPage({
  params,
}: {
  params: Promise<{ orgSlug: string; id: string }>;
}) {
  const { orgSlug, id } = await params;
  await requireFeatureView(orgSlug, "cadences");
  const t = await getUiTranslations();

  return (
    <>
      <PageTitle title={t("shell.cadences")} />
      <CadenceEditorScreen orgSlug={orgSlug} cadenceId={id} />
    </>
  );
}
