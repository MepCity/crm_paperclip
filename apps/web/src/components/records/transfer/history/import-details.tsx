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
import { useUiTranslations } from "@/i18n/client-provider";
import { skippedTotal } from "../import/types";
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
  const t = useUiTranslations();
  const { counts } = job;
  const rows = job.rows.filter(
    (r) => r.outcome === "skipped" || r.outcome === "error" || r.outcome === "warning",
  );
  return (
    <DialogTrigger isOpen={isOpen} onOpenChange={onOpenChange}>
      <Dialog
        title={t("records.transfer.detailsTitle", { file: job.fileName })}
        aria-label={t("records.transfer.detailsAria")}
      >
        {({ close }) => (
          <div className="flex flex-col gap-4">
            <dl className="grid grid-cols-2 gap-2 text-sm">
              <dt className="text-text-muted">{t("records.transfer.countAdded")}</dt>
              <dd>{counts.created}</dd>
              <dt className="text-text-muted">{t("records.transfer.countUpdated")}</dt>
              <dd>{counts.updated}</dd>
              <dt className="text-text-muted">{t("records.transfer.countSkipped")}</dt>
              <dd>{skippedTotal(counts)}</dd>
              <dt className="text-text-muted">{t("records.transfer.countFailed")}</dt>
              <dd>{counts.errors}</dd>
              {counts.warnings ? (
                <>
                  <dt className="text-text-muted">{t("records.transfer.countWarnings")}</dt>
                  <dd>{counts.warnings}</dd>
                </>
              ) : null}
            </dl>
            <Table>
              <TableHeader>
                <tr>
                  <TableHead>{t("records.transfer.colRow")}</TableHead>
                  <TableHead>{t("records.transfer.colFieldName")}</TableHead>
                  <TableHead>{t("records.transfer.colReason")}</TableHead>
                </tr>
              </TableHeader>
              <TableBody columnCount={3} emptyMessage={t("records.transfer.detailsEmpty")}>
                {rows.map((r) => (
                  <TableRow key={`${r.row}-${r.outcome}-${r.code ?? ""}-${r.field ?? ""}`}>
                    <TableCell>{r.row}</TableCell>
                    <TableCell>{r.field ?? "—"}</TableCell>
                    <TableCell>{reasonMessage(r.code, t)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex justify-end">
              <Button variant="secondary" size="record" onPress={close}>
                {t("records.transfer.close")}
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </DialogTrigger>
  );
}
