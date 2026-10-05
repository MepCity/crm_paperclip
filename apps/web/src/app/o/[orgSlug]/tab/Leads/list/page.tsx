import { Suspense } from "react";
import { PageTitle } from "@/components/shell/page-title";
import { requireOrgContext } from "@/lib/session";
import { LeadsListClient } from "@/modules/leads/leads-list-client";

function ListLoadingShell() {
  return <div className="min-h-full bg-bg p-(--size-list-inset)" aria-hidden="true" />;
}

export default async function LeadsDefaultListPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  await requireOrgContext(orgSlug);
  return (
    <>
      <PageTitle title="Leads" />
      <Suspense fallback={<ListLoadingShell />}>
        <LeadsListClient orgSlug={orgSlug} />
      </Suspense>
    </>
  );
}
