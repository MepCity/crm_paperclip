import { PageTitle } from "@/components/shell/page-title";
import { getUiTranslations } from "@/i18n/request";
import { requireOrgContext } from "@/lib/session";
import { shellPageMetadata, shellPageTitle } from "@/lib/shell-page-title";
import { ApprovalProcessFormScreen } from "@/modules/approvals/approval-process-form-screen";

export const metadata = shellPageMetadata(shellPageTitle.settings);

export default async function EditApprovalProcessPage({
  params,
}: {
  params: Promise<{ orgSlug: string; id: string }>;
}) {
  const { orgSlug, id } = await params;
  await requireOrgContext(orgSlug);
  const t = await getUiTranslations();
  return (
    <>
      <PageTitle title={t("shell.settings")} />
      <ApprovalProcessFormScreen orgSlug={orgSlug} processId={id} />
    </>
  );
}
