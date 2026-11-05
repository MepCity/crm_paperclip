import { PageTitle } from "@/components/shell/page-title";
import { shellPageMetadata, shellPageTitle } from "@/lib/shell-page-title";
import { ProfilesScreen } from "@/modules/settings-access/profiles-screen";
import { AccessPage } from "@/server/access/page-gate";

export const metadata = shellPageMetadata(shellPageTitle.settings);

export default async function ProfilesPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = await params;
  return (
    <>
      <PageTitle title={shellPageTitle.settings} />
      <AccessPage orgSlug={orgSlug}>
        <ProfilesScreen orgSlug={orgSlug} />
      </AccessPage>
    </>
  );
}
