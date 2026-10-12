export interface SearchHistoryEntry {
  module: string;
  id: string;
  name: string;
}

export function searchHistoryKey(orgSlug: string, userId: string): string {
  return `crm:search-history:${JSON.stringify([orgSlug, userId])}`;
}

export function readSearchHistory(key: string): SearchHistoryEntry[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(key) ?? "[]");
    if (!Array.isArray(value)) return [];
    return value
      .filter(
        (entry): entry is SearchHistoryEntry =>
          entry !== null &&
          typeof entry === "object" &&
          typeof entry.module === "string" &&
          typeof entry.id === "string" &&
          typeof entry.name === "string",
      )
      .slice(0, 15);
  } catch {
    return [];
  }
}

export function rememberSearchRecord(key: string, entry: SearchHistoryEntry): SearchHistoryEntry[] {
  const next = [
    entry,
    ...readSearchHistory(key).filter((old) => old.module !== entry.module || old.id !== entry.id),
  ].slice(0, 15);
  try {
    localStorage.setItem(key, JSON.stringify(next));
  } catch {
    // Storage can be unavailable; opening a record still succeeds.
  }
  return next;
}
