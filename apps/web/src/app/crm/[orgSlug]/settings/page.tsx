import { PageTitle } from "@/components/shell/page-title";
import { requireOrgContext } from "@/lib/session";
import { shellPageMetadata, shellPageTitle } from "@/lib/shell-page-title";
import { SetupScreen } from "@/modules/setup/setup-screen";

export const metadata = shellPageMetadata(shellPageTitle.settings);

export default async function SettingsPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = await params;
  await requireOrgContext(orgSlug);
  return (
    <>
      <PageTitle title={shellPageTitle.settings} />
      <SetupScreen orgSlug={orgSlug} />
    </>
  );
}
