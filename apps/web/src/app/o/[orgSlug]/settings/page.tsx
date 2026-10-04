import { PageHeader } from "@/components/shell/page-header";
import { PageTitle } from "@/components/shell/page-title";
import { Card, CardContent } from "@/components/ui/card";
import { requireOrgContext } from "@/lib/session";

export default async function GeneralSettingsPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>;
}) {
  const { orgSlug } = await params;
  const org = await requireOrgContext(orgSlug);
  return (
    <>
      <PageTitle title="Settings" />
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
    </>
  );
}
