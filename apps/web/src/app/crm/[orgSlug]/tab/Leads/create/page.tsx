import { PageTitle } from "@/components/shell/page-title";
import { requireOrgContext } from "@/lib/session";
import { shellPageMetadata, shellPageTitle } from "@/lib/shell-page-title";
import { LeadsFormClient } from "@/modules/leads/leads-form-client";

export const metadata = shellPageMetadata(shellPageTitle.leads);

export default async function LeadFormPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = await params;
  const context = await requireOrgContext(orgSlug);
  return (
    <>
      <PageTitle title={shellPageTitle.leads} />
      <LeadsFormClient orgSlug={orgSlug} currentUserId={context.userId} />
    </>
  );
}
