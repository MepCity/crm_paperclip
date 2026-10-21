import type {
  DocumentFolder,
  DocumentItem,
  DocumentSort,
  DocumentsPort,
} from "@crm/core/documents";
import { NotFoundError } from "@crm/core/errors";
import { type ApiFetchFn, apiFetch } from "@/lib/api/client/fetch";

const BASE = "/crm/v2.2/documents";

function data<T>(body: unknown): T[] {
  return (body as { data: T[] }).data;
}

/** Browser `DocumentsPort` over HTTP. Not wired to a screen yet. */
export function createHttpDocumentsPort(
  orgSlug: string,
  fetcher: ApiFetchFn = (path, options) => apiFetch(orgSlug, path, options),
): DocumentsPort {
  return {
    async listFolders() {
      return data<DocumentFolder>(await fetcher(`${BASE}/folders`));
    },
    async listItems(folderId: string, sort: DocumentSort) {
      const query = new URLSearchParams({ sort_by: sort.field, sort_order: sort.direction });
      return data<DocumentItem>(
        await fetcher(`${BASE}/folders/${encodeURIComponent(folderId)}/items?${query}`),
      );
    },
    async getItem(id: string) {
      try {
        return data<DocumentItem>(await fetcher(`${BASE}/items/${encodeURIComponent(id)}`))[0];
      } catch (error) {
        if (error instanceof NotFoundError) return undefined;
        throw error;
      }
    },
  };
}
