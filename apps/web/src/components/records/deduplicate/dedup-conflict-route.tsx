"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo } from "react";
import { useModule } from "@/lib/api/client/hooks";
import { moduleListDefaultPath } from "@/lib/crm-paths";
import type { ModuleScreenDefinition } from "@/modules/types";
import { DEDUP_MAX_FIELDS, resolveDedupFields } from "./dedup-config";
import { DedupConflictGroups } from "./dedup-conflict-screen";

/** Reads the match fields off the address and shows only fields the module still offers. */
export function DedupConflictRoute({
  orgSlug,
  definition,
}: {
  orgSlug: string;
  definition: ModuleScreenDefinition;
}) {
  const router = useRouter();
  const moduleQuery = useModule(definition.apiName);
  const searchParams = useSearchParams();
  const listHref = moduleListDefaultPath(orgSlug, definition.tab);
  const fieldsParam = searchParams.get("fields") ?? "";
  const apiNames = useMemo(
    () => fieldsParam.split(",").filter(Boolean).slice(0, DEDUP_MAX_FIELDS),
    [fieldsParam],
  );

  const panelNames = useMemo(
    () =>
      moduleQuery.data
        ? resolveDedupFields(definition.apiName, moduleQuery.data.fields).map((f) => f.apiName)
        : [],
    [moduleQuery.data, definition.apiName],
  );
  const knownNames = apiNames.filter((apiName) => panelNames.includes(apiName));

  useEffect(() => {
    if (moduleQuery.isLoading) return;
    if (knownNames.length === 0) router.replace(listHref);
  }, [moduleQuery.isLoading, knownNames.length, router, listHref]);

  if (moduleQuery.isLoading || !moduleQuery.data || knownNames.length === 0) {
    return <div className="dedup-conflict p-6" aria-busy="true" />;
  }

  return (
    <DedupConflictGroups
      module={definition.apiName}
      pluralLabel={definition.pluralLabel}
      linkField={definition.list.linkField}
      fields={moduleQuery.data.fields}
      apiNames={knownNames}
      listHref={listHref}
    />
  );
}
