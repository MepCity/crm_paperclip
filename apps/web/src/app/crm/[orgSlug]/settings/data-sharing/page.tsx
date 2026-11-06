import { PageTitle } from "@/components/shell/page-title";
import { shellPageMetadata, shellPageTitle } from "@/lib/shell-page-title";
import { DataSharingScreen } from "@/modules/settings-access/data-sharing-screen";
import { TabbedSettingsPage } from "@/modules/settings-access/settings-tabs";
import { AccessPage } from "@/server/access/page-gate";

export const metadata = shellPageMetadata(shellPageTitle.settings);

export default async function DataSharingPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  return (
    <>
      <PageTitle title={shellPageTitle.settings} />
      <AccessPage orgSlug={orgSlug}>
        <TabbedSettingsPage set="roles" orgSlug={orgSlug}>
          <DataSharingScreen orgSlug={orgSlug} />
        </TabbedSettingsPage>
      </AccessPage>
    </>
  );
}
