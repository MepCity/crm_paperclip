"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useFormat } from "@/lib/format-context";
import { ImportDetails } from "./import-details";
import { formatTime, IMPORT_STATUS_LABELS, type ImportHistoryProps, type ImportJob } from "./types";
import { UndoImportDialog } from "./undo-import-dialog";

const STATUS_VARIANT = {
  completed: "success",
  completed_with_errors: "warning",
  failed: "danger",
  undone: "neutral",
} as const;

export function ImportHistory({ jobs, loading, onUndo, canUndo, moduleLabel }: ImportHistoryProps) {
  const format = useFormat();
  const [detailsId, setDetailsId] = useState<string | null>(null);
  const [undoId, setUndoId] = useState<string | null>(null);
  const details = jobs.find((j) => j.id === detailsId);
  const undoing = jobs.find((j) => j.id === undoId);

  if (loading) return <Skeleton variant="block" />;

  const showUndo = (j: ImportJob) => j.undoable && canUndo(j) && j.counts.created > 0;

  return (
    <div className="flex flex-col gap-2">
      <Table>
        <TableHeader>
          <tr>
            <TableHead>Module</TableHead>
            <TableHead>File Name</TableHead>
            <TableHead>Imported By</TableHead>
            <TableHead>Imported Time</TableHead>
            <TableHead>Added</TableHead>
            <TableHead>Updated</TableHead>
            <TableHead>Skipped</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </tr>
        </TableHeader>
        <TableBody columnCount={9} emptyMessage="No imports in the last 7 days.">
          {jobs.map((j) => (
            <TableRow key={j.id}>
              <TableCell>{moduleLabel(j.module)}</TableCell>
              <TableCell>{j.fileName}</TableCell>
              <TableCell>{j.createdBy.name}</TableCell>
              <TableCell>{formatTime(j.createdAt, format)}</TableCell>
              <TableCell>{j.counts.created}</TableCell>
              <TableCell>{j.counts.updated}</TableCell>
              <TableCell>{j.counts.skipped}</TableCell>
              <TableCell>
                <Badge variant={STATUS_VARIANT[j.status]}>{IMPORT_STATUS_LABELS[j.status]}</Badge>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button variant="secondary" size="record" onPress={() => setDetailsId(j.id)}>
                    View Details
                  </Button>
                  {showUndo(j) ? (
                    <Button variant="secondary" size="record" onPress={() => setUndoId(j.id)}>
                      Undo Import
                    </Button>
                  ) : null}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <p className="text-sm text-text-muted">Import history is kept for 7 days.</p>
      {details ? (
        <ImportDetails job={details} isOpen onOpenChange={(o) => !o && setDetailsId(null)} />
      ) : null}
      {undoing ? (
        <UndoImportDialog
          count={undoing.counts.created}
          isOpen
          onOpenChange={(o) => !o && setUndoId(null)}
          onConfirm={() => onUndo(undoing)}
        />
      ) : null}
    </div>
  );
}
