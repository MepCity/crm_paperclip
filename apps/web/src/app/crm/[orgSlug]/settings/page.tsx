import { PageHeader } from "@/components/shell/page-header";
import { PageTitle } from "@/components/shell/page-title";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "@/components/ui/link";
import { requireOrgContext } from "@/lib/session";
import { shellPageMetadata, shellPageTitle } from "@/lib/shell-page-title";

export const metadata = shellPageMetadata(shellPageTitle.settings);

export default async function GeneralSettingsPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const org = await requireOrgContext(orgSlug);
  return (
    <>
      <PageTitle title={shellPageTitle.settings} />
      <PageHeader description="Organization details." />
      <Card>
        <CardContent>
          <dl className="space-y-4 text-md">
            <div>
              <dt className="text-text-muted">Organization name</dt>
              <dd className="mt-1 break-words font-semibold">{org.orgName}</dd>
            </div>
            <div>
              <dt className="text-text-muted">Organization address</dt>
              <dd className="mt-1 break-all">{org.orgSlug}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
      <Card className="mt-6">
        <CardContent>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-text-muted">
            General
          </h2>
          <div className="flex flex-wrap gap-6">
            <Link href={`/crm/${orgSlug}/settings/personal-settings`}>Personal Settings</Link>
            <Link href={`/crm/${orgSlug}/settings/company-details`}>Company Details</Link>
            <Link href={`/crm/${orgSlug}/settings/currencies`}>Currencies</Link>
          </div>
        </CardContent>
      </Card>
      <Card className="mt-6">
        <CardContent>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-text-muted">
            Customization
          </h2>
          <div>
            <Link
              href={`/crm/${orgSlug}/settings/templates?type=email`}
              className="text-md text-accent-blue hover:underline"
            >
              Templates
            </Link>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
