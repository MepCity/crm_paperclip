import { PageTitle } from "@/components/shell/page-title";
import { requireOrgContext } from "@/lib/session";
import { ApprovalProcessFormScreen } from "@/modules/approvals/approval-process-form-screen";

export const metadata = { title: "New Approval Process" };

export default async function NewApprovalProcessPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  await requireOrgContext(orgSlug);
  return (
    <>
      <PageTitle title="Settings" />
      <ApprovalProcessFormScreen orgSlug={orgSlug} />
    </>
  );
}
