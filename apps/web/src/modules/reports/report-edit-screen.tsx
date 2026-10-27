"use client";

import type { ReportDefinition } from "@crm/core/definitions";
import { ReportBuilder, type ReportBuilderActions } from "./report-builder";
import { reportPath } from "./reports-screen";

export function ReportEditScreen({
  orgSlug,
  definition,
  actions,
}: {
  orgSlug: string;
  definition: ReportDefinition;
  actions: ReportBuilderActions;
}) {
  return (
    <ReportBuilder
      module={definition.module}
      initial={definition}
      actions={actions}
      onCancel={() => window.location.assign(reportPath(orgSlug, definition.id))}
      onSaved={(report) => window.location.assign(reportPath(orgSlug, report.id))}
    />
  );
}
