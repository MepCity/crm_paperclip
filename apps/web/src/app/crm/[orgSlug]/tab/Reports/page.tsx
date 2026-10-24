import { PageTitle } from "@/components/shell/page-title";
import { loadOrganizationFormat } from "@/lib/format-settings";
import { getRecordService } from "@/lib/records";
import { requireOrgContext } from "@/lib/session";
import { createRecordReportsPort } from "@/modules/reports/record-port";
import { ReportsScreen } from "@/modules/reports/reports-screen";

export const metadata = { title: "Reports" };

export default async function ReportsPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = await params;
  const ctx = await requireOrgContext(orgSlug);
  const format = await loadOrganizationFormat();
  const port = createRecordReportsPort(getRecordService(ctx), { format });
  const initialReports = await port.listReports();

  return (
    <>
      <PageTitle title="Reports" />
      <ReportsScreen orgSlug={orgSlug} initialReports={initialReports} />
    </>
  );
}
