import { PageTitle } from "@/components/shell/page-title";
import { requireOrgContext } from "@/lib/session";
import { AnalyticsScreen } from "@/modules/analytics/analytics-screen";

export const metadata = { title: "Analytics" };

export default async function DashboardsPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = await params;
  await requireOrgContext(orgSlug);
  return (
    <>
      <PageTitle title="Analytics" />
      <AnalyticsScreen orgSlug={orgSlug} />
    </>
  );
}
