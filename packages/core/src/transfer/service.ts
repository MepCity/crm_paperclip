import { AppError, ForbiddenError, isAppError, NotFoundError, ValidationError } from "../errors";
import type { FieldDefinition } from "../records/contract";
import type { OrgContext } from "../tenancy/types";
import { CsvError, parseCsv, serializeCsv } from "./csv";
import { exportFields, exportRecords } from "./export";
import { createHistory, newest, stored } from "./history";
import {
  allView,
  importable,
  importMetadata,
  importRows,
  matchFields,
  validateMapping,
  writable,
} from "./import";
import { suggestMapping } from "./mapping";
import type {
  Actor,
  ImportJob,
  TransferDependencies,
  TransferLimits,
  TransferLocale,
  TransferModule,
  TransferService,
} from "./types";
import { englishLocale, IMPORT_MODULES } from "./types";

export const DEFAULT_TRANSFER_LIMITS: Readonly<TransferLimits> = {
  fileBytes: 25_000_000,
  columns: 500,
  importRows: 5_000,
  exportRows: 30_000,
  exportBytes: 25_000_000,
  selectedIds: 500,
};
const copy = <T>(value: T): T => structuredClone(value);
/** Bounded, synchronous, process-local adapter; deliberately offers no crash recovery. */
export function createTransferService(deps: TransferDependencies): TransferService {
  const limits = { ...DEFAULT_TRANSFER_LIMITS, ...deps.limits };
  for (const limit of Object.values(limits))
    if (!Number.isSafeInteger(limit) || limit < 1) throw new Error("Invalid transfer budget.");
  const clock = () => deps.now?.() ?? new Date();
  const history = createHistory();
  const state = (ctx: OrgContext) => history(ctx.orgId, clock().getTime());
  const actor = async (ctx: OrgContext): Promise<Actor> => {
    const member = (await deps.listActors(ctx)).find((item) => item.id === ctx.userId);
    if (!member) throw new ForbiddenError();
    return copy(member);
  };
  const authorizeImport = async (
    ctx: OrgContext,
    module: TransferModule,
    mode: "add" | "update" | "both",
  ) => {
    if (mode !== "update") await deps.authorize(ctx, module, "create");
    if (mode !== "add") await deps.authorize(ctx, module, "update");
  };
  const localeOf = async (ctx: OrgContext): Promise<TransferLocale> =>
    (await deps.locale?.(ctx)) ?? englishLocale;
  const requireImportModule = (module: TransferModule) => {
    if (!(IMPORT_MODULES as readonly string[]).includes(module))
      throw new ValidationError({ module: ["Import is not supported for this module."] });
  };
  return {
    async previewImport(ctx, module, file) {
      requireImportModule(module);
      await actor(ctx);
      // A mode is not chosen yet: either import action allows a preview.
      try {
        await deps.authorize(ctx, module, "create");
      } catch (error) {
        if (!isAppError(error) || error.code !== "forbidden") throw error;
        await deps.authorize(ctx, module, "update");
      }
      if (file.bytes.byteLength > limits.fileBytes)
        throw new AppError("file_too_large", "The file exceeds the upload budget.");
      let parsed: ReturnType<typeof parseCsv>;
      try {
        parsed = parseCsv(file.bytes, {
          charset: file.charset,
          maxColumns: limits.columns,
          maxRows: limits.importRows,
        });
      } catch (error) {
        if (error instanceof CsvError)
          throw new AppError(
            error.code,
            error.line === undefined
              ? "The CSV file is invalid."
              : `The CSV file is invalid (line ${error.line}).`,
          );
        throw error;
      }
      const metadata = importMetadata(await deps.records(ctx).getModule(module), module);
      const locale = await localeOf(ctx);
      const fields = metadata.fields.filter(importable).map((field) => {
        const label = locale.fieldLabel(module, field);
        const aliases = [field.label, ...locale.fieldAliases(module, field)].filter(
          (name, index, all) =>
            name !== label && name !== field.apiName && all.indexOf(name) === index,
        );
        return {
          apiName: field.apiName,
          label,
          required: field.required,
          type: field.dataType,
          ...(aliases.length ? { aliases } : {}),
        };
      });
      const uploadId = crypto.randomUUID();
      const uploads = state(ctx).uploads;
      while (uploads.size >= 5) {
        const oldest = uploads.keys().next().value;
        if (oldest) uploads.delete(oldest);
      }
      uploads.set(uploadId, {
        id: uploadId,
        userId: ctx.userId,
        module,
        fileName: file.name,
        charset: file.charset,
        ...parsed,
        at: clock().getTime(),
      });
      return copy({
        uploadId,
        fileName: file.name,
        charset: file.charset,
        headers: parsed.headers,
        sampleRows: parsed.rows.slice(0, 5),
        rowCount: parsed.rows.length,
        suggestedMapping: suggestMapping(parsed.headers, fields, [
          englishLocale.recordIdLabel,
          locale.recordIdLabel,
        ]),
        fields,
        matchFields: matchFields(metadata, module, locale),
      });
    },
    async runImport(ctx, module, uploadId, settings) {
      requireImportModule(module);
      const createdBy = await actor(ctx);
      await authorizeImport(ctx, module, settings.mode);
      const uploads = state(ctx).uploads;
      const upload = uploads.get(uploadId);
      if (!upload || upload.userId !== ctx.userId || upload.module !== module)
        throw new AppError("upload_expired", "Upload again to continue.");
      const records = deps.records(ctx);
      const metadata = importMetadata(await records.getModule(module), module);
      const matchField = validateMapping(metadata, module, upload, settings);
      // Claim once after asynchronous preflight, preventing concurrent reuse.
      if (state(ctx).uploads.get(uploadId) !== upload)
        throw new AppError("upload_expired", "Upload again to continue.");
      uploads.delete(uploadId);
      const job: ImportJob = {
        id: crypto.randomUUID(),
        module,
        fileName: upload.fileName,
        createdBy,
        createdAt: clock().toISOString(),
        status: "failed",
        counts: { created: 0, updated: 0, skipped: 0, errors: 0 },
        undoable: false,
        rows: [],
      };
      const createdIds = await importRows(
        ctx,
        records,
        deps,
        upload,
        copy(settings),
        metadata,
        matchField,
        job,
        await localeOf(ctx),
      );
      state(ctx).imports.set(job.id, { job, createdIds });
      return copy(job);
    },
    async listImports(ctx) {
      await actor(ctx);
      return newest([...state(ctx).imports.values()].map((entry) => entry.job));
    },
    async getImport(ctx, id) {
      await actor(ctx);
      return copy(stored(state(ctx).imports, id).job);
    },
    async undoImport(ctx, id) {
      await actor(ctx);
      const entry = stored(state(ctx).imports, id);
      if (!entry.job.undoable) throw new AppError("not_undoable", "This import cannot be undone.");
      await deps.authorize(ctx, entry.job.module, "delete");
      if (!entry.job.undoable) throw new AppError("not_undoable", "This import cannot be undone.");
      entry.job.undoable = false;
      const records = deps.records(ctx);
      try {
        for (const recordId of [...entry.createdIds]) {
          await deps.authorize(ctx, entry.job.module, "delete");
          try {
            await records.get(entry.job.module, recordId);
            await records.delete(entry.job.module, [recordId]);
          } catch (error) {
            if (!isAppError(error) || error.code !== "not_found") throw error;
          }
          entry.createdIds = entry.createdIds.filter((candidate) => candidate !== recordId);
        }
        entry.job.status = "undone";
      } catch (error) {
        entry.job.undoable = entry.createdIds.length > 0;
        throw error;
      }
      return copy(entry.job);
    },
    async runExport(ctx, request) {
      const createdBy = await actor(ctx);
      await deps.authorize(ctx, request.module, "read");
      const records = deps.records(ctx);
      const metadata = await records.getModule(request.module);
      const fields = exportFields(metadata.fields, request);
      const now = clock();
      const scope = request.ids
        ? "Selected records"
        : (request.viewId
            ? await records.getView(request.module, request.viewId)
            : await allView(records, request.module)
          ).name;
      const job = {
        id: crypto.randomUUID(),
        module: request.module,
        scope,
        createdBy,
        createdAt: now.toISOString(),
        status: "completed" as "completed" | "failed",
        rowCount: 0,
        fileName: `${request.module}_${now.toISOString().slice(0, 10).replaceAll("-", "_")}.csv`,
      };
      const entry: import("./history").StoredExport = {
        job,
        fields: fields.map((field) => field.apiName),
      };
      try {
        const result = await exportRecords(records, request, fields, limits, {
          locale: await localeOf(ctx),
          actors: await deps.listActors(ctx),
        });
        await deps.authorize(ctx, request.module, "read");
        entry.body = result.body;
        job.scope = result.scope;
        job.rowCount = result.rowCount;
      } catch (error) {
        if (!isAppError(error) || error.code !== "export_too_large") throw error;
        entry.job = { ...job, status: "failed", code: "export_too_large" };
      }
      state(ctx).exports.set(job.id, entry);
      return copy(entry.job);
    },
    async listExports(ctx) {
      await actor(ctx);
      return newest([...state(ctx).exports.values()].map((entry) => entry.job));
    },
    async downloadExport(ctx, id) {
      await actor(ctx);
      const entry = stored(state(ctx).exports, id);
      await deps.authorize(ctx, entry.job.module, "read");
      const metadata = await deps.records(ctx).getModule(entry.job.module);
      exportFields(metadata.fields, {
        module: entry.job.module,
        fields: { include: entry.fields },
      });
      if (entry.body === undefined) throw new NotFoundError();
      return { fileName: entry.job.fileName, body: entry.body };
    },
    async sampleCsv(ctx, module) {
      requireImportModule(module);
      await actor(ctx);
      await deps.authorize(ctx, module, "read");
      const metadata = await deps.records(ctx).getModule(module);
      const locale = await localeOf(ctx);
      const fields = metadata.fields
        .filter(writable)
        .filter(
          (field) =>
            field.required || ["Email", "Phone", "First_Name", "Company"].includes(field.apiName),
        );
      return {
        fileName: `${module}_Sample.csv`,
        body: serializeCsv(
          fields.map((field) => locale.fieldLabel(module, field)),
          [fields.map(sampleValue)],
        ),
      };
    },
  };
}
function sampleValue(field: FieldDefinition): string {
  if (field.picklist) return field.picklist[0]?.storedValue ?? "";
  if (field.dataType === "email") return "example@example.test";
  if (field.dataType === "date") return "2026-01-01";
  if (field.dataType === "datetime") return "2026-01-01T12:00:00Z";
  if (field.dataType === "boolean") return "false";
  if (["currency", "double", "integer", "bigint"].includes(field.dataType)) return "1";
  if (["lookup", "ownerlookup", "multi_module_lookup"].includes(field.dataType)) return "";
  return "Example";
}
