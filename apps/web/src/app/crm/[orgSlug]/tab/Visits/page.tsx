import { PageTitle } from "@/components/shell/page-title";
import { requireOrgContext } from "@/lib/session";
import { VisitsEntryScreen } from "@/modules/visits/visits-entry-screen";

export const metadata = { title: "Visits" };

export default async function VisitsPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = await params;
  await requireOrgContext(orgSlug);
  return (
    <>
      <PageTitle title="Visits" />
      <VisitsEntryScreen />
    </>
  );
}
