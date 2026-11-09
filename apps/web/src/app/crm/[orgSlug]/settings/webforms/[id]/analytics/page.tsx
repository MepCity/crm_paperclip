import { PageTitle } from "@/components/shell/page-title";
import { getUiTranslations } from "@/i18n/request";
import { requireSettingsOrg } from "@/lib/access/settings-gate";
import { shellPageMetadata, shellPageTitle } from "@/lib/shell-page-title";
import { WebformAnalyticsScreen } from "@/modules/webforms/webform-analytics-screen";

export const metadata = shellPageMetadata(shellPageTitle.settings);

export default async function WebformAnalyticsPage({
  params,
}: {
  params: Promise<{ orgSlug: string; id: string }>;
}) {
  const { orgSlug, id } = await params;
  await requireSettingsOrg(orgSlug, "manageWebforms");
  const t = await getUiTranslations();
  return (
    <>
      <PageTitle title={t("shell.settings")} />
      <WebformAnalyticsScreen orgSlug={orgSlug} formId={id} />
    </>
  );
}
