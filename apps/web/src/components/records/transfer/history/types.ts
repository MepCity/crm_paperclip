import type { ExportJob, ImportJob, TransferModule } from "@crm/core";

export type {
  Actor,
  ExportJob,
  ImportJob,
  ImportRowResult,
  RowOutcome,
  TransferModule,
} from "@crm/core";

export interface ImportHistoryProps {
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

export const IMPORT_STATUS_LABELS: Record<ImportJob["status"], string> = {
  completed: "Completed",
  completed_with_errors: "Completed with errors",
  failed: "Failed",
  undone: "Undone",
};

const REASONS: Record<string, string> = {
  required_missing: "A required value is missing.",
  invalid_value: "The value is not valid for this field.",
  not_found: "No matching record was found.",
  multiple_matches: "More than one matching record was found.",
  duplicate_in_file: "This record appears more than once in the file.",
  already_exists: "A record with this value already exists.",
  permission_denied: "You do not have permission to change this record.",
  file_too_large: "The file is too large.",
  too_many_rows: "The file has too many rows.",
  export_too_large: "There are too many records to export.",
  field_not_allowed: "A selected field is not available to you.",
};

export function reasonMessage(code?: string): string {
  if (!code) return "The row could not be processed.";
  return REASONS[code] ?? "The row could not be processed.";
}

export function formatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" });
}
