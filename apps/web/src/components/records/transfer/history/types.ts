import type { ExportJob, ImportJob, TransferModule } from "@crm/core";
import type { MessageKey } from "@/i18n/catalogs";

export type {
  Actor,
  ExportJob,
  ImportJob,
  ImportRowResult,
  RowOutcome,
  TransferModule,
} from "@crm/core";

export interface ImportHistoryProps {
  importHref?: (module: TransferModule) => string;
  jobs: ImportJob[];
  loading?: boolean;
  onUndo(job: ImportJob): Promise<void>;
  canUndo(job: ImportJob): boolean;
  moduleLabel(m: TransferModule): string;
}
export interface ExportHistoryProps {
  jobs: ExportJob[];
  loading?: boolean;
  downloadHref(job: ExportJob): string;
  onRetry(job: ExportJob): void;
  moduleLabel(m: TransferModule): string;
}

export { TRANSFER_MODULES } from "@crm/core/transfer/types";

export const IMPORT_STATUS_KEYS = {
  completed: "records.transfer.statusCompleted",
  completed_with_errors: "records.transfer.statusCompletedWithErrors",
  failed: "records.transfer.statusFailed",
  undone: "records.transfer.statusUndone",
} as const satisfies Record<ImportJob["status"], MessageKey>;

export { reasonMessage } from "../import/types";

export function formatTime(iso: string, locale = "en-US"): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(locale, { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" });
}
