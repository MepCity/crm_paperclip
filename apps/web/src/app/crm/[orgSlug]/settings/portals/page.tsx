import { PageTitle } from "@/components/shell/page-title";
import { getUiTranslations } from "@/i18n/request";
import { requireSettingsOrg } from "@/lib/access/settings-gate";
import { shellPageMetadata, shellPageTitle } from "@/lib/shell-page-title";
import { PortalSetupScreen } from "@/modules/settings-portals/portal-setup-screen";

export const metadata = shellPageMetadata(shellPageTitle.settings);

export default async function PortalsSettingsPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  await requireSettingsOrg(orgSlug, "managePortals");
  const t = await getUiTranslations();
  return (
    <>
      <PageTitle title={t("shell.settings")} />
      <PortalSetupScreen orgSlug={orgSlug} />
    </>
  );
}
