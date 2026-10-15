"use client";

import type { ImportJob, TransferModule } from "@crm/core";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { useExportHistory, useImportHistory, useTransferClient } from "@/lib/api/client/hooks";
import { useOrgSlug } from "@/lib/api/client/provider";
import { apiKeys } from "@/lib/api/client/query-keys";
import { importHistoryPath, moduleListDefaultPath } from "@/lib/crm-paths";
import { ExportHistory } from "./history/export-history";
import { ImportHistory } from "./history/import-history";
import { ImportWizard } from "./import/import-wizard";
import type { ImportWizardClient } from "./import/types";

const MODULE_LABELS: Record<TransferModule, string> = {
  Leads: "Leads",
  Contacts: "Contacts",
  Accounts: "Accounts",
  Deals: "Deals",
};

export function ImportWizardScreen({ module }: { module: TransferModule }) {
  const orgSlug = useOrgSlug();
  const router = useRouter();
  const client = useTransferClient();
  const queryClient = useQueryClient();
  const wizardClient = useMemo<ImportWizardClient>(
    () => ({
      sampleCsvUrl: client.sampleCsvUrl(module),
      preview: (file, charset) => client.previewImport(module, { file, charset }),
      run: async (uploadId, settings) => {
        const job = await client.runImport(module, uploadId, settings);
        await queryClient.invalidateQueries({ queryKey: apiKeys.imports(orgSlug) });
        await queryClient.invalidateQueries({ queryKey: apiKeys.root(orgSlug) });
        return job;
      },
    }),
    [client, module, orgSlug, queryClient],
  );
  const listPath = moduleListDefaultPath(orgSlug, module);
  return (
    <ImportWizard
      module={module}
      moduleLabel={MODULE_LABELS[module]}
      client={wizardClient}
      onCancel={() => router.push(listPath)}
      onDone={() => router.push(listPath)}
      historyHref={importHistoryPath(orgSlug)}
    />
  );
}

export function ImportHistoryScreen() {
  const orgSlug = useOrgSlug();
  const client = useTransferClient();
  const queryClient = useQueryClient();
  const history = useImportHistory();
  if (history.isError) {
    return <p role="alert">Import history could not be loaded. Try again.</p>;
  }
  return (
    <ImportHistory
      jobs={history.data ?? []}
      loading={history.isLoading}
      moduleLabel={(m) => MODULE_LABELS[m]}
      canUndo={(job: ImportJob) => job.status !== "undone"}
      onUndo={async (job) => {
        await client.undoImport(job.id);
        await queryClient.invalidateQueries({ queryKey: apiKeys.imports(orgSlug) });
        await queryClient.invalidateQueries({ queryKey: apiKeys.root(orgSlug) });
      }}
    />
  );
}

export function ExportHistoryScreen() {
  const orgSlug = useOrgSlug();
  const router = useRouter();
  const client = useTransferClient();
  const history = useExportHistory();
  if (history.isError) {
    return <p role="alert">Export history could not be loaded. Try again.</p>;
  }
  return (
    <ExportHistory
      jobs={history.data ?? []}
      loading={history.isLoading}
      moduleLabel={(m) => MODULE_LABELS[m]}
      downloadHref={(job) => client.exportDownloadUrl(job.id)}
      onRetry={(job) => router.push(moduleListDefaultPath(orgSlug, job.module))}
    />
  );
}
