"use client";

import type { FieldDefinition, ListQuery } from "@crm/core/records";
import { useEffect, useMemo, useState } from "react";
import { CellValue } from "@/components/records/list/cell-value";
import { useModule, useRecordList, useUsers, useView, useViews } from "@/lib/api/client/hooks";
import { DEFAULT_FORMAT } from "@/lib/locale";
import type { ModuleScreenDefinition } from "@/modules/types";
import { readPrintListQuery } from "./print-list-handoff";
import { PrintToolbar } from "./print-toolbar";
import "./print-page.css";

const FALLBACK_PER_PAGE = 30;

/** Interim rule: the current view's records (one page) as a table of the view's columns. */
export function ListPrintScreen({
  orgSlug,
  viewId: routeViewId,
  definition,
}: {
  orgSlug: string;
  viewId?: string;
  definition: ModuleScreenDefinition;
}) {
  const moduleApiName = definition.apiName;
  const viewsQuery = useViews(moduleApiName);
  const viewId = routeViewId ?? viewsQuery.data?.find((view) => view.isDefault)?.id ?? "";
  const viewQuery = useView(moduleApiName, viewId);
  const moduleQuery = useModule(moduleApiName);
  const usersQuery = useUsers();
  const [handoff, setHandoff] = useState<ListQuery | null | undefined>(undefined);
  useEffect(() => {
    if (viewId) setHandoff(readPrintListQuery(orgSlug, moduleApiName, viewId));
  }, [orgSlug, moduleApiName, viewId]);

  const columnApiNames = viewQuery.data?.columns ?? [];
  const query = useMemo((): ListQuery | null => {
    if (!viewId || handoff === undefined || columnApiNames.length === 0) return null;
    return handoff ?? { viewId, page: 1, perPage: FALLBACK_PER_PAGE, fields: [...columnApiNames] };
  }, [viewId, handoff, columnApiNames]);

  const list = useRecordList(
    moduleApiName,
    query ?? { viewId: viewId || "pending", page: 1, perPage: FALLBACK_PER_PAGE, fields: [] },
    { enabled: query !== null },
  );

  const ownerNames = useMemo(() => {
    const map: Record<string, string> = {};
    for (const member of usersQuery.data ?? []) map[member.userId] = member.name;
    return map;
  }, [usersQuery.data]);

  if (viewsQuery.isError) throw viewsQuery.error;
  if (viewQuery.isError) throw viewQuery.error;
  if (moduleQuery.isError) throw moduleQuery.error;
  if (list.isError) throw list.error;
  if (!moduleQuery.data || !viewQuery.data || usersQuery.data === undefined || !list.data) {
    return <div className="print-page" aria-hidden="true" />;
  }

  const byName = new Map(moduleQuery.data.fields.map((field) => [field.apiName, field]));
  const columns = columnApiNames
    .map((apiName) => byName.get(apiName))
    .filter((field): field is FieldDefinition => field !== undefined);

  return (
    <div className="print-page" data-print-kind="list">
      <PrintToolbar title={viewQuery.data.name} moduleLabel={definition.pluralLabel} />
      <table className="print-page__table">
        <thead>
          <tr>
            {columns.map((field) => (
              <th key={field.apiName} scope="col">
                {field.apiName === definition.list.linkField
                  ? definition.list.linkFieldLabel
                  : field.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {list.data.records.map((record) => (
            <tr key={record.id}>
              {columns.map((field) => (
                <td key={field.apiName}>
                  <CellValue
                    field={field}
                    value={record.fields[field.apiName] ?? null}
                    ownerNames={ownerNames}
                    format={DEFAULT_FORMAT}
                    orgSlug={orgSlug}
                    currencyCode={definition.list.cellCurrencyCode}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
