import type { MessageKey } from "@/i18n/catalogs";
import { codeMessage, type ImportJob, type ImportRowResult, type Translate } from "./types";

/** Rows of the result view shown at first and added by each "show more". */
export const ISSUE_PAGE_SIZE = 50;

export type IssueRow = ImportRowResult & { outcome: "error" | "skipped" | "warning" };

/** Every skipped, failed or warned row, in file order. */
export function issueRows(job: ImportJob): IssueRow[] {
  return job.rows.filter(
    (row): row is IssueRow =>
      row.outcome === "error" || row.outcome === "skipped" || row.outcome === "warning",
  );
}

/**
 * Status as shown to people. An import that wrote rows and only left optional values empty is a
 * success with warnings; "with errors" is kept for runs where a row failed.
 */
export function displayStatus(
  job: Pick<ImportJob, "status" | "counts">,
): ImportJob["status"] | "completed_with_warnings" {
  return job.status === "completed_with_errors" &&
    job.counts.errors === 0 &&
    (job.counts.warnings ?? 0) > 0
    ? "completed_with_warnings"
    : job.status;
}

const OUTCOME_LABELS = {
  error: "records.transfer.outcomeError",
  skipped: "records.transfer.outcomeSkipped",
  warning: "records.transfer.outcomeWarning",
} as const satisfies Record<IssueRow["outcome"], MessageKey>;

/** Spreadsheet programs run a cell that starts with one of these as a formula. */
function csvCell(value: string): string {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return /[",\r\n]/.test(safe) ? `"${safe.replaceAll('"', '""')}"` : safe;
}

/**
 * CSV of the warnings, skipped and failed rows: row number, kind, field and message only. No
 * cell of the uploaded file is repeated. A byte order mark lets Excel read UTF-8.
 */
export function issuesCsv(job: ImportJob, t: Translate): string {
  const header = [
    t("records.transfer.colRow"),
    t("records.transfer.colType"),
    t("records.transfer.colFieldName"),
    t("records.transfer.colReason"),
  ];
  const lines = issueRows(job).map((row) =>
    [
      String(row.row),
      t(OUTCOME_LABELS[row.outcome]),
      row.field ?? "",
      codeMessage(row.code, t) ?? row.code ?? "",
    ]
      .map(csvCell)
      .join(","),
  );
  return `﻿${[header.map(csvCell).join(","), ...lines].join("\r\n")}\r\n`;
}

export function issuesFileName(job: ImportJob): string {
  const base = job.fileName
    .replace(/\.csv$/i, "")
    .replace(/[\\/:*?"<>|]/g, "_")
    .replace(/\p{Cc}/gu, "_");
  return `${base || "import"}-issues.csv`;
}

/** Hands a CSV to the browser as a download. */
export function downloadCsv(fileName: string, body: string): void {
  const url = URL.createObjectURL(new Blob([body], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
