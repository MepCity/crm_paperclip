import { withSearchParams } from "@/lib/crm-paths";
import { type ListSearchState, searchParamsFromListState } from "@/lib/records/list-search-params";
import type { RecordListContext } from "@/lib/records/record-list-context";

/** List href query string key order matches `searchParamsFromListState` (same as the list screen). */
export function listHrefSearchParamKeys(state: ListSearchState): readonly string[] {
  const params = searchParamsFromListState(state);
  return [...params.keys()];
}

export function buildListHrefWithSearchState(listBasePath: string, state: ListSearchState): string {
  return withSearchParams(listBasePath, searchParamsFromListState(state));
}

export function resolveLeadsDetailBackHref(
  listContext: RecordListContext | null,
  defaultListPath: string,
): string {
  return listContext?.listHref ?? defaultListPath;
}
