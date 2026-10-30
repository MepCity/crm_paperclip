"use client";
import { useState } from "react";
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
import {
  displayStatus,
  downloadCsv,
  ISSUE_PAGE_SIZE,
  type IssueRow,
  issueRows,
  issuesCsv,
  issuesFileName,
} from "./issues";
import { codeMessage, type ImportJob } from "./types";

const TITLES = {
  completed: "records.transfer.titleCompleted",
  completed_with_warnings: "records.transfer.titleCompletedWithWarnings",
  completed_with_errors: "records.transfer.titleCompletedWithErrors",
  failed: "records.transfer.titleFailed",
  undone: "records.transfer.titleUndone",
} as const satisfies Record<ReturnType<typeof displayStatus>, MessageKey>;

export interface ImportSummaryProps {
  job: ImportJob;
  historyHref: string;
  onDone(job: ImportJob): void;
}

/** Rows of one kind, shown a page at a time so that none is out of reach. */
function IssueTable({
  rows,
  testId,
  keyPrefix,
}: {
  rows: readonly IssueRow[];
  testId: string;
  keyPrefix: string;
}) {
  const t = useUiTranslations();
  const [limit, setLimit] = useState(ISSUE_PAGE_SIZE);
  const shown = rows.slice(0, limit);
  const more = rows.length - shown.length;
  // The same row can carry several identical issues; a running count keeps the keys unique.
  const seen = new Map<string, number>();
  const keyOf = (r: IssueRow) => {
    const base = `${keyPrefix}-${r.row}-${r.code ?? ""}-${r.field ?? ""}`;
    const n = seen.get(base) ?? 0;
    seen.set(base, n + 1);
    return `${base}-${n}`;
  };
  return (
    <div className="flex flex-col gap-2" data-testid={testId}>
      <Table>
        <TableHeader>
          <tr>
            <TableHead>{t("records.transfer.colRow")}</TableHead>
            <TableHead>{t("records.transfer.colFieldName")}</TableHead>
            <TableHead>{t("records.transfer.colReason")}</TableHead>
          </tr>
        </TableHeader>
        <TableBody columnCount={3}>
          {shown.map((r) => (
            <TableRow key={keyOf(r)}>
              <TableCell>{r.row}</TableCell>
              <TableCell>{r.field ?? ""}</TableCell>
              <TableCell>{codeMessage(r.code, t) ?? r.code ?? ""}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {more > 0 ? (
        <div className="flex items-center gap-4 text-sm text-text-muted">
          <span>{t("records.transfer.andMore", { count: more })}</span>
          <Button
            variant="secondary"
            size="record"
            onPress={() => setLimit((current) => current + ISSUE_PAGE_SIZE)}
          >
            {t("records.transfer.showMore", { count: Math.min(ISSUE_PAGE_SIZE, more) })}
          </Button>
          <Button variant="secondary" size="record" onPress={() => setLimit(rows.length)}>
            {t("records.transfer.showAll", { count: rows.length })}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

export function ImportSummary({ job, historyHref, onDone }: ImportSummaryProps) {
  const t = useUiTranslations();
  const issues = issueRows(job);
  const failures = issues.filter((r) => r.outcome === "error" || r.outcome === "skipped");
  const warnings = issues.filter((r) => r.outcome === "warning");
  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-lg font-semibold text-text">{t(TITLES[displayStatus(job)])}</h2>
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
          <dd data-testid="count-skipped">{job.counts.skipped}</dd>
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
        <IssueTable rows={failures} testId="failure-rows" keyPrefix="f" />
      ) : null}
      {warnings.length > 0 ? (
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-text">
            {t("records.transfer.warningsHeading")}
          </h3>
          <IssueTable rows={warnings} testId="warning-rows" keyPrefix="w" />
        </div>
      ) : null}
      <div className="flex items-center gap-4">
        {issues.length > 0 ? (
          <Button
            variant="secondary"
            onPress={() => downloadCsv(issuesFileName(job), issuesCsv(job, t))}
          >
            {t("records.transfer.downloadIssues")}
          </Button>
        ) : null}
        <Link href={historyHref} variant="text">
          {t("records.transfer.viewHistory")}
        </Link>
        <Button onPress={() => onDone(job)}>{t("records.transfer.done")}</Button>
      </div>
    </div>
  );
}
