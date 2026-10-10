import { Suspense } from "react";
import "@/components/records/list/module-list-page.css";
import { PageTitle } from "@/components/shell/page-title";
import { requireOrgContext } from "@/lib/session";
import { LeadsListClient } from "@/modules/leads/leads-list-client";

function ListLoadingShell() {
  return <div className="module-list-page min-h-full" aria-hidden="true" />;
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
