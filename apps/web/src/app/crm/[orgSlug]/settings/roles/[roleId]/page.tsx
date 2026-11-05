import { PageTitle } from "@/components/shell/page-title";
import { shellPageMetadata, shellPageTitle } from "@/lib/shell-page-title";
import { RoleDetailScreen } from "@/modules/settings-access/roles-screen";
import { TabbedSettingsPage } from "@/modules/settings-access/settings-tabs";
import { AccessPage } from "@/server/access/page-gate";

export const metadata = shellPageMetadata(shellPageTitle.settings);

export default async function RoleDetailPage({
  params,
}: {
  params: Promise<{ orgSlug: string; roleId: string }>;
}) {
  const { orgSlug, roleId } = await params;
  return (
    <>
      <PageTitle title={shellPageTitle.settings} />
      <AccessPage orgSlug={orgSlug}>
        <TabbedSettingsPage set="roles" orgSlug={orgSlug}>
          <RoleDetailScreen orgSlug={orgSlug} roleId={roleId} />
        </TabbedSettingsPage>
      </AccessPage>
    </>
  );
}
