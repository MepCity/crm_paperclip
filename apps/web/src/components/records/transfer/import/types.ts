import type { Charset, ImportJob, ImportPreview, ImportSettings, TransferModule } from "@crm/core";

export type {
  Actor,
  Charset,
  FieldMapping,
  ImportJob,
  ImportMode,
  ImportPreview,
  ImportRowResult,
  ImportSettings,
  RowOutcome,
  TransferModule,
} from "@crm/core";

export interface ImportWizardClient {
  preview(file: File, charset: Charset): Promise<ImportPreview>;
  run(uploadId: string, settings: ImportSettings): Promise<ImportJob>;
  sampleCsvUrl: string;
}

export interface ImportWizardProps {
  module: TransferModule;
  moduleLabel: string;
  client: ImportWizardClient;
  onCancel(): void;
  onDone(job: ImportJob): void;
  historyHref: string;
}

export const MAX_FILE_BYTES = 25_000_000;

export const ERROR_MESSAGES: Record<string, string> = {
  file_too_large: "File exceeds the 25 MB limit.",
  too_many_columns: "File has more than 500 columns.",
  too_many_rows: "File has more than 5,000 rows.",
  malformed_csv: "The file is not a valid CSV file.",
  empty_file: "The file is empty.",
  no_header: "The file has no header row.",
  duplicate_header: "The header row contains duplicate column names.",
  bad_encoding: "The file does not match the selected character encoding.",
  upload_expired: "The upload has expired. Upload the file again.",
  mapping_duplicate_field: "A field is mapped to more than one column.",
  mapping_missing_required: "Map all required fields.",
  mapping_system_field: "System fields cannot be mapped.",
  match_field_required: "Choose a field to find existing records by.",
  invalid_match_field: "The selected match field is not valid.",
  not_undoable: "This import cannot be undone.",
  required_missing: "Required value is missing",
  invalid_value: "Invalid value",
  not_found: "No matching record found",
  multiple_matches: "Multiple matching records found",
  duplicate_in_file: "Duplicate of an earlier row in the file",
  already_exists: "Record already exists",
  permission_denied: "No permission",
};

export function errorMessage(error: unknown): string {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String((error as { code: unknown }).code)
      : error instanceof Error
        ? error.message
        : "";
  return ERROR_MESSAGES[code] ?? "Something went wrong. Try again.";
}
