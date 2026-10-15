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
import { type ExportHistoryProps, formatTime, reasonMessage, TRANSFER_MODULES } from "./types";

export function ExportHistory({
  jobs,
  loading,
  downloadHref,
  onRetry,
  moduleLabel,
}: ExportHistoryProps) {
  const [module, setModule] = useState<string>("all");
  if (loading) return <Skeleton variant="block" />;

  const items = [
    { id: "all", name: "All" },
    ...TRANSFER_MODULES.map((m) => ({ id: m as string, name: moduleLabel(m) })),
  ];
  const shown = module === "all" ? jobs : jobs.filter((j) => j.module === module);

  return (
    <div className="flex flex-col gap-2">
      <Select
        label="Module"
        items={items}
        selectedKey={module}
        onSelectionChange={(k) => setModule(String(k))}
      >
        {(item) => <SelectItem id={item.id}>{item.name}</SelectItem>}
      </Select>
      <Table>
        <TableHeader>
          <tr>
            <TableHead>Module</TableHead>
            <TableHead>Scope</TableHead>
            <TableHead>Exported By</TableHead>
            <TableHead>Exported Time</TableHead>
            <TableHead>Records</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </tr>
        </TableHeader>
        <TableBody columnCount={7} emptyMessage="No exports in the last 7 days.">
          {shown.map((j) => (
            <TableRow key={j.id}>
              <TableCell>{moduleLabel(j.module)}</TableCell>
              <TableCell>{j.scope}</TableCell>
              <TableCell>{j.createdBy.name}</TableCell>
              <TableCell>{formatTime(j.createdAt)}</TableCell>
              <TableCell>{j.rowCount}</TableCell>
              <TableCell>
                <Badge variant={j.status === "completed" ? "success" : "danger"}>
                  {j.status === "completed" ? "Completed" : "Failed"}
                </Badge>
                {j.status === "failed" ? (
                  <span className="ml-2 text-text-muted">{reasonMessage(j.code)}</span>
                ) : null}
              </TableCell>
              <TableCell>
                {j.status === "completed" ? (
                  <a href={downloadHref(j)} download={j.fileName} className="text-link underline">
                    Download
                  </a>
                ) : (
                  <Button variant="secondary" size="record" onPress={() => onRetry(j)}>
                    Retry
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <p className="text-sm text-text-muted">Export history is kept for 7 days.</p>
    </div>
  );
}
