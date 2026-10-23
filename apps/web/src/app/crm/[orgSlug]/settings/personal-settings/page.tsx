import { PageHeader } from "@/components/shell/page-header";
import { PageTitle } from "@/components/shell/page-title";
import { requireOrgContext, requireUser } from "@/lib/session";
import { shellPageMetadata, shellPageTitle } from "@/lib/shell-page-title";
import { SettingsPersonalScreen } from "@/modules/settings-personal/settings-personal-screen";

export const metadata = shellPageMetadata(shellPageTitle.settings);

export default async function PersonalSettingsPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  await requireOrgContext(orgSlug);
  const user = await requireUser(`/crm/${orgSlug}/settings/personal-settings`);
  return (
    <>
      <PageTitle title={shellPageTitle.settings} />
      <PageHeader description="Personal Settings." />
      <SettingsPersonalScreen user={{ name: user.name, email: user.email }} />
    </>
  );
}
