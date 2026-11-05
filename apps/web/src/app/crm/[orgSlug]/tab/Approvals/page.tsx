import { PageTitle } from "@/components/shell/page-title";
import { getUiTranslations } from "@/i18n/request";
import { requireOrgContext } from "@/lib/session";
import { shellPageTitle } from "@/lib/shell-page-title";
import { MyJobsScreen } from "@/modules/approvals/my-jobs-screen";

export const metadata = { title: shellPageTitle.myJobs };

export default async function ApprovalsPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = await params;
  await requireOrgContext(orgSlug);
  const t = await getUiTranslations();
  return (
    <>
      <PageTitle title={t("shell.my-jobs")} />
      <MyJobsScreen orgSlug={orgSlug} />
    </>
  );
}
