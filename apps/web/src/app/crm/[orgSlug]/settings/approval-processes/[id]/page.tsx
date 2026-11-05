import { PageTitle } from "@/components/shell/page-title";
import { requireOrgContext } from "@/lib/session";
import { ApprovalProcessFormScreen } from "@/modules/approvals/approval-process-form-screen";

export const metadata = { title: "Edit Approval Process" };

export default async function EditApprovalProcessPage({
  params,
}: {
  params: Promise<{ orgSlug: string; id: string }>;
}) {
  const { orgSlug, id } = await params;
  await requireOrgContext(orgSlug);
  return (
    <>
      <PageTitle title="Settings" />
      <ApprovalProcessFormScreen orgSlug={orgSlug} processId={id} />
    </>
  );
}
