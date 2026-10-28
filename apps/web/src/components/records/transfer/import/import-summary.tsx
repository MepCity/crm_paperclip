"use client";
import { Button } from "@/components/ui/button";
import { Link } from "@/components/ui/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { MessageKey } from "@/i18n/catalogs";
import { useUiTranslations } from "@/i18n/client-provider";
import { codeMessage, type ImportJob, skippedTotal } from "./types";

const MAX_ERROR_ROWS = 50;

const TITLES = {
  completed: "records.transfer.titleCompleted",
  completed_with_errors: "records.transfer.titleCompletedWithErrors",
  failed: "records.transfer.titleFailed",
  undone: "records.transfer.titleUndone",
} as const satisfies Record<ImportJob["status"], MessageKey>;

export interface ImportSummaryProps {
  job: ImportJob;
  historyHref: string;
  onDone(job: ImportJob): void;
}

export function ImportSummary({ job, historyHref, onDone }: ImportSummaryProps) {
  const t = useUiTranslations();
  const failures = job.rows.filter((r) => r.outcome === "error" || r.outcome === "skipped");
  const warnings = job.rows.filter((r) => r.outcome === "warning");
  const shown = failures.slice(0, MAX_ERROR_ROWS);
  const more = failures.length - shown.length;
  const warned = warnings.slice(0, MAX_ERROR_ROWS);
  const reason = (code?: string) => codeMessage(code, t) ?? code ?? "";
  const columns = (
    <TableHeader>
      <tr>
        <TableHead>{t("records.transfer.colRow")}</TableHead>
        <TableHead>{t("records.transfer.colFieldName")}</TableHead>
        <TableHead>{t("records.transfer.colReason")}</TableHead>
      </tr>
    </TableHeader>
  );
  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-lg font-semibold text-text">{t(TITLES[job.status])}</h2>
      <dl className="flex gap-8 text-sm">
        <div>
          <dt className="text-text-muted">{t("records.transfer.countAdded")}</dt>
          <dd data-testid="count-added">{job.counts.created}</dd>
        </div>
        <div>
          <dt className="text-text-muted">{t("records.transfer.countUpdated")}</dt>
          <dd data-testid="count-updated">{job.counts.updated}</dd>
        </div>
        <div>
          <dt className="text-text-muted">{t("records.transfer.countSkipped")}</dt>
          <dd data-testid="count-skipped">{skippedTotal(job.counts)}</dd>
        </div>
        <div>
          <dt className="text-text-muted">{t("records.transfer.countFailed")}</dt>
          <dd data-testid="count-failed">{job.counts.errors}</dd>
        </div>
        {job.counts.warnings ? (
          <div>
            <dt className="text-text-muted">{t("records.transfer.countWarnings")}</dt>
            <dd data-testid="count-warnings">{job.counts.warnings}</dd>
          </div>
        ) : null}
      </dl>
      {failures.length > 0 ? (
        <div className="flex flex-col gap-2">
          <Table>
            {columns}
            <TableBody columnCount={3}>
              {shown.map((r) => (
                <TableRow key={`${r.row}-${r.code ?? ""}-${r.field ?? ""}`}>
                  <TableCell>{r.row}</TableCell>
                  <TableCell>{r.field ?? ""}</TableCell>
                  <TableCell>{reason(r.code)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {more > 0 ? (
            <p className="text-sm text-text-muted">
              {t("records.transfer.andMore", { count: more })}
            </p>
          ) : null}
        </div>
      ) : null}
      {warned.length > 0 ? (
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-text">
            {t("records.transfer.warningsHeading")}
          </h3>
          <Table>
            {columns}
            <TableBody columnCount={3}>
              {warned.map((r) => (
                <TableRow key={`w-${r.row}-${r.field ?? ""}`}>
                  <TableCell>{r.row}</TableCell>
                  <TableCell>{r.field ?? ""}</TableCell>
                  <TableCell>{reason(r.code)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {warnings.length > warned.length ? (
            <p className="text-sm text-text-muted">
              {t("records.transfer.andMore", { count: warnings.length - warned.length })}
            </p>
          ) : null}
        </div>
      ) : null}
      <div className="flex items-center gap-4">
        <Link href={historyHref} variant="text">
          {t("records.transfer.viewHistory")}
        </Link>
        <Button onPress={() => onDone(job)}>{t("records.transfer.done")}</Button>
      </div>
    </div>
  );
}
