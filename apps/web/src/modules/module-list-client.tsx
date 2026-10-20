"use client";

import { useMemo } from "react";
import { readTagCatalogueAction } from "@/app/crm/[orgSlug]/tags/actions";
import { ModuleListScreen } from "@/components/records/list/module-list-screen";
import { useModule, useUsers } from "@/lib/api/client/hooks";
import {
  moduleCreatePath,
  moduleListCustomPath,
  moduleListDefaultPath,
  moduleRecordPath,
} from "@/lib/crm-paths";
import { type TagCatalogClient, TagCatalogProvider } from "@/lib/records/tags";
import type { ModuleScreenDefinition } from "./types";

export function ModuleListClient({
  orgSlug,
  viewId,
  definition,
  currentUserId,
}: {
  orgSlug: string;
  viewId?: string;
  definition: ModuleScreenDefinition;
  currentUserId?: string;
}) {
  const tagClient = useMemo<TagCatalogClient>(
    () => ({
      async listTags(module) {
        const result = await readTagCatalogueAction(orgSlug, module);
        if (result.status === "error") throw new Error(result.message);
        return [...result.tags];
      },
    }),
    [orgSlug],
  );
  const listConfig = definition.list;
  const module = useModule(definition.apiName);
  const users = useUsers();
  const config = useMemo(() => {
    const fields = module.data?.fields;
    if (!fields?.length || users.data === undefined) return listConfig;
    return {
      ...listConfig,
      module: definition.apiName,
      paths: {
        defaultList: (slug: string) => moduleListDefaultPath(slug, definition.tab),
        customList: (slug: string, _module: string, viewId: string) =>
          moduleListCustomPath(slug, definition.tab, viewId),
        record: (slug: string, _module: string, id: string) =>
          moduleRecordPath(slug, definition.tab, id),
        create: (slug: string) => moduleCreatePath(slug, definition.tab),
      },
      filterGroups: definition.buildFilterGroups({
        fields,
        users: users.data,
        linkField: listConfig.linkField,
        currencyCode: definition.listCurrencyCode,
      }),
    };
  }, [module.data?.fields, users.data, definition, listConfig]);

  if (module.isError) throw module.error;
  if (users.isError) throw users.error;
  if (
    module.isLoading ||
    users.isLoading ||
    !module.data?.fields.length ||
    users.data === undefined
  ) {
    return <div className="module-list-page" aria-hidden="true" />;
  }

  return (
    <TagCatalogProvider client={tagClient}>
      <ModuleListScreen
        orgSlug={orgSlug}
        config={config}
        viewId={viewId}
        currentUserId={currentUserId}
      />
    </TagCatalogProvider>
  );
}
