import { notFound } from "next/navigation";
import { PageTitle } from "@/components/shell/page-title";
import { persistentReportsPort } from "@/lib/definitions/reports";
import { requireOrgContext } from "@/lib/session";
import { ReportDetailScreen } from "@/modules/reports/report-detail-screen";

export const metadata = { title: "Report" };

export default async function ReportPage({
  params,
}: {
  params: Promise<{ orgSlug: string; reportId: string }>;
}) {
  const { orgSlug, reportId } = await params;
  const ctx = await requireOrgContext(orgSlug);
  const port = await persistentReportsPort(ctx);
  const report = await port.getReport(reportId);
  if (!report) notFound();

  async function getReport(id: string) {
    "use server";
    const innerCtx = await requireOrgContext(orgSlug);
    return (await persistentReportsPort(innerCtx)).getReport(id);
  }

  async function listReports() {
    "use server";
    const innerCtx = await requireOrgContext(orgSlug);
    return (await persistentReportsPort(innerCtx)).listReports();
  }

  return (
    <>
      <PageTitle title={report.name} />
      <ReportDetailScreen
        orgSlug={orgSlug}
        reportId={reportId}
        initialReport={report}
        editable={!reportId.startsWith("sample-report-")}
        port={{ getReport, listReports }}
      />
    </>
  );
}
