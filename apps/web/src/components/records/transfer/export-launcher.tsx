"use client";

import type { ExportJob, TransferModule } from "@crm/core";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { toast } from "@/components/ui/toast";
import { useModule, useTransferClient, useViews } from "@/lib/api/client/hooks";
import { useOrgSlug } from "@/lib/api/client/provider";
import { apiKeys } from "@/lib/api/client/query-keys";
import { exportHistoryPath } from "@/lib/crm-paths";
import { ExportDialog } from "./export/export-dialog";

/** Export dialog bound to the real transfer client; used by the list Actions menu and selection bar. */
export function ExportLauncher({
  module,
  moduleLabel,
  viewId,
  selectedIds,
  open,
  onOpenChange,
}: {
  module: TransferModule;
  moduleLabel: string;
  viewId?: string;
  selectedIds?: string[];
  open: boolean;
  onOpenChange(open: boolean): void;
}) {
  const orgSlug = useOrgSlug();
  const client = useTransferClient();
  const queryClient = useQueryClient();
  const moduleQuery = useModule(module);
  const viewsQuery = useViews(module);
  const fields = useMemo(
    () =>
      (moduleQuery.data?.fields ?? [])
        .filter((field) => field.views.view)
        .map((field) => ({ apiName: field.apiName, label: field.label })),
    [moduleQuery.data],
  );
  const views = useMemo(
    () => (viewsQuery.data ?? []).map((view) => ({ id: view.id, name: view.name })),
    [viewsQuery.data],
  );
  const historyHref = exportHistoryPath(orgSlug);
  function completed(job: ExportJob) {
    void queryClient.invalidateQueries({ queryKey: apiKeys.exports(orgSlug) });
    toast({
      variant: "success",
      title: "Export completed",
      message: `${job.rowCount} records exported to ${job.fileName}.`,
      actions: [
        { label: "Download", href: client.exportDownloadUrl(job.id) },
        { label: "View export history", href: historyHref },
      ],
    });
  }
  return (
    <ExportDialog
      open={open}
      onOpenChange={onOpenChange}
      module={module}
      moduleLabel={moduleLabel}
      views={views}
      defaultViewId={viewId}
      selectedIds={selectedIds}
      fields={fields}
      onExport={(request) => client.runExport(request)}
      historyHref={historyHref}
      onCompleted={completed}
    />
  );
}
