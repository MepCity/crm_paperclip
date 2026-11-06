import { PageTitle } from "@/components/shell/page-title";
import { getUiTranslations } from "@/i18n/request";
import { reportFields, runReport, saveReport } from "@/lib/definitions/actions";
import { persistentReportsPort } from "@/lib/definitions/reports";
import { requireOrgContext } from "@/lib/session";
import { ReportsScreen } from "@/modules/reports/reports-screen";

export const metadata = { title: "Reports" };

export default async function ReportsPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = await params;
  const ctx = await requireOrgContext(orgSlug);
  const port = await persistentReportsPort(ctx);
  let initialReports: Awaited<ReturnType<typeof port.listReports>> | undefined;
  try {
    initialReports = await port.listReports();
  } catch {
    initialReports = undefined;
  }

  const t = await getUiTranslations();
  return (
    <>
      <PageTitle title={t("shell.reports")} />
      <ReportsScreen
        orgSlug={orgSlug}
        initialReports={initialReports ?? []}
        initialError={!initialReports}
        builderActions={{
          fields: reportFields.bind(null, orgSlug),
          run: runReport.bind(null, orgSlug),
          save: saveReport.bind(null, orgSlug),
        }}
      />
    </>
  );
}
