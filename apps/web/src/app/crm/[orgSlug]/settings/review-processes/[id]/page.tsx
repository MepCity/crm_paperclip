import { PageTitle } from "@/components/shell/page-title";
import { requireOrgContext } from "@/lib/session";
import { ReviewProcessFormScreen } from "@/modules/approvals/review-process-form-screen";

export const metadata = { title: "Edit Review Process" };

export default async function EditReviewProcessPage({
  params,
}: {
  params: Promise<{ orgSlug: string; id: string }>;
}) {
  const { orgSlug, id } = await params;
  await requireOrgContext(orgSlug);
  return (
    <>
      <PageTitle title="Settings" />
      <ReviewProcessFormScreen orgSlug={orgSlug} processId={id} />
    </>
  );
}
