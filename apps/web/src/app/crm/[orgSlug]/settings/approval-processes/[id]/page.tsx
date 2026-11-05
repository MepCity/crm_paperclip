import { PageTitle } from "@/components/shell/page-title";
import { getUiTranslations } from "@/i18n/request";
import { requireSettingsOrg } from "@/lib/access/settings-gate";
import { shellPageMetadata, shellPageTitle } from "@/lib/shell-page-title";
import { ApprovalProcessFormScreen } from "@/modules/approvals/approval-process-form-screen";

export const metadata = shellPageMetadata(shellPageTitle.settings);

export default async function EditApprovalProcessPage({
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
      <ApprovalProcessFormScreen orgSlug={orgSlug} processId={id} />
    </>
  );
}
