import type {
  DocumentFolder,
  DocumentItem,
  DocumentSort,
  DocumentsPort,
} from "@crm/core/documents";
import { NotFoundError } from "@crm/core/errors";
import { type ApiFetchFn, apiFetch } from "@/lib/api/client/fetch";

const BASE = "/crm/v2.2/documents";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isFolder(v: unknown): v is DocumentFolder {
  return (
    isRecord(v) &&
    typeof v.id === "string" &&
    typeof v.name === "string" &&
    (v.section === "my" || v.section === "team") &&
    typeof v.locked === "boolean" &&
    (v.title === undefined || typeof v.title === "string")
  );
}

function isItem(v: unknown): v is DocumentItem {
  return (
    isRecord(v) &&
    typeof v.id === "string" &&
    typeof v.name === "string" &&
    (v.kind === "folder" || v.kind === "file") &&
    typeof v.parentId === "string" &&
    typeof v.uploadedBy === "string" &&
    typeof v.modifiedBy === "string" &&
    typeof v.modifiedAt === "string"
  );
}

function data<T>(body: unknown, guard: (v: unknown) => v is T): T[] {
  if (!isRecord(body) || !Array.isArray(body.data) || !body.data.every(guard)) {
    throw new Error("Malformed documents response");
  }
  return body.data;
}

/** Browser `DocumentsPort` over HTTP. Not wired to a screen yet. */
export function createHttpDocumentsPort(
  orgSlug: string,
  fetcher: ApiFetchFn = (path, options) => apiFetch(orgSlug, path, options),
): DocumentsPort {
  return {
    async listFolders() {
      return data(await fetcher(`${BASE}/folders`), isFolder);
    },
    async listItems(folderId: string, sort: DocumentSort) {
      const query = new URLSearchParams({ sort_by: sort.field, sort_order: sort.direction });
      return data(
        await fetcher(`${BASE}/folders/${encodeURIComponent(folderId)}/items?${query}`),
        isItem,
      );
    },
    async getItem(id: string) {
      try {
        const rows = data(await fetcher(`${BASE}/items/${encodeURIComponent(id)}`), isItem);
        const [first] = rows;
        if (rows.length !== 1 || !first) throw new Error("Malformed documents response");
        return first;
      } catch (error) {
        if (error instanceof NotFoundError) return undefined;
        throw error;
      }
    },
  };
}
