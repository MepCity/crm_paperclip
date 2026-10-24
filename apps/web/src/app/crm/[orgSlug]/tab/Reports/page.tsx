import { PageTitle } from "@/components/shell/page-title";
import { getRecordService } from "@/lib/records";
import { requireOrgContext } from "@/lib/session";
import { createRecordReportsPort } from "@/modules/reports/record-port";
import { ReportsScreen } from "@/modules/reports/reports-screen";

export const metadata = { title: "Reports" };

export default async function ReportsPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = await params;
  const ctx = await requireOrgContext(orgSlug);
  const port = createRecordReportsPort(getRecordService(ctx));
  const initialReports = await port.listReports();

  return (
    <>
      <PageTitle title="Reports" />
      <ReportsScreen orgSlug={orgSlug} initialReports={initialReports} />
    </>
  );
}
