import { PageTitle } from "@/components/shell/page-title";
import { requireOrgContext } from "@/lib/session";
import { LeadsFormClient } from "@/modules/leads/leads-form-client";

export default async function LeadFormPage({
  params,
}: {
  params: Promise<{ orgSlug: string; recordId: string }>;
}) {
  const { orgSlug, recordId } = await params;
  const context = await requireOrgContext(orgSlug);
  return (
    <>
      <PageTitle title="Leads" />
      <LeadsFormClient orgSlug={orgSlug} currentUserId={context.userId} recordId={recordId} />
    </>
  );
}
