import { PageTitle } from "@/components/shell/page-title";
import { requireOrgContext } from "@/lib/session";
import { shellPageMetadata, shellPageTitle } from "@/lib/shell-page-title";
import { EmailSettingsScreen } from "@/modules/email-settings/email-settings-screen";

export const metadata = shellPageMetadata(shellPageTitle.settings);

export default async function EmailParserPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  await requireOrgContext(orgSlug);
  return (
    <>
      <PageTitle title={shellPageTitle.settings} />
      <EmailSettingsScreen orgSlug={orgSlug} area="email-parser" />
    </>
  );
}
