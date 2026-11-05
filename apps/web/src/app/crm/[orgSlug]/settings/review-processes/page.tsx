import { PageTitle } from "@/components/shell/page-title";
import { getUiTranslations } from "@/i18n/request";
import { requireSettingsOrg } from "@/lib/access/settings-gate";
import { shellPageMetadata, shellPageTitle } from "@/lib/shell-page-title";
import { ReviewProcessListScreen } from "@/modules/approvals/review-process-list-screen";

export const metadata = shellPageMetadata(shellPageTitle.settings);

export default async function ReviewProcessesPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  await requireSettingsOrg(orgSlug, "manageAutomation");
  const t = await getUiTranslations();
  return (
    <>
      <PageTitle title={t("shell.settings")} />
      <ReviewProcessListScreen orgSlug={orgSlug} />
    </>
  );
}
