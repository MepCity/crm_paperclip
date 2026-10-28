import type { Charset, ImportJob, ImportPreview, ImportSettings, TransferModule } from "@crm/core";
import { english, type MessageKey, type MessageValues } from "@/i18n/catalogs";

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

export type Translate = (key: MessageKey, values?: MessageValues) => string;

const errorCodes = english.records.transfer.errors as Record<string, string>;
const reasonCodes = english.records.transfer.reasons as Record<string, string>;

/** Short message for an error code; unknown codes fall back to the generic text. */
export function codeMessage(code: string | undefined, t: Translate): string | undefined {
  return code && code !== "generic" && Object.hasOwn(errorCodes, code)
    ? t(`records.transfer.errors.${code}` as MessageKey)
    : undefined;
}

/** Full-sentence reason for a skipped, failed or warned row. */
export function reasonMessage(code: string | undefined, t: Translate): string {
  return code && Object.hasOwn(reasonCodes, code)
    ? t(`records.transfer.reasons.${code}` as MessageKey)
    : t("records.transfer.reasons.unknown");
}

export function errorMessage(error: unknown, t: Translate): string {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String((error as { code: unknown }).code)
      : error instanceof Error
        ? error.message
        : "";
  return codeMessage(code, t) ?? t("records.transfer.errors.generic");
}

/** Skipped as the wizard summary counts it: skipped rows plus failed rows. */
export const skippedTotal = (counts: ImportJob["counts"]) => counts.skipped + counts.errors;
