import type { ListQuery } from "@crm/core/records";

function root(orgSlug: string) {
  return ["crm", orgSlug] as const;
}

export const apiKeys = {
  root,
  homeCurrency: (orgSlug: string) => [...root(orgSlug), "homeCurrency"] as const,
  users: (orgSlug: string) => [...root(orgSlug), "users"] as const,
  module: (orgSlug: string, module: string) => [...root(orgSlug), "module", module] as const,
  views: (orgSlug: string, module: string) =>
    [...apiKeys.module(orgSlug, module), "views"] as const,
  view: (orgSlug: string, module: string, viewId: string) =>
    [...apiKeys.module(orgSlug, module), "view", viewId] as const,
  list: (orgSlug: string, module: string, query: ListQuery) =>
    [...apiKeys.module(orgSlug, module), "list", serializeListQuery(query)] as const,
  count: (
    orgSlug: string,
    module: string,
    query: Pick<ListQuery, "viewId" | "filters" | "search">,
  ) => [...apiKeys.module(orgSlug, module), "count", serializeCountQuery(query)] as const,
  record: (orgSlug: string, module: string, id: string) =>
    [...apiKeys.module(orgSlug, module), "record", id] as const,
};

/** Invalidates list queries only (not module metadata). */
export function listQueriesPrefix(orgSlug: string, module: string) {
  return [...apiKeys.module(orgSlug, module), "list"] as const;
}

/** Invalidates count queries only (not module metadata). */
export function countQueriesPrefix(orgSlug: string, module: string) {
  return [...apiKeys.module(orgSlug, module), "count"] as const;
}

function serializeListQuery(query: ListQuery): string {
  return JSON.stringify(query);
}

function serializeCountQuery(query: Pick<ListQuery, "viewId" | "filters" | "search">): string {
  return JSON.stringify(query);
}
