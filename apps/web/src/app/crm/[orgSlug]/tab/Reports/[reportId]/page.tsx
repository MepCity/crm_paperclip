import { notFound } from "next/navigation";
import { PageTitle } from "@/components/shell/page-title";
import { requireOrgContext } from "@/lib/session";
import { fixtureReportsPort } from "@/modules/reports/fixture-port";
import { ReportDetailScreen } from "@/modules/reports/report-detail-screen";

export const metadata = { title: "Report" };

export default async function ReportPage({
  params,
}: {
  params: Promise<{ orgSlug: string; reportId: string }>;
}) {
  const { orgSlug, reportId } = await params;
  await requireOrgContext(orgSlug);
  const report = await fixtureReportsPort.getReport(reportId);
  if (!report) notFound();
  return (
    <>
      <PageTitle title={report.name} />
      <ReportDetailScreen orgSlug={orgSlug} reportId={reportId} />
    </>
  );
}
