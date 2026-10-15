import type { RecordServiceFactory } from "../records/contract";
import type { OrgContext } from "../tenancy/types";

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
export interface TransferDependencies {
  records: RecordServiceFactory;
  /** Must check current membership and module action permission; throws on denial. */
  authorize: (ctx: OrgContext, module: TransferModule, action: TransferAction) => Promise<void>;
  /** Must return only current members of ctx.orgId. Used for attribution and owner resolution. */
  listActors: (ctx: OrgContext) => Promise<readonly Actor[]>;
  now?: () => Date;
  limits?: Partial<TransferLimits>;
}
