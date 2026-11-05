import { PageTitle } from "@/components/shell/page-title";
import { requireSettingsOrg } from "@/lib/access/settings-gate";
import { shellPageMetadata, shellPageTitle } from "@/lib/shell-page-title";
import { CompanyDetailsScreen } from "@/modules/settings-company/company-details-screen";

export const metadata = shellPageMetadata(shellPageTitle.settings);

export default async function CompanyDetailsPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  await requireSettingsOrg(orgSlug, "userManagement");
  return (
    <>
      <PageTitle title={shellPageTitle.settings} />
      <CompanyDetailsScreen orgSlug={orgSlug} />
    </>
  );
}
