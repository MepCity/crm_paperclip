import { PageTitle } from "@/components/shell/page-title";
import { requireOrgContext } from "@/lib/session";
import { FeedsScreen } from "@/modules/feeds/feeds-screen";

export const metadata = { title: "Feeds" };

export default async function FeedsPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = await params;
  const ctx = await requireOrgContext(orgSlug);
  return (
    <>
      <PageTitle title="Feeds" />
      <FeedsScreen orgSlug={orgSlug} userId={ctx.userId} />
    </>
  );
}
