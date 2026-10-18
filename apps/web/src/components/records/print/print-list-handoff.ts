import type { ListQuery, ModuleApiName } from "@crm/core/records";

const STORAGE_PREFIX = "mep:print-list-query:";

function key(orgSlug: string, module: ModuleApiName): string {
  return `${STORAGE_PREFIX}${orgSlug}:${module}`;
}

/** Hands the list's current query (view, filters, sort, page) to the print page. */
export function writePrintListQuery(orgSlug: string, module: ModuleApiName, query: ListQuery) {
  try {
    window.sessionStorage.setItem(key(orgSlug, module), JSON.stringify(query));
  } catch {
    // Storage unavailable: the print page falls back to the plain view.
  }
}

export function readPrintListQuery(
  orgSlug: string,
  module: ModuleApiName,
  viewId: string,
): ListQuery | null {
  try {
    const raw = window.sessionStorage.getItem(key(orgSlug, module));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ListQuery;
    return parsed.viewId === viewId ? parsed : null;
  } catch {
    return null;
  }
}
