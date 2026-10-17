"use client";

import { createContext, type ReactNode, useContext, useEffect, useState } from "react";

export type TagModule = "Leads" | "Contacts" | "Accounts" | "Deals";
export interface TagOption {
  id: string;
  name: string;
  color: string | null;
}
export interface TagCatalogClient {
  listTags(module: TagModule): Promise<TagOption[]>;
}

/** Neutral, module-scoped fixtures until the tag transport is approved. */
export function createFixtureTagCatalog(
  catalogs: Partial<Record<TagModule, readonly TagOption[]>> = Object.fromEntries(
    ["Leads", "Contacts", "Accounts", "Deals"].map((module) => [
      module,
      [
        { id: `${module.toLowerCase()}-follow-up`, name: "Follow up", color: "#5464f2" },
        { id: `${module.toLowerCase()}-review`, name: "Review", color: null },
        { id: `${module.toLowerCase()}-priority`, name: "Priority", color: "#22865a" },
      ],
    ]),
  ),
): TagCatalogClient {
  return {
    async listTags(module) {
      return (catalogs[module] ?? []).map((tag) => ({ ...tag }));
    },
  };
}

const defaultTagCatalog = createFixtureTagCatalog();
const TagCatalogContext = createContext<TagCatalogClient>(defaultTagCatalog);
export function TagCatalogProvider({
  client,
  children,
}: {
  client: TagCatalogClient;
  children: ReactNode;
}) {
  return <TagCatalogContext.Provider value={client}>{children}</TagCatalogContext.Provider>;
}
export interface ModuleTags {
  status: "loading" | "ready" | "error";
  tags: TagOption[];
}
export function useModuleTags(module: TagModule | undefined): ModuleTags {
  const client = useContext(TagCatalogContext);
  const [result, setResult] = useState<
    ModuleTags & { module?: TagModule; client: TagCatalogClient }
  >({
    status: "loading",
    tags: [],
    module,
    client,
  });
  useEffect(() => {
    let active = true;
    if (module) {
      Promise.resolve()
        .then(() => client.listTags(module))
        .then(
          (tags) => {
            if (active) setResult({ status: "ready", tags, module, client });
          },
          () => {
            if (active) setResult({ status: "error", tags: [], module, client });
          },
        );
    }
    return () => {
      active = false;
    };
  }, [client, module]);
  if (!module) return { status: "ready", tags: [] };
  if (result.module !== module || result.client !== client) return { status: "loading", tags: [] };
  return result;
}
