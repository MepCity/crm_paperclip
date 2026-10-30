"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectItem } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useUiLanguage, useUiTranslations } from "@/i18n/client-provider";
import { type ExportHistoryProps, formatTime, reasonMessage, TRANSFER_MODULES } from "./types";

export function ExportHistory({
  jobs,
  loading,
  downloadHref,
  onRetry,
  moduleLabel,
}: ExportHistoryProps) {
  const t = useUiTranslations();
  const locale = useUiLanguage() === "tr" ? "tr-TR" : "en-US";
  const [module, setModule] = useState<string>("all");
  if (loading) return <Skeleton variant="block" />;

  const items = [
    { id: "all", name: t("records.transfer.exportAll") },
    ...TRANSFER_MODULES.map((m) => ({ id: m as string, name: moduleLabel(m) })),
  ];
  const shown = module === "all" ? jobs : jobs.filter((j) => j.module === module);

  return (
    <div className="flex flex-col gap-2">
      <Select
        label={t("records.transfer.moduleLabel")}
        items={items}
        selectedKey={module}
        onSelectionChange={(k) => setModule(String(k))}
      >
        {(item) => <SelectItem id={item.id}>{item.name}</SelectItem>}
      </Select>
      <Table>
        <TableHeader>
          <tr>
            <TableHead>{t("records.transfer.moduleLabel")}</TableHead>
            <TableHead>{t("records.transfer.exportColScope")}</TableHead>
            <TableHead>{t("records.transfer.exportColBy")}</TableHead>
            <TableHead>{t("records.transfer.exportColTime")}</TableHead>
            <TableHead>{t("records.transfer.exportColRecords")}</TableHead>
            <TableHead>{t("records.transfer.exportColStatus")}</TableHead>
            <TableHead>{t("records.transfer.exportColActions")}</TableHead>
          </tr>
        </TableHeader>
        <TableBody columnCount={7} emptyMessage={t("records.transfer.exportEmpty")}>
          {shown.map((j) => (
            <TableRow key={j.id}>
              <TableCell>{moduleLabel(j.module)}</TableCell>
              <TableCell>{j.scope}</TableCell>
              <TableCell>{j.createdBy.name}</TableCell>
              <TableCell>{formatTime(j.createdAt, locale)}</TableCell>
              <TableCell>{j.rowCount}</TableCell>
              <TableCell>
                <Badge variant={j.status === "completed" ? "success" : "danger"}>
                  {j.status === "completed"
                    ? t("records.transfer.statusCompleted")
                    : t("records.transfer.statusFailed")}
                </Badge>
                {j.status === "failed" ? (
                  <span className="ml-2 text-text-muted">{reasonMessage(j.code, t)}</span>
                ) : null}
              </TableCell>
              <TableCell>
                {j.status === "completed" ? (
                  <a href={downloadHref(j)} download={j.fileName} className="text-link underline">
                    {t("records.transfer.download")}
                  </a>
                ) : (
                  <Button variant="secondary" size="record" onPress={() => onRetry(j)}>
                    {t("records.transfer.retry")}
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <p className="text-sm text-text-muted">{t("records.transfer.exportKept")}</p>
    </div>
  );
}
