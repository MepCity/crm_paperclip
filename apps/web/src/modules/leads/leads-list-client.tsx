"use client";

import { useMemo } from "react";
import { ModuleListScreen } from "@/components/records/list/module-list-screen";
import { useModule, useUsers } from "@/lib/api/client/hooks";
import { LEADS_LIST_CURRENCY_CODE, leadsListPageConfig } from "./list-config";
import { buildLeadsFilterGroups } from "./list-filters";

export function LeadsListClient({ orgSlug, viewId }: { orgSlug: string; viewId?: string }) {
  const module = useModule(leadsListPageConfig.module);
  const users = useUsers();
  const config = useMemo(() => {
    const fields = module.data?.fields;
    if (!fields?.length || users.data === undefined) return leadsListPageConfig;
    return {
      ...leadsListPageConfig,
      filterGroups: buildLeadsFilterGroups({
        fields,
        users: users.data,
        linkField: leadsListPageConfig.linkField,
        currencyCode: LEADS_LIST_CURRENCY_CODE,
      }),
    };
  }, [module.data?.fields, users.data]);

  if (!module.data?.fields.length || users.data === undefined) {
    return <div className="module-list-page" aria-hidden="true" />;
  }

  return <ModuleListScreen orgSlug={orgSlug} config={config} viewId={viewId} />;
}
