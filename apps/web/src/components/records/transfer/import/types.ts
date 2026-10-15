// Temporary UI-side copy of the shared transfer contract (packages/core/src/transfer/types.ts is
// not on main yet). Replace with `@crm/core` imports once it lands; names are identical.
export type TransferModule = "Leads" | "Contacts" | "Accounts" | "Deals";
export type ImportMode = "add" | "update" | "both";
export type Charset = "UTF-8" | "ISO-8859-1";
export interface FieldMapping {
  column: number;
  field: string | null;
  replaceEmptyWith?: string;
}
export interface ImportPreview {
  uploadId: string;
  fileName: string;
  charset: Charset;
  headers: string[];
  sampleRows: string[][];
  rowCount: number;
  suggestedMapping: FieldMapping[];
  fields: { apiName: string; label: string; required: boolean; type: string }[];
  matchFields: { field: string; label: string }[];
}
export interface ImportSettings {
  mode: ImportMode;
  matchField?: string;
  ignoreEmptyOnUpdate: boolean;
  mapping: FieldMapping[];
  defaults: { field: string; value: string }[];
}
export type RowOutcome = "created" | "updated" | "skipped" | "error";
export interface ImportRowResult {
  row: number;
  outcome: RowOutcome;
  code?: string;
  field?: string;
  recordId?: string;
}
export interface Actor {
  id: string;
  name: string;
}
export interface ImportJob {
  id: string;
  module: TransferModule;
  fileName: string;
  createdBy: Actor;
  createdAt: string;
  status: "completed" | "completed_with_errors" | "failed" | "undone";
  counts: { created: number; updated: number; skipped: number; errors: number };
  undoable: boolean;
  rows: ImportRowResult[];
}

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

/** Props of the field-mapping step (MEP-607); the wizard owns the state. */
export interface ImportMappingStepProps {
  preview: ImportPreview;
  mode: ImportMode;
  mapping: FieldMapping[];
  defaults: { field: string; value: string }[];
  onMappingChange(mapping: FieldMapping[]): void;
  onDefaultsChange(defaults: { field: string; value: string }[]): void;
  onValidityChange(valid: boolean): void;
}

export const MAX_FILE_BYTES = 25 * 1024 * 1024;

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
