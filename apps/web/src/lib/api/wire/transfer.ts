import type {
  Charset,
  ExportRequest,
  ImportSettings,
  OrgContext,
  TransferModule,
  TransferService,
} from "@crm/core";
import { AppError } from "@crm/core/errors";
import { TRANSFER_MODULES } from "@crm/core/transfer/types";
import { invalid, object } from "./codec";

export { TRANSFER_MODULES } from "@crm/core/transfer/types";
export const TRANSFER_FILE_BYTES = 25_000_000;
/** Allowance for multipart framing around the file bytes. */
const MULTIPART_OVERHEAD = 64 * 1024;
const CHARSETS: readonly Charset[] = ["UTF-8", "ISO-8859-1"];
const BOM = "\uFEFF";

export type TransferInput = {
  ctx: OrgContext;
  request: Request;
  params: Record<string, string>;
  query: Record<string, string>;
};
export type TransferOperation = {
  method: "GET" | "POST";
  path: string;
  run(service: TransferService, input: TransferInput): Promise<unknown>;
};

export const transferPath = (template: string, params: Record<string, string> = {}) =>
  template.replace(/\{(\w+)\}/g, (_, key: string) => encodeURIComponent(params[key] ?? ""));

function moduleOf(input: TransferInput): TransferModule {
  const value = input.params.module;
  const found = TRANSFER_MODULES.find((module) => module === value);
  return found ?? invalid("module", "Choose a module.");
}
const idOf = (input: TransferInput, key: string) => input.params[key] || invalid(key);

async function jsonBody(input: TransferInput): Promise<Record<string, unknown>> {
  const text = await input.request.text();
  if (!text) return invalid("data", "Send a JSON body.");
  try {
    return object(JSON.parse(text), "data");
  } catch (error) {
    if (error instanceof AppError) throw error;
    return invalid("data", "Send valid JSON.");
  }
}

/** Reads at most `limit` bytes; the stream is cancelled at the budget, never trusting Content-Length. */
async function readBounded(request: Request, limit: number): Promise<Uint8Array<ArrayBuffer>> {
  if (!request.body) return new Uint8Array(new ArrayBuffer(0));
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > limit) {
      await reader.cancel();
      throw new AppError("file_too_large", "The file exceeds the upload budget.");
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(new ArrayBuffer(total));
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}

async function readUpload(input: TransferInput) {
  const type = input.request.headers.get("Content-Type") ?? "";
  if (!type.toLowerCase().startsWith("multipart/form-data")) invalid("file", "Send a file.");
  const bytes = await readBounded(input.request, TRANSFER_FILE_BYTES + MULTIPART_OVERHEAD);
  let form: FormData;
  try {
    form = await new Request(input.request.url, {
      method: "POST",
      headers: { "Content-Type": type },
      body: new Blob([bytes]),
    }).formData();
  } catch {
    return invalid("file", "Send a valid upload.");
  }
  const entries = [...form.entries()];
  const files = entries.filter(([, value]) => typeof value !== "string");
  if (files.length !== 1 || files[0]?.[0] !== "file") invalid("file", "Send exactly one file.");
  for (const [key, value] of entries) {
    if (typeof value === "string" && key !== "charset") invalid(key, "Unexpected field.");
  }
  const file = files[0]?.[1] as File;
  const charset = form.get("charset");
  if (charset !== null && !CHARSETS.some((item) => item === charset))
    invalid("charset", "Choose a supported charset.");
  return {
    name: file.name,
    bytes: new Uint8Array(await file.arrayBuffer()),
    charset: (charset ?? "UTF-8") as Charset,
  };
}

function strings(value: unknown, key: string): string[] {
  if (!Array.isArray(value) || value.some((item) => typeof item !== "string")) invalid(key);
  return value as string[];
}

function decodeSettings(value: unknown): ImportSettings {
  const body = object(value, "settings");
  if (body.mode !== "add" && body.mode !== "update" && body.mode !== "both") invalid("mode");
  if (body.matchField !== undefined && typeof body.matchField !== "string") invalid("matchField");
  if (typeof body.ignoreEmptyOnUpdate !== "boolean") invalid("ignoreEmptyOnUpdate");
  if (!Array.isArray(body.mapping)) invalid("mapping");
  if (!Array.isArray(body.defaults)) invalid("defaults");
  const mapping = (body.mapping as unknown[]).map((item) => {
    const entry = object(item, "mapping");
    if (!Number.isSafeInteger(entry.column) || (entry.column as number) < 0) invalid("mapping");
    if (entry.field !== null && typeof entry.field !== "string") invalid("mapping");
    if (entry.replaceEmptyWith !== undefined && typeof entry.replaceEmptyWith !== "string")
      invalid("mapping");
    return {
      column: entry.column as number,
      field: entry.field as string | null,
      ...(entry.replaceEmptyWith === undefined
        ? {}
        : { replaceEmptyWith: entry.replaceEmptyWith as string }),
    };
  });
  const defaults = (body.defaults as unknown[]).map((item) => {
    const entry = object(item, "defaults");
    if (typeof entry.field !== "string" || typeof entry.value !== "string") invalid("defaults");
    return { field: entry.field as string, value: entry.value as string };
  });
  return {
    mode: body.mode as ImportSettings["mode"],
    ...(body.matchField === undefined ? {} : { matchField: body.matchField as string }),
    ignoreEmptyOnUpdate: body.ignoreEmptyOnUpdate as boolean,
    mapping,
    defaults,
  };
}

