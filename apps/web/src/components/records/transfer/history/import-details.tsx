"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { type ImportJob, reasonMessage } from "./types";

export function ImportDetails({
  job,
  isOpen,
  onOpenChange,
}: {
  job: ImportJob;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { counts } = job;
  const rows = job.rows.filter((r) => r.outcome === "skipped" || r.outcome === "error");
  return (
    <DialogTrigger isOpen={isOpen} onOpenChange={onOpenChange}>
      <Dialog title={`Import details: ${job.fileName}`} aria-label="Import details">
        {({ close }) => (
          <div className="flex flex-col gap-4">
            <dl className="grid grid-cols-2 gap-2 text-sm">
              <dt className="text-text-muted">Added</dt>
              <dd>{counts.created}</dd>
              <dt className="text-text-muted">Updated</dt>
              <dd>{counts.updated}</dd>
              <dt className="text-text-muted">Skipped</dt>
              <dd>{counts.skipped}</dd>
              <dt className="text-text-muted">Errors</dt>
              <dd>{counts.errors}</dd>
            </dl>
            <Table>
              <TableHeader>
                <tr>
                  <TableHead>Row</TableHead>
                  <TableHead>Field</TableHead>
                  <TableHead>Reason</TableHead>
                </tr>
              </TableHeader>
              <TableBody columnCount={3} emptyMessage="No skipped or failed rows.">
                {rows.map((r) => (
                  <TableRow key={`${r.row}-${r.code ?? ""}-${r.field ?? ""}`}>
                    <TableCell>{r.row}</TableCell>
                    <TableCell>{r.field ?? "—"}</TableCell>
                    <TableCell>{reasonMessage(r.code)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex justify-end">
              <Button variant="secondary" size="record" onPress={close}>
                Close
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </DialogTrigger>
  );
}
