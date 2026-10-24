import { listMembers } from "@crm/core";
import { PageTitle } from "@/components/shell/page-title";
import { loadOrganizationFormat } from "@/lib/format-settings";
import { getRecordService } from "@/lib/records";
import { requireOrgContext } from "@/lib/session";
import { AnalyticsScreen } from "@/modules/analytics/analytics-screen";
import { createRecordAnalyticsPort } from "@/modules/analytics/record-port";

export const metadata = { title: "Analytics" };

export default async function DashboardsPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = await params;
  await requireOrgContext(orgSlug);
  async function getDashboard() {
    "use server";
    const ctx = await requireOrgContext(orgSlug);
    const members = await listMembers(ctx);
    const format = await loadOrganizationFormat();
    return createRecordAnalyticsPort(getRecordService(ctx), {
      ownerNames: new Map(members.map((member) => [member.userId, member.name])),
      format,
    }).getDashboard();
  }
  return (
    <>
      <PageTitle title="Analytics" />
      <AnalyticsScreen orgSlug={orgSlug} port={{ getDashboard }} />
    </>
  );
}
