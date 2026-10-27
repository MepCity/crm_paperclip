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
import { useUiTranslations } from "@/i18n/client-provider";
import { useUtilityLabel } from "@/i18n/utility-labels";
import { ImportDetails } from "./import-details";
import {
  formatTime,
  IMPORT_STATUS_LABELS,
  type ImportHistoryProps,
  type ImportJob,
  TRANSFER_MODULES,
} from "./types";
import { UndoImportDialog } from "./undo-import-dialog";

const STATUS_VARIANT = {
  completed: "success",
  completed_with_errors: "warning",
  failed: "danger",
  undone: "neutral",
} as const;

export function ImportHistory({
  jobs,
  loading,
  onUndo,
  canUndo,
  moduleLabel,
  importHref,
}: ImportHistoryProps) {
  const copy = useUtilityLabel();
  const t = useUiTranslations();
  const [tab, setTab] = useState("history");
  const [detailsId, setDetailsId] = useState<string | null>(null);
  const [undoId, setUndoId] = useState<string | null>(null);
  const details = jobs.find((j) => j.id === detailsId);
  const undoing = jobs.find((j) => j.id === undoId);

  if (loading) return <Skeleton variant="block" />;

  const showUndo = (j: ImportJob) => j.undoable && canUndo(j) && j.counts.created > 0;

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-surface">
      <div role="tablist" className="flex gap-6 border-b border-border px-6">
        {[
          { id: "import", label: t("records.utilities.importTab") },
          { id: "history", label: t("records.utilities.importHistory") },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            onClick={() => setTab(item.id)}
            className={`py-4 ${tab === item.id ? "border-b-2 border-primary font-semibold" : "text-text-muted"}`}
          >
            {item.label}
          </button>
        ))}
      </div>
      {tab === "import" ? (
        <div role="tabpanel" className="p-6">
          <h2 className="mb-4 font-semibold">{t("records.utilities.chooseImportModule")}</h2>
          <ul className="space-y-3">
            {TRANSFER_MODULES.map((module) => (
              <li key={module}>
                {importHref ? (
                  <a href={importHref(module)} className="text-accent-blue">
                    {moduleLabel(module)}
                  </a>
                ) : (
                  moduleLabel(module)
                )}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div role="tabpanel">
          <div className="flex justify-end p-6 text-text-muted">{copy("Help")}</div>
          {jobs.length === 0 ? (
            <p className="border border-border bg-surface-muted/30 py-6 text-center text-text-muted">
              {t("records.utilities.importsEmpty")}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <tr>
                  <TableHead>{copy("Module")}</TableHead>
                  <TableHead>{copy("File Name")}</TableHead>
                  <TableHead>{copy("Imported By")}</TableHead>
                  <TableHead>{copy("Imported Time")}</TableHead>
                  <TableHead>{copy("Added")}</TableHead>
                  <TableHead>{copy("Updated")}</TableHead>
                  <TableHead>{copy("Skipped")}</TableHead>
                  <TableHead>{copy("Status")}</TableHead>
                  <TableHead>{copy("Actions")}</TableHead>
                </tr>
              </TableHeader>
              <TableBody columnCount={9} emptyMessage={copy("No imports in the last 7 days.")}>
                {jobs.map((j) => (
                  <TableRow key={j.id}>
                    <TableCell>{moduleLabel(j.module)}</TableCell>
                    <TableCell>{j.fileName}</TableCell>
                    <TableCell>{j.createdBy.name}</TableCell>
                    <TableCell>{formatTime(j.createdAt)}</TableCell>
                    <TableCell>{j.counts.created}</TableCell>
                    <TableCell>{j.counts.updated}</TableCell>
                    <TableCell>{j.counts.skipped}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[j.status]}>
                        {IMPORT_STATUS_LABELS[j.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="secondary"
                          size="record"
                          onPress={() => setDetailsId(j.id)}
                        >
                          {copy("View Details")}
                        </Button>
                        {showUndo(j) ? (
                          <Button variant="secondary" size="record" onPress={() => setUndoId(j.id)}>
                            {copy("Undo Import")}
                          </Button>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      )}
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
