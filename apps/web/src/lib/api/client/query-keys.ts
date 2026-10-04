import type { ListQuery } from "@crm/core/records";

const root = ["crm"] as const;

export const apiKeys = {
  users: [...root, "users"] as const,
  module: (module: string) => [...root, "module", module] as const,
  views: (module: string) => [...apiKeys.module(module), "views"] as const,
  view: (module: string, viewId: string) => [...apiKeys.module(module), "view", viewId] as const,
  list: (module: string, query: ListQuery) =>
    [...apiKeys.module(module), "list", serializeListQuery(query)] as const,
  count: (module: string, query: Pick<ListQuery, "viewId" | "filters" | "search">) =>
    [...apiKeys.module(module), "count", serializeCountQuery(query)] as const,
  record: (module: string, id: string) => [...apiKeys.module(module), "record", id] as const,
};

function serializeListQuery(query: ListQuery): string {
  return JSON.stringify(query);
}

function serializeCountQuery(query: Pick<ListQuery, "viewId" | "filters" | "search">): string {
  return JSON.stringify(query);
}