function decodeExport(module: TransferModule, body: Record<string, unknown>): ExportRequest {
  if (body.viewId !== undefined && typeof body.viewId !== "string") invalid("viewId");
  const fields = body.fields;
  let decoded: ExportRequest["fields"];
  if (fields === "all") decoded = "all";
  else {
    const spec = object(fields, "fields");
    if (spec.include !== undefined && spec.exclude === undefined)
      decoded = { include: strings(spec.include, "fields") };
    else if (spec.exclude !== undefined && spec.include === undefined)
      decoded = { exclude: strings(spec.exclude, "fields") };
    else return invalid("fields");
  }
  return {
    module,
    ...(body.viewId === undefined ? {} : { viewId: body.viewId as string }),
    ...(body.ids === undefined ? {} : { ids: strings(body.ids, "ids") }),
    fields: decoded,
  };
}

function safeFileName(name: string): string {
  const cleaned =
    [...name]
      .map((char) => (char < " " || char === "\u007f" ? "_" : char))
      .join("")
      .replace(/["\\/;:*?<>|]/g, "_")
      .trim() || "export.csv";
  return cleaned.slice(0, 200);
}

/** A CSV attachment: BOM for spreadsheet tools, never sniffed, never cached. */
export function csvDownload(file: { fileName: string; body: string }): Response {
  const name = safeFileName(file.fileName);
  const ascii = name.replace(/[^\x20-\x7e]/g, "_");
  const encoded = encodeURIComponent(name).replace(
    /['()*]/g,
    (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`,
  );
  return new Response(file.body.startsWith(BOM) ? file.body : BOM + file.body, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${ascii}"; filename*=UTF-8''${encoded}`,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "no-store",
    },
  });
}

export const transferOperations = {
  previewImport: {
    method: "POST",
    path: "/crm/v2.2/{module}/actions/import_preview",
    async run(service, input) {
      const module = moduleOf(input);
      return service.previewImport(input.ctx, module, await readUpload(input));
    },
  },
  runImport: {
    method: "POST",
    path: "/crm/v2.2/{module}/actions/import",
    async run(service, input) {
      const module = moduleOf(input);
      const body = await jsonBody(input);
      if (typeof body.uploadId !== "string" || !body.uploadId) invalid("uploadId");
      return service.runImport(
        input.ctx,
        module,
        body.uploadId as string,
        decodeSettings(body.settings),
      );
    },
  },
  runExport: {
    method: "POST",
    path: "/crm/v2.2/{module}/actions/export",
    async run(service, input) {
      const module = moduleOf(input);
      return service.runExport(input.ctx, decodeExport(module, await jsonBody(input)));
    },
  },
  sampleCsv: {
    method: "GET",
    path: "/crm/v2.2/{module}/actions/import_sample",
    async run(service, input) {
      return csvDownload(await service.sampleCsv(input.ctx, moduleOf(input)));
    },
  },
  listImports: {
    method: "GET",
    path: "/crm/v9/settings/imports",
    run: (service, input) => service.listImports(input.ctx),
  },
  getImport: {
    method: "GET",
    path: "/crm/v9/settings/imports/{importId}",
    run: (service, input) => service.getImport(input.ctx, idOf(input, "importId")),
  },
  undoImport: {
    method: "POST",
    path: "/crm/v9/settings/imports/{importId}/actions/undo",
    run: (service, input) => service.undoImport(input.ctx, idOf(input, "importId")),
  },
  listExports: {
    method: "GET",
    path: "/crm/v9/settings/exports",
    run: (service, input) => service.listExports(input.ctx),
  },
  downloadExport: {
    method: "GET",
    path: "/crm/v9/settings/exports/{exportId}/download",
    async run(service, input) {
      return csvDownload(await service.downloadExport(input.ctx, idOf(input, "exportId")));
    },
  },
} satisfies Record<string, TransferOperation>;
