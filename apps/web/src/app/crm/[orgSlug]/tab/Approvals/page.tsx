import { PageTitle } from "@/components/shell/page-title";
import { requireOrgContext } from "@/lib/session";
import { MyJobsScreen } from "@/modules/approvals/my-jobs-screen";

export const metadata = { title: "My Jobs" };

export default async function ApprovalsPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = await params;
  await requireOrgContext(orgSlug);
  return (
    <>
      <PageTitle title="My Jobs" />
      <MyJobsScreen orgSlug={orgSlug} />
    </>
  );
}
