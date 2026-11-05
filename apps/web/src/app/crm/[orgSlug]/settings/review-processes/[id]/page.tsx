import { PageTitle } from "@/components/shell/page-title";
import { getUiTranslations } from "@/i18n/request";
import { requireSettingsOrg } from "@/lib/access/settings-gate";
import { shellPageMetadata, shellPageTitle } from "@/lib/shell-page-title";
import { ReviewProcessFormScreen } from "@/modules/approvals/review-process-form-screen";

export const metadata = shellPageMetadata(shellPageTitle.settings);

export default async function EditReviewProcessPage({
  params,
}: {
  params: Promise<{ orgSlug: string; id: string }>;
}) {
  const { orgSlug, id } = await params;
  await requireSettingsOrg(orgSlug, "manageAutomation");
  const t = await getUiTranslations();
  return (
    <>
      <PageTitle title={t("shell.settings")} />
      <ReviewProcessFormScreen orgSlug={orgSlug} processId={id} />
    </>
  );
}
