import { PageTitle } from "@/components/shell/page-title";
import { getUiTranslations } from "@/i18n/request";
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

  const t = await getUiTranslations();
  return (
    <>
      <PageTitle title={t("shell.settings")} />
      <EmailTemplatesScreen initialType={type} orgSlug={orgSlug} />
    </>
  );
}
