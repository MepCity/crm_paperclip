import { PageTitle } from "@/components/shell/page-title";
import { requireOrgContext } from "@/lib/session";
import { FEEDS_LABEL } from "@/modules/feeds/feeds-labels";
import { FeedsScreen } from "@/modules/feeds/feeds-screen";

export const metadata = { title: FEEDS_LABEL };

export default async function FeedsPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = await params;
  const ctx = await requireOrgContext(orgSlug);
  return (
    <>
      <PageTitle title={FEEDS_LABEL} />
      <FeedsScreen orgSlug={orgSlug} userId={ctx.userId} />
    </>
  );
}
