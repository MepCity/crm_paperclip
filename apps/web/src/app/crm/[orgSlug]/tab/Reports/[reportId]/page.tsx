import { notFound } from "next/navigation";
import { PageTitle } from "@/components/shell/page-title";
import { Link } from "@/components/ui/link";
import { requireOrgContext } from "@/lib/session";
import { fixtureReportsPort } from "@/modules/reports/fixture-port";

export const metadata = { title: "Report" };

export default async function ReportPage({
  params,
}: {
  params: Promise<{ orgSlug: string; reportId: string }>;
}) {
  const { orgSlug, reportId } = await params;
  await requireOrgContext(orgSlug);
  const report = (await fixtureReportsPort.listReports()).find((item) => item.id === reportId);
  if (!report) notFound();
  return (
    <section className="p-6">
      <PageTitle title={report.name} />
      <Link href={`/crm/${encodeURIComponent(orgSlug)}/tab/Reports`}>Back to Reports</Link>
      <h2 className="mt-4 text-xl font-semibold">{report.name}</h2>
      <p className="mt-4 text-text-muted">Report detail is not available yet.</p>
    </section>
  );
}
