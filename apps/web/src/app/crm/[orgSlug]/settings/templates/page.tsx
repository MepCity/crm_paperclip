import { PageHeader } from "@/components/shell/page-header";
import { PageTitle } from "@/components/shell/page-title";
import { requireOrgContext } from "@/lib/session";
import { shellPageMetadata, shellPageTitle } from "@/lib/shell-page-title";
import { EmailTemplatesScreen } from "@/modules/email-templates/email-templates-screen";

export const metadata = shellPageMetadata(shellPageTitle.settings);

export default async function TemplatesSettingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ orgSlug: string }>;
  searchParams: Promise<{ type?: string }>;
}) {
  const { orgSlug } = await params;
  await requireOrgContext(orgSlug);
  const { type = "email" } = await searchParams;

  return (
    <>
      <PageTitle title={shellPageTitle.settings} />
      <PageHeader description="Email templates." />
      <EmailTemplatesScreen initialType={type} orgSlug={orgSlug} />
    </>
  );
}
