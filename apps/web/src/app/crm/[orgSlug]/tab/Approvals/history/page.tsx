import { PageTitle } from "@/components/shell/page-title";
import { requireOrgContext } from "@/lib/session";
import { ReviewLogsScreen } from "@/modules/approvals/review-logs-screen";

export const metadata = { title: "Review Logs" };

export default async function ApprovalsHistoryPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  await requireOrgContext(orgSlug);
  return (
    <>
      <PageTitle title="My Jobs" />
      <ReviewLogsScreen orgSlug={orgSlug} />
    </>
  );
}
