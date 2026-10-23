import { PageHeader } from "@/components/shell/page-header";
import { PageTitle } from "@/components/shell/page-title";
import { requireOrgContext } from "@/lib/session";
import { shellPageMetadata, shellPageTitle } from "@/lib/shell-page-title";
import { SettingsModulesScreen } from "@/modules/settings-modules/settings-modules-screen";

export const metadata = shellPageMetadata(shellPageTitle.settings);

export default async function ModulesSettingsPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  await requireOrgContext(orgSlug);
  return (
    <>
      <PageTitle title={shellPageTitle.settings} />
      <PageHeader description="Modules and Fields." />
      <SettingsModulesScreen orgSlug={orgSlug} />
    </>
  );
}
