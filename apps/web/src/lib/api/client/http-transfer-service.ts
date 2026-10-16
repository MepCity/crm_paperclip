import type {
  Charset,
  ExportJob,
  ExportRequest,
  ImportJob,
  ImportPreview,
  ImportSettings,
  TransferModule,
} from "@crm/core";
import { decodeError, UnexpectedApiError } from "@/lib/api/wire/errors";
import { transferOperations, transferPath } from "@/lib/api/wire/transfer";
import type { ApiFetchFn } from "./fetch";
import { apiFetch, CRM_ORG_HEADER } from "./fetch";

export type CsvFile = { fileName: string; blob: Blob };

/** Browser-side port for CSV import and export; the UI tasks depend on this shape. */
export interface TransferClient {
  previewImport(
    module: TransferModule,
    file: { file: File | Blob; name?: string; charset: Charset },
  ): Promise<ImportPreview>;
  runImport(module: TransferModule, uploadId: string, settings: ImportSettings): Promise<ImportJob>;
  listImports(): Promise<ImportJob[]>;
  getImport(id: string): Promise<ImportJob>;
  undoImport(id: string): Promise<ImportJob>;
  runExport(request: ExportRequest): Promise<ExportJob>;
  listExports(): Promise<ExportJob[]>;
  /** Same-origin URL for an anchor download; the session cookie authorizes it. */
  exportDownloadUrl(id: string): string;
  downloadExport(id: string): Promise<CsvFile>;
  sampleCsvUrl(module: TransferModule): string;
  sampleCsv(module: TransferModule): Promise<CsvFile>;
}

export type HttpTransferClientOptions = {
  fetch?: ApiFetchFn;
  /** Raw fetch used for CSV bodies; defaults to the global one. */
  fetchRaw?: typeof fetch;
};

function fileNameOf(response: Response, fallback: string): string {
  const header = response.headers.get("Content-Disposition") ?? "";
  const star = /filename\*=UTF-8''([^;]+)/i.exec(header)?.[1];
  if (star) {
    try {
      return decodeURIComponent(star);
    } catch {
      // fall through to the plain name
    }
  }
  return /filename="([^"]*)"/i.exec(header)?.[1] ?? fallback;
}

export function createHttpTransferClient(
  orgSlug: string,
  options: HttpTransferClientOptions = {},
): TransferClient {
  const call = options.fetch ?? ((path, init) => apiFetch(orgSlug, path, init));
  const raw = options.fetchRaw ?? ((...args: Parameters<typeof fetch>) => fetch(...args));
  // Anchor downloads cannot send the org header, so the link carries it.
  const withOrg = (url: string) => `${url}?org=${encodeURIComponent(orgSlug)}`;
  const path = (key: keyof typeof transferOperations, params?: Record<string, string>) =>
    transferPath(transferOperations[key].path, params);
  async function csv(url: string, fallback: string): Promise<CsvFile> {
    const response = await raw(url, {
      credentials: "same-origin",
      headers: { [CRM_ORG_HEADER]: orgSlug },
    });
    if (!response.ok) {
      let body: unknown = null;
      try {
        body = await response.json();
      } catch {
        body = null;
      }
      throw decodeError(response.status, body);
    }
    const blob = await response.blob();
    if (!/^text\/csv/i.test(response.headers.get("Content-Type") ?? ""))
      throw new UnexpectedApiError(response.status);
    return { fileName: fileNameOf(response, fallback), blob };
  }
  return {
    async previewImport(module, { file, name, charset }) {
      const form = new FormData();
      form.set("charset", charset);
      form.set("file", file, name ?? (file instanceof File ? file.name : "import.csv"));
      return (await call(path("previewImport", { module }), {
        method: "POST",
        form,
      })) as ImportPreview;
    },
    async runImport(module, uploadId, settings) {
      return (await call(path("runImport", { module }), {
        method: "POST",
        body: { uploadId, settings },
      })) as ImportJob;
    },
    async listImports() {
      return ((await call(path("listImports"))) ?? []) as ImportJob[];
    },
    async getImport(id) {
      return (await call(path("getImport", { importId: id }))) as ImportJob;
    },
    async undoImport(id) {
      return (await call(path("undoImport", { importId: id }), { method: "POST" })) as ImportJob;
    },
    async runExport(request) {
      const { module, ...body } = request;
      return (await call(path("runExport", { module }), { method: "POST", body })) as ExportJob;
    },
    async listExports() {
      return ((await call(path("listExports"))) ?? []) as ExportJob[];
    },
    exportDownloadUrl: (id) => withOrg(path("downloadExport", { exportId: id })),
    downloadExport: (id) => csv(path("downloadExport", { exportId: id }), "export.csv"),
    sampleCsvUrl: (module) => withOrg(path("sampleCsv", { module })),
    sampleCsv: (module) => csv(path("sampleCsv", { module }), "sample.csv"),
  };
}
