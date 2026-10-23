import { notFound } from "next/navigation";
import { PageHeader } from "@/components/shell/page-header";
import { PageTitle } from "@/components/shell/page-title";
import { requireOrgContext } from "@/lib/session";
import { shellPageMetadata, shellPageTitle } from "@/lib/shell-page-title";
import { isAllowedSettingsModule } from "@/modules/settings-modules/fields-model";
import { defaultLayoutRow } from "@/modules/settings-modules/layouts-model";
import { LayoutsScreen } from "@/modules/settings-modules/layouts-screen";

export const metadata = shellPageMetadata(shellPageTitle.settings);

export default async function ModuleLayoutsPage({
  params,
}: {
  params: Promise<{ orgSlug: string; module: string }>;
}) {
  const { orgSlug, module } = await params;
  await requireOrgContext(orgSlug);
  const name = decodeURIComponent(module);
  if (!isAllowedSettingsModule(name)) notFound();
  return (
    <>
      <PageTitle title={shellPageTitle.settings} />
      <PageHeader description="Modules and Fields." />
      <LayoutsScreen orgSlug={orgSlug} module={name} rows={[defaultLayoutRow()]} />
    </>
  );
}
