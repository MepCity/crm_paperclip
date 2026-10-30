import type { FieldDefinition, PicklistOption, RecordServiceFactory } from "../records/contract";
import type { OrgContext } from "../tenancy/types";

export const IMPORT_MODULES = [
  "Leads",
  "Contacts",
  "Accounts",
  "Deals",
  "Campaigns",
  "Tasks",
  "Events",
  "Calls",
  "Solutions",
  "Cases",
] as const;
export const TRANSFER_MODULES = IMPORT_MODULES;
export type TransferModule = (typeof TRANSFER_MODULES)[number];
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
  fields: {
    apiName: string;
    /** Label in the user's interface language. */
    label: string;
    required: boolean;
    type: string;
    /** Other accepted column names (API name excluded); used by Auto Mapping. */
    aliases?: string[];
  }[];
  matchFields: { field: string; label: string }[];
}
export interface ImportSettings {
  /** Mapping revision forwarded unchanged at every record commit boundary. */
  expectedRevision?: string;
  mode: ImportMode;
  matchField?: string;
  ignoreEmptyOnUpdate: boolean;
  mapping: FieldMapping[];
  defaults: { field: string; value: string }[];
}
/** "warning" rows belong to an imported record: a value was cleared or defaulted. */
export type RowOutcome = "created" | "updated" | "skipped" | "error" | "warning";
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
  counts: {
    created: number;
    updated: number;
    skipped: number;
    errors: number;
    /** Values cleared or defaulted; present only when at least one was. */
    warnings?: number;
  };
  undoable: boolean;
  rows: ImportRowResult[];
}
export interface ExportRequest {
  module: TransferModule;
  viewId?: string;
  ids?: string[];
  fields: "all" | { include: string[] } | { exclude: string[] };
}
export interface ExportJob {
  id: string;
  module: TransferModule;
  scope: string;
  createdBy: Actor;
  createdAt: string;
  status: "completed" | "failed";
  rowCount: number;
  code?: string;
  fileName: string;
}
export interface TransferService {
  previewImport(
    ctx: OrgContext,
    module: TransferModule,
    file: { name: string; bytes: Uint8Array; charset: Charset },
  ): Promise<ImportPreview>;
  runImport(
    ctx: OrgContext,
    module: TransferModule,
    uploadId: string,
    settings: ImportSettings,
  ): Promise<ImportJob>;
  listImports(ctx: OrgContext): Promise<ImportJob[]>;
  getImport(ctx: OrgContext, id: string): Promise<ImportJob>;
  undoImport(ctx: OrgContext, id: string): Promise<ImportJob>;
  runExport(ctx: OrgContext, request: ExportRequest): Promise<ExportJob>;
  listExports(ctx: OrgContext): Promise<ExportJob[]>;
  downloadExport(ctx: OrgContext, id: string): Promise<{ fileName: string; body: string }>;
  sampleCsv(ctx: OrgContext, module: TransferModule): Promise<{ fileName: string; body: string }>;
}

export type TransferAction = "read" | "create" | "update" | "delete";
export interface TransferLimits {
  fileBytes: number;
  columns: number;
  importRows: number;
  exportRows: number;
  exportBytes: number;
  selectedIds: number;
}
/** Interface-language labels. The default is English with no aliases. */
export interface TransferLocale {
  language: "en" | "tr";
  /** Label for exported headers and the import mapping screen. */
  fieldLabel(module: string, field: FieldDefinition): string;
  /** Extra header names accepted on import (other languages, reference wording). */
  fieldAliases(module: string, field: FieldDefinition): readonly string[];
  /** Extra names accepted for a picklist option on import. */
  optionLabels(module: string, field: FieldDefinition, option: PicklistOption): readonly string[];
  moduleLabel?(module: TransferModule): string;
  recordIdLabel: string;
  /** Header of the companion id column written next to a name column. */
  idColumnLabel(label: string): string;
}
export const englishLocale: TransferLocale = {
  language: "en",
  fieldLabel: (_module, field) => field.label,
  fieldAliases: () => [],
  optionLabels: () => [],
  recordIdLabel: "Record Id",
  idColumnLabel: (label) => `${label} Id`,
};
export interface TransferDependencies {
  records: RecordServiceFactory;
  /** Must check current membership and module action permission; throws on denial. */
  authorize: (ctx: OrgContext, module: TransferModule, action: TransferAction) => Promise<void>;
  /** Must return only current members of ctx.orgId. Used for attribution and owner resolution. */
  listActors: (ctx: OrgContext) => Promise<readonly Actor[]>;
  /** Resolves the caller's interface language; omitted means English. */
  locale?: (ctx: OrgContext) => Promise<TransferLocale>;
  /**
   * IANA time zone in which imported date-times without an offset are read (the importing
   * user's zone). Omitted means Europe/Istanbul.
   */
  timeZone?: (ctx: OrgContext) => string | Promise<string>;
  now?: () => Date;
  limits?: Partial<TransferLimits>;
}
