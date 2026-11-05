import { PageTitle } from "@/components/shell/page-title";
import { requireOrgContext } from "@/lib/session";
import { ApprovalProcessListScreen } from "@/modules/approvals/approval-process-list-screen";

export const metadata = { title: "Approval Processes" };

export default async function ApprovalProcessesPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  await requireOrgContext(orgSlug);
  return (
    <>
      <PageTitle title="Settings" />
      <ApprovalProcessListScreen orgSlug={orgSlug} />
    </>
  );
}
