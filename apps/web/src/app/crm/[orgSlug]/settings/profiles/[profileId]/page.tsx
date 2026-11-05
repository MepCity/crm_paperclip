import { PageTitle } from "@/components/shell/page-title";
import { shellPageMetadata, shellPageTitle } from "@/lib/shell-page-title";
import { ProfileDetailScreen } from "@/modules/settings-access/profile-detail-screen";
import { AccessPage } from "@/server/access/page-gate";

export const metadata = shellPageMetadata(shellPageTitle.settings);

export default async function ProfileDetailPage({
  params,
}: {
  params: Promise<{ orgSlug: string; profileId: string }>;
}) {
  const { orgSlug, profileId } = await params;
  return (
    <>
      <PageTitle title={shellPageTitle.settings} />
      <AccessPage orgSlug={orgSlug}>
        <ProfileDetailScreen orgSlug={orgSlug} profileId={profileId} />
      </AccessPage>
    </>
  );
}
