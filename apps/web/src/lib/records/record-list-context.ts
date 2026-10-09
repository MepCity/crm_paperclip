import type { ListQuery, ModuleApiName, RecordId } from "@crm/core/records";

/** List navigation context written by the list page and read on record detail (session lifetime). */
export type RecordListContext = {
  module: ModuleApiName;
  viewId: string;
  listHref: string;
  page: number;
  perPage: number;
  recordIds: readonly RecordId[];
  listQuery: Pick<
    ListQuery,
    "viewId" | "page" | "perPage" | "sort" | "filters" | "search" | "fields"
  >;
};

const STORAGE_PREFIX = "mep:record-list-context:";

type ContextCache = {
  storageKey: string;
  raw: string;
  value: RecordListContext | null;
};

let contextCache: ContextCache | null = null;

export function recordListContextKey(orgSlug: string, module: ModuleApiName): string {
  return `${STORAGE_PREFIX}${orgSlug}:${module}`;
}

function parseRecordListContext(raw: string, module: ModuleApiName): RecordListContext | null {
  try {
    const parsed = JSON.parse(raw) as RecordListContext;
    if (parsed.module !== module || !Array.isArray(parsed.recordIds)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function readRecordListContext(
  orgSlug: string,
  module: ModuleApiName,
): RecordListContext | null {
  if (typeof sessionStorage === "undefined") return null;
  const storageKey = recordListContextKey(orgSlug, module);
  const raw = sessionStorage.getItem(storageKey);
  if (!raw) {
    contextCache = { storageKey, raw: "", value: null };
    return null;
  }
  if (contextCache?.storageKey === storageKey && contextCache.raw === raw) {
    return contextCache.value;
  }
  const value = parseRecordListContext(raw, module);
  contextCache = { storageKey, raw, value };
  return value;
}

export function writeRecordListContext(orgSlug: string, context: RecordListContext): void {
  if (typeof sessionStorage === "undefined") return;
  const storageKey = recordListContextKey(orgSlug, context.module);
  const raw = JSON.stringify(context);
  sessionStorage.setItem(storageKey, raw);
  contextCache = { storageKey, raw, value: context };
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("mep:record-list-context", { detail: { storageKey } }));
  }
}

export function subscribeRecordListContext(
  orgSlug: string,
  module: ModuleApiName,
  listener: () => void,
): () => void {
  if (typeof window === "undefined") return () => {};
  const storageKey = recordListContextKey(orgSlug, module);
  function onStorage(event: StorageEvent) {
    if (event.key === storageKey) listener();
  }
  function onLocalUpdate(event: Event) {
    const detail = (event as CustomEvent<{ storageKey: string }>).detail;
    if (detail?.storageKey === storageKey) listener();
  }
  window.addEventListener("storage", onStorage);
  window.addEventListener("mep:record-list-context", onLocalUpdate);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener("mep:record-list-context", onLocalUpdate);
  };
}
