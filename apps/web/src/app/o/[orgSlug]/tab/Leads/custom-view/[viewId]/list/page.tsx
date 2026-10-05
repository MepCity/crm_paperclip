import { Suspense } from "react";
import "@/components/records/list/module-list-page.css";
import { PageTitle } from "@/components/shell/page-title";
import { requireOrgContext } from "@/lib/session";
import { LeadsListClient } from "@/modules/leads/leads-list-client";

function ListLoadingShell() {
  return <div className="module-list-page min-h-full" aria-hidden="true" />;
}

export default async function LeadsCustomListPage({
  params,
}: {
  params: Promise<{ orgSlug: string; viewId: string }>;
}) {
  const { orgSlug, viewId } = await params;
  await requireOrgContext(orgSlug);
  return (
    <>
      <PageTitle title="Leads" />
      <Suspense fallback={<ListLoadingShell />}>
        <LeadsListClient orgSlug={orgSlug} viewId={viewId} />
      </Suspense>
    </>
  );
}
