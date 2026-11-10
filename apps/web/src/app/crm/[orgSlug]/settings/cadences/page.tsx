import { PageTitle } from "@/components/shell/page-title";
import { getUiTranslations } from "@/i18n/request";
import { requireFeatureView } from "@/lib/access/settings-gate";
import { shellPageMetadata, shellPageTitle } from "@/lib/shell-page-title";
import { CadencesListScreen } from "@/modules/cadences/cadences-list-screen";

export const metadata = shellPageMetadata(shellPageTitle.settings);

export default async function CadencesPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = await params;
  await requireFeatureView(orgSlug, "cadences");
  const t = await getUiTranslations();

  return (
    <>
      <PageTitle title={t("shell.cadences")} />
      <CadencesListScreen orgSlug={orgSlug} />
    </>
  );
}
