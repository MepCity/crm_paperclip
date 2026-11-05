import { PageTitle } from "@/components/shell/page-title";
import { getUiTranslations } from "@/i18n/request";
import { requireOrgContext } from "@/lib/session";
import { shellPageMetadata, shellPageTitle } from "@/lib/shell-page-title";
import { ReviewProcessFormScreen } from "@/modules/approvals/review-process-form-screen";

export const metadata = shellPageMetadata(shellPageTitle.settings);

export default async function NewReviewProcessPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  await requireOrgContext(orgSlug);
  const t = await getUiTranslations();
  return (
    <>
      <PageTitle title={t("shell.settings")} />
      <ReviewProcessFormScreen orgSlug={orgSlug} />
    </>
  );
}
