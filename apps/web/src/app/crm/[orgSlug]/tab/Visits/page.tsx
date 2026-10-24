import { PageTitle } from "@/components/shell/page-title";
import { requireOrgContext } from "@/lib/session";
import { resolveVisitsAvailability } from "@/modules/visits/fixture";
import { VisitsEnabledScreen } from "@/modules/visits/visits-enabled-screen";
import { VisitsEntryScreen } from "@/modules/visits/visits-entry-screen";

export const metadata = { title: "Visits" };

export default async function VisitsPage({
  params,
  searchParams,
}: {
  params: Promise<{ orgSlug: string }>;
  searchParams: Promise<{ state?: string }>;
}) {
  const { orgSlug } = await params;
  const { state } = await searchParams;
  await requireOrgContext(orgSlug);
  const availability = resolveVisitsAvailability(state);
  return (
    <>
      <PageTitle title="Visits" />
      {availability === "disconnected" ? (
        <VisitsEntryScreen />
      ) : (
        <VisitsEnabledScreen orgSlug={orgSlug} availability={availability} />
      )}
    </>
  );
}
