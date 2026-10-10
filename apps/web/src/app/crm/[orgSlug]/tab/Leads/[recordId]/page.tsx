import { notFound } from "next/navigation";
import { PageTitle } from "@/components/shell/page-title";
import { requireOrgContext } from "@/lib/session";
import { shellPageMetadata, shellPageTitle } from "@/lib/shell-page-title";
import { LeadsDetailClient } from "@/modules/leads/leads-detail-client";

export const metadata = shellPageMetadata(shellPageTitle.leads);

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
      <PageTitle title={shellPageTitle.leads} />
      <LeadsDetailClient orgSlug={orgSlug} recordId={recordId} />
    </>
  );
}
