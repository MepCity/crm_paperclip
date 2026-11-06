import { notFound } from "next/navigation";
import { reportFields, runReport, saveReport } from "@/lib/definitions/actions";
import { definitionPorts } from "@/lib/definitions/ports";
import { requireOrgContext } from "@/lib/session";
import { ReportEditScreen } from "@/modules/reports/report-edit-screen";

export default async function ReportEditPage({
  params,
}: {
  params: Promise<{ orgSlug: string; reportId: string }>;
}) {
  const { orgSlug, reportId } = await params;
  const ctx = await requireOrgContext(orgSlug);
  const result = await (await definitionPorts()).reports.get(ctx, reportId);
  if (!result.ok) {
    if (result.error.code === "not_found") notFound();
    throw new Error("Report unavailable");
  }
  return (
    <ReportEditScreen
      orgSlug={orgSlug}
      definition={result.value}
      actions={{
        fields: reportFields.bind(null, orgSlug),
        run: runReport.bind(null, orgSlug),
        save: saveReport.bind(null, orgSlug),
      }}
    />
  );
}
