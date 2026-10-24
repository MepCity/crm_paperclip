import { PageTitle } from "@/components/shell/page-title";
import { requireUser } from "@/lib/session";
import { shellPageMetadata, shellPageTitle } from "@/lib/shell-page-title";
import { HomeOnboarding } from "@/modules/home/home-onboarding";

export const metadata = shellPageMetadata(shellPageTitle.home);

export default async function HomePage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = await params;
  const user = await requireUser(`/crm/${orgSlug}`);
  return (
    <>
      <PageTitle title={shellPageTitle.home} />
      <HomeOnboarding orgSlug={orgSlug} userName={user.name} />
    </>
  );
}
