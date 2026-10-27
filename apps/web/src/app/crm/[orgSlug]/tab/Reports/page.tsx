import { PageTitle } from "@/components/shell/page-title";
import { getUiTranslations } from "@/i18n/request";
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

  const t = await getUiTranslations();
  return (
    <>
      <PageTitle title={t("shell.reports")} />
      <ReportsScreen orgSlug={orgSlug} initialReports={initialReports} />
    </>
  );
}
