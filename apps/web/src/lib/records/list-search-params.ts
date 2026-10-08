import type { ListQuery, SortSpec } from "@crm/core/records";

export const LIST_PAGE_DEFAULT = 1;
export const LIST_PER_PAGE_DEFAULT = 30;
export const LIST_PER_PAGE_OPTIONS = [10, 20, 30, 40, 50, 100] as const;

export type ListPerPage = (typeof LIST_PER_PAGE_OPTIONS)[number];

export interface ListSearchState {
  page: number;
  perPage: ListPerPage;
  sortBy: string | null;
  sortOrder: "asc" | "desc" | null;
}

function parsePositiveInt(raw: string | null, fallback: number): number {
  if (raw === null || raw === "") return fallback;
  if (!/^\d+$/.test(raw)) return fallback;
  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value < 1) return fallback;
  return value;
}

function parsePerPage(raw: string | null): ListPerPage {
  const value = parsePositiveInt(raw, LIST_PER_PAGE_DEFAULT);
  return (LIST_PER_PAGE_OPTIONS as readonly number[]).includes(value)
    ? (value as ListPerPage)
    : LIST_PER_PAGE_DEFAULT;
}

function parseSortOrder(raw: string | null): "asc" | "desc" | null {
  if (raw === "asc" || raw === "desc") return raw;
  return null;
}

export function parseListSearchParams(params: URLSearchParams): ListSearchState {
  const sortBy = params.get("sort_by");
  const sortOrder = parseSortOrder(params.get("sort_order"));
  return {
    page: parsePositiveInt(params.get("page"), LIST_PAGE_DEFAULT),
    perPage: parsePerPage(params.get("per_page")),
    sortBy: sortBy && sortBy.length > 0 ? sortBy : null,
    sortOrder: sortBy ? (sortOrder ?? "asc") : null,
  };
}

export function searchParamsFromListState(state: ListSearchState): URLSearchParams {
  const params = new URLSearchParams();
  if (state.page !== LIST_PAGE_DEFAULT) params.set("page", String(state.page));
  if (state.perPage !== LIST_PER_PAGE_DEFAULT) params.set("per_page", String(state.perPage));
  if (state.sortBy) {
    params.set("sort_by", state.sortBy);
    params.set("sort_order", state.sortOrder ?? "asc");
  }
  return params;
}

export function listQueryFromSearchState(
  viewId: string,
  columnApiNames: readonly string[],
  state: ListSearchState,
  eligibleSortFields: ReadonlySet<string>,
): ListQuery {
  const query: ListQuery = {
    viewId,
    page: state.page,
    perPage: state.perPage,
    fields: columnApiNames,
  };
  if (state.sortBy && state.sortOrder && eligibleSortFields.has(state.sortBy)) {
    query.sort = { field: state.sortBy, order: state.sortOrder };
  }
  return query;
}

export function appliedSortFromState(
  state: ListSearchState,
  eligibleSortFields: ReadonlySet<string>,
): SortSpec | null {
  if (!state.sortBy || !state.sortOrder || !eligibleSortFields.has(state.sortBy)) {
    return null;
  }
  return { field: state.sortBy, order: state.sortOrder };
}
