"use client";

import type { ExportJob, TransferModule } from "@crm/core";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { toast } from "@/components/ui/toast";
import { useUiTranslations } from "@/i18n/client-provider";
import { useMetadataDisplayAdapter } from "@/i18n/metadata-adapter";
import { builtInViewLabel } from "@/i18n/record-labels";
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
  const t = useUiTranslations();
  const adapter = useMetadataDisplayAdapter();
  const orgSlug = useOrgSlug();
  const client = useTransferClient();
  const queryClient = useQueryClient();
  const moduleQuery = useModule(module);
  const viewsQuery = useViews(module);
  const displayModuleLabel = adapter.getModulePlural(
    module,
    moduleQuery.data?.pluralLabel ?? moduleLabel,
  );
  const fields = useMemo(
    () =>
      (moduleQuery.data?.fields ?? [])
        .filter((field) => field.views.view)
        .map((field) => ({ apiName: field.apiName, label: adapter.getFieldLabel(module, field) })),
    [moduleQuery.data, adapter, module],
  );
  const views = useMemo(
    () =>
      (viewsQuery.data ?? []).map((view) => ({
        id: view.id,
        name: builtInViewLabel(
          view,
          moduleQuery.data?.pluralLabel ?? moduleLabel,
          displayModuleLabel,
          t,
        ),
      })),
    [viewsQuery.data, moduleQuery.data?.pluralLabel, moduleLabel, displayModuleLabel, t],
  );
  const historyHref = exportHistoryPath(orgSlug);
  /** Fetches the file and saves it through a temporary link, so one click always downloads. */
  async function download(job: ExportJob) {
    try {
      const file = await client.downloadExport(job.id);
      const url = URL.createObjectURL(file.blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = file.fileName;
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
    } catch {
      toast({ variant: "danger", title: t("records.transfer.downloadFailed") });
    }
  }
  function completed(job: ExportJob) {
    void queryClient.invalidateQueries({ queryKey: apiKeys.exports(orgSlug) });
    toast({
      variant: "success",
      persistent: true,
      title: t("records.transfer.exportCompleted"),
      message: t("records.transfer.exportDone", { count: job.rowCount, file: job.fileName }),
      actions: [
        { label: t("records.transfer.download"), onPress: () => void download(job) },
        { label: t("records.transfer.viewExportHistory"), href: historyHref },
      ],
    });
  }
  return (
    <ExportDialog
      open={open}
      onOpenChange={onOpenChange}
      module={module}
      moduleLabel={displayModuleLabel}
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
