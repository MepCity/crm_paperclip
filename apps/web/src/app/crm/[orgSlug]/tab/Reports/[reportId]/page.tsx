import { listMembers } from "@crm/core";
import { notFound } from "next/navigation";
import { PageTitle } from "@/components/shell/page-title";
import { loadOrganizationFormat } from "@/lib/format-settings";
import { getRecordService } from "@/lib/records";
import { requireOrgContext } from "@/lib/session";
import { createRecordReportsPort } from "@/modules/reports/record-port";
import { ReportDetailScreen } from "@/modules/reports/report-detail-screen";

export const metadata = { title: "Report" };

export default async function ReportPage({
  params,
}: {
  params: Promise<{ orgSlug: string; reportId: string }>;
}) {
  const { orgSlug, reportId } = await params;
  const ctx = await requireOrgContext(orgSlug);
  const members = await listMembers(ctx);
  const format = await loadOrganizationFormat();
  const port = createRecordReportsPort(getRecordService(ctx), {
    ownerNames: new Map(members.map((member) => [member.userId, member.name])),
    format,
  });
  const report = await port.getReport(reportId);
  if (!report) notFound();

  async function getReport(id: string) {
    "use server";
    const innerCtx = await requireOrgContext(orgSlug);
    const innerMembers = await listMembers(innerCtx);
    const innerFormat = await loadOrganizationFormat();
    return createRecordReportsPort(getRecordService(innerCtx), {
      ownerNames: new Map(innerMembers.map((member) => [member.userId, member.name])),
      format: innerFormat,
    }).getReport(id);
  }

  async function listReports() {
    "use server";
    const innerCtx = await requireOrgContext(orgSlug);
    const innerMembers = await listMembers(innerCtx);
    const innerFormat = await loadOrganizationFormat();
    return createRecordReportsPort(getRecordService(innerCtx), {
      ownerNames: new Map(innerMembers.map((member) => [member.userId, member.name])),
      format: innerFormat,
    }).listReports();
  }

  return (
    <>
      <PageTitle title={report.name} />
      <ReportDetailScreen
        orgSlug={orgSlug}
        reportId={reportId}
        initialReport={report}
        port={{ getReport, listReports }}
      />
    </>
  );
}
