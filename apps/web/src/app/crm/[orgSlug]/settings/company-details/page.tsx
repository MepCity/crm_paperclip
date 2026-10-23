import { PageHeader } from "@/components/shell/page-header";
import { PageTitle } from "@/components/shell/page-title";
import { requireOrgContext } from "@/lib/session";
import { shellPageMetadata, shellPageTitle } from "@/lib/shell-page-title";
import { CompanyDetailsScreen } from "@/modules/settings-company/company-details-screen";

export const metadata = shellPageMetadata(shellPageTitle.settings);

export default async function CompanyDetailsPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  await requireOrgContext(orgSlug);
  return (
    <>
      <PageTitle title={shellPageTitle.settings} />
      <PageHeader description="Company Details." />
      <CompanyDetailsScreen orgSlug={orgSlug} />
    </>
  );
}
