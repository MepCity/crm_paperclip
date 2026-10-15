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
import { ERROR_MESSAGES, type ImportJob } from "./types";

const MAX_ERROR_ROWS = 50;

const TITLES: Record<ImportJob["status"], string> = {
  completed: "Import completed",
  completed_with_errors: "Import completed with errors",
  failed: "Import failed",
  undone: "Import undone",
};

export interface ImportSummaryProps {
  job: ImportJob;
  historyHref: string;
  onDone(job: ImportJob): void;
}

export function ImportSummary({ job, historyHref, onDone }: ImportSummaryProps) {
  const failures = job.rows.filter((r) => r.outcome === "error" || r.outcome === "skipped");
  const shown = failures.slice(0, MAX_ERROR_ROWS);
  const more = failures.length - shown.length;
  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-lg font-semibold text-text">{TITLES[job.status]}</h2>
      <dl className="flex gap-8 text-sm">
        <div>
          <dt className="text-text-muted">Added</dt>
          <dd data-testid="count-added">{job.counts.created}</dd>
        </div>
        <div>
          <dt className="text-text-muted">Updated</dt>
          <dd data-testid="count-updated">{job.counts.updated}</dd>
        </div>
        <div>
          <dt className="text-text-muted">Skipped</dt>
          <dd data-testid="count-skipped">{job.counts.skipped + job.counts.errors}</dd>
        </div>
      </dl>
      {failures.length > 0 ? (
        <div className="flex flex-col gap-2">
          <Table>
            <TableHeader>
              <tr>
                <TableHead>Row</TableHead>
                <TableHead>Field</TableHead>
                <TableHead>Reason</TableHead>
              </tr>
            </TableHeader>
            <TableBody columnCount={3}>
              {shown.map((r) => (
                <TableRow key={`${r.row}-${r.code ?? ""}-${r.field ?? ""}`}>
                  <TableCell>{r.row}</TableCell>
                  <TableCell>{r.field ?? ""}</TableCell>
                  <TableCell>{(r.code && ERROR_MESSAGES[r.code]) || r.code || ""}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {more > 0 ? <p className="text-sm text-text-muted">and {more} more</p> : null}
        </div>
      ) : null}
      <div className="flex items-center gap-4">
        <Link href={historyHref} variant="text">
          View import history
        </Link>
        <Button onPress={() => onDone(job)}>Done</Button>
      </div>
    </div>
  );
}
