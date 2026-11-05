import { PageTitle } from "@/components/shell/page-title";
import { requireOrgContext } from "@/lib/session";
import { ReviewProcessListScreen } from "@/modules/approvals/review-process-list-screen";

export const metadata = { title: "Review Processes" };

export default async function ReviewProcessesPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  await requireOrgContext(orgSlug);
  return (
    <>
      <PageTitle title="Settings" />
      <ReviewProcessListScreen orgSlug={orgSlug} />
    </>
  );
}
