import { PageTitle } from "@/components/shell/page-title";
import { requireOrgContext } from "@/lib/session";
import { VisitDetailScreen } from "@/modules/visits/visits-enabled-screen";

export const metadata = { title: "Visit" };

export default async function VisitDetailPage({
  params,
}: {
  params: Promise<{ orgSlug: string; visitId: string }>;
}) {
  const { orgSlug, visitId } = await params;
  await requireOrgContext(orgSlug);
  return (
    <>
      <PageTitle title="Visits" />
      <VisitDetailScreen orgSlug={orgSlug} visitId={visitId} />
    </>
  );
}
