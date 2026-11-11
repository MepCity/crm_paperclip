import { PageTitle } from "@/components/shell/page-title";
import { getUiTranslations } from "@/i18n/request";
import { requireFeatureView } from "@/lib/access/settings-gate";
import { shellPageMetadata, shellPageTitle } from "@/lib/shell-page-title";
import { CadenceReportScreen } from "@/modules/cadences/cadence-report-screen";

export const metadata = shellPageMetadata(shellPageTitle.settings);

export default async function CadenceReportPage({
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
      <CadenceReportScreen orgSlug={orgSlug} cadenceId={id} />
    </>
  );
}
