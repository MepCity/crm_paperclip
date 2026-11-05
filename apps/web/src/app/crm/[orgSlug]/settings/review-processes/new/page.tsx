import { PageTitle } from "@/components/shell/page-title";
import { requireOrgContext } from "@/lib/session";
import { ReviewProcessFormScreen } from "@/modules/approvals/review-process-form-screen";

export const metadata = { title: "New Review Process" };

export default async function NewReviewProcessPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  await requireOrgContext(orgSlug);
  return (
    <>
      <PageTitle title="Settings" />
      <ReviewProcessFormScreen orgSlug={orgSlug} />
    </>
  );
}
