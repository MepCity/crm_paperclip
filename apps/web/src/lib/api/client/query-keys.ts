import type { ListQuery, SummaryQuery } from "@crm/core/records";

function root(orgSlug: string) {
  return ["crm", orgSlug] as const;
}

export const apiKeys = {
  root,
  timelines: (orgSlug: string) => [...root(orgSlug), "timelines"] as const,
  homeCurrency: (orgSlug: string) => [...root(orgSlug), "homeCurrency"] as const,
  imports: (orgSlug: string) => [...root(orgSlug), "imports"] as const,
  importJob: (orgSlug: string, id: string) => [...root(orgSlug), "imports", id] as const,
  exports: (orgSlug: string) => [...root(orgSlug), "exports"] as const,
  users: (orgSlug: string) => [...root(orgSlug), "users"] as const,
  module: (orgSlug: string, module: string) => [...root(orgSlug), "module", module] as const,
  views: (orgSlug: string, module: string) =>
    [...apiKeys.module(orgSlug, module), "views"] as const,
  view: (orgSlug: string, module: string, viewId: string) =>
    [...apiKeys.module(orgSlug, module), "view", viewId] as const,
  kanbanViews: (orgSlug: string, module: string) =>
    [...apiKeys.module(orgSlug, module), "kanbanViews"] as const,
  kanbanView: (orgSlug: string, module: string, viewId: string) =>
    [...apiKeys.module(orgSlug, module), "kanbanView", viewId] as const,
  list: (orgSlug: string, module: string, query: ListQuery) =>
    [...apiKeys.module(orgSlug, module), "list", serializeListQuery(query)] as const,
  count: (
    orgSlug: string,
    module: string,
    query: Pick<
      ListQuery,
      | "viewId"
      | "filters"
      | "search"
      | "activityFilter"
      | "campaignFilter"
      | "systemFilters"
      | "relatedModules"
    >,
  ) => [...apiKeys.module(orgSlug, module), "count", serializeCountQuery(query)] as const,
  summarize: (orgSlug: string, module: string, query: SummaryQuery) =>
    [...apiKeys.module(orgSlug, module), "summarize", serializeSummarizeQuery(query)] as const,
  record: (orgSlug: string, module: string, id: string) =>
    [...apiKeys.module(orgSlug, module), "record", id] as const,
  duplicateGroups: (orgSlug: string, module: string, fields: readonly string[]) =>
    [...apiKeys.module(orgSlug, module), "duplicateGroups", fields.join(",")] as const,
};

/** Invalidates every duplicate-group query of a module. */
export function duplicateGroupsPrefix(orgSlug: string, module: string) {
  return [...apiKeys.module(orgSlug, module), "duplicateGroups"] as const;
}

/** Invalidates list queries only (not module metadata). */
export function listQueriesPrefix(orgSlug: string, module: string) {
  return [...apiKeys.module(orgSlug, module), "list"] as const;
}

/** Invalidates count queries only (not module metadata). */
export function countQueriesPrefix(orgSlug: string, module: string) {
  return [...apiKeys.module(orgSlug, module), "count"] as const;
}

/** Invalidates summarize queries only (not module metadata). */
export function summarizeQueriesPrefix(orgSlug: string, module: string) {
  return [...apiKeys.module(orgSlug, module), "summarize"] as const;
}

function serializeListQuery(query: ListQuery): string {
  return JSON.stringify(query);
}

function serializeCountQuery(
  query: Pick<
    ListQuery,
    | "viewId"
    | "filters"
    | "search"
    | "activityFilter"
    | "campaignFilter"
    | "systemFilters"
    | "relatedModules"
  >,
): string {
  return JSON.stringify(query);
}

function serializeSummarizeQuery(query: SummaryQuery): string {
  return JSON.stringify(query);
}
