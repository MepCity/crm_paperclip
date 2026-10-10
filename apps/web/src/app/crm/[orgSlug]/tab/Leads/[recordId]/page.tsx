import { notFound } from "next/navigation";
import { PageTitle } from "@/components/shell/page-title";
import { requireOrgContext } from "@/lib/session";
import { LeadsDetailClient } from "@/modules/leads/leads-detail-client";

/** Reserved under `/tab/Leads/`; the create form route is delivered in MEP-145. */
const RESERVED_LEAD_RECORD_SEGMENTS = new Set(["create"]);

export default async function LeadRecordPage({
  params,
}: {
  params: Promise<{ orgSlug: string; recordId: string }>;
}) {
  const { orgSlug, recordId } = await params;
  if (RESERVED_LEAD_RECORD_SEGMENTS.has(recordId)) notFound();
  await requireOrgContext(orgSlug);
  return (
    <>
      <PageTitle title="Leads" />
      <LeadsDetailClient orgSlug={orgSlug} recordId={recordId} />
    </>
  );
}
