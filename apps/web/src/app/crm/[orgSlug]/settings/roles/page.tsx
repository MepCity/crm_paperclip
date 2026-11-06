import { PageTitle } from "@/components/shell/page-title";
import { requireOrgContext } from "@/lib/session";
import { shellPageMetadata, shellPageTitle } from "@/lib/shell-page-title";
import { RolesScreen } from "@/modules/settings-access/roles-screen";
import { TabbedSettingsPage } from "@/modules/settings-access/settings-tabs";
import { AccessPage } from "@/server/access/page-gate";

export const metadata = shellPageMetadata(shellPageTitle.settings);

export default async function RolesPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = await params;
  const org = await requireOrgContext(orgSlug);
  return (
    <>
      <PageTitle title={shellPageTitle.settings} />
      <AccessPage orgSlug={orgSlug}>
        <TabbedSettingsPage set="roles" orgSlug={orgSlug}>
          <RolesScreen orgSlug={orgSlug} orgName={org.orgName} />
        </TabbedSettingsPage>
      </AccessPage>
    </>
  );
}
