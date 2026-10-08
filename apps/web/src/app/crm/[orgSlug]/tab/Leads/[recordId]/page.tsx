import { PageTitle } from "@/components/shell/page-title";
import { requireOrgContext } from "@/lib/session";
import { LeadsDetailClient } from "@/modules/leads/leads-detail-client";

export default async function LeadRecordPage({
  params,
}: {
  params: Promise<{ orgSlug: string; recordId: string }>;
}) {
  const { orgSlug, recordId } = await params;
  await requireOrgContext(orgSlug);
  return (
    <>
      <PageTitle title="Leads" />
      <LeadsDetailClient orgSlug={orgSlug} recordId={recordId} />
    </>
  );
}
