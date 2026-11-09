import { PageTitle } from "@/components/shell/page-title";
import { getUiTranslations } from "@/i18n/request";
import { requireSettingsOrg } from "@/lib/access/settings-gate";
import { shellPageMetadata, shellPageTitle } from "@/lib/shell-page-title";
import { WebformBuilderScreen } from "@/modules/webforms/webform-builder-screen";

export const metadata = shellPageMetadata(shellPageTitle.settings);

export default async function WebformEmbedPage({
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
      <WebformBuilderScreen orgSlug={orgSlug} formId={id} initialEmbedOpen />
    </>
  );
}
