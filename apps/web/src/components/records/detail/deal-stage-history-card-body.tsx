"use client";

import type { Criteria, RecordId } from "@crm/core/records";
import { useMemo } from "react";
import { FieldValueView } from "@/components/records/detail/field-value";
import { RelatedRecordsListError } from "@/components/records/detail/related-records-list-error";
import { useModule, useRecordList, useUsers, useViews } from "@/lib/api/client/hooks";
import { useFormat } from "@/lib/format-context";

const LIST_PAGE_SIZE = 100;

const STAGE_HISTORY_FIELDS = [
  "Stage",
  "Amount",
  "Probability",
  "Expected_Revenue",
  "Closing_Date",
  "Stage_Duration_Calendar_Days",
  "Modified_Time",
  "Modified_By",
] as const;

export interface DealStageHistoryCardBodyProps {
  dealId: RecordId;
}

function dealHistoryFilter(dealId: RecordId): Criteria {
  return { field: "Potential_Name", comparator: "equal", value: dealId };
}

export function DealStageHistoryCardBody({ dealId }: DealStageHistoryCardBodyProps) {
  const orgFormat = useFormat();
  const moduleQuery = useModule("DealHistory");
  const viewsQuery = useViews("DealHistory");
  const usersQuery = useUsers();
  const defaultViewId = useMemo(
    () => viewsQuery.data?.find((view) => view.isDefault)?.id ?? "all-deal-history",
    [viewsQuery.data],
  );
  const filter = useMemo(() => dealHistoryFilter(dealId), [dealId]);
  const listQuery = useMemo(
    () => ({
      viewId: defaultViewId,
      page: 1,
      perPage: LIST_PAGE_SIZE,
      filters: filter,
    }),
    [defaultViewId, filter],
  );
  const list = useRecordList("DealHistory", listQuery, {
    enabled: viewsQuery.isSuccess || viewsQuery.isError,
  });
  const fieldsByName = useMemo(
    () => new Map((moduleQuery.data?.fields ?? []).map((field) => [field.apiName, field])),
    [moduleQuery.data?.fields],
  );
  const ownerNames = useMemo(
    () =>
      Object.fromEntries((usersQuery.data ?? []).map((user) => [user.userId, user.name])) as Record<
        string,
        string
      >,
    [usersQuery.data],
  );
  const rows = list.data?.records ?? [];

  if (list.isLoading || moduleQuery.isLoading || viewsQuery.isLoading) {
    return (
      <div data-part="empty" className="py-8 text-center text-md text-text-empty">
        Loading...
      </div>
    );
  }

  if (list.isError || moduleQuery.isError || viewsQuery.isError) {
    return <RelatedRecordsListError />;
  }

  if (rows.length === 0) {
    return (
      <div data-part="empty" className="py-8 text-center text-md text-text-empty">
        No records found
      </div>
    );
  }

  const columns = STAGE_HISTORY_FIELDS.map((apiName) => fieldsByName.get(apiName)).filter(
    (field): field is NonNullable<typeof field> => field !== undefined,
  );

  return (
    <div className="overflow-x-auto py-2">
      <table className="w-full text-left text-md">
        <thead>
          <tr className="border-b border-panel-border text-text-muted">
            {columns.map((field) => (
              <th key={field.apiName} className="px-2 py-2 font-semibold text-text-strong">
                {field.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-panel-border last:border-b-0">
              {columns.map((field) => {
                const value = row.fields[field.apiName] ?? null;
                return (
                  <td key={field.apiName} className="whitespace-nowrap px-2 py-2 text-text">
                    <FieldValueView
                      field={field}
                      value={value}
                      format={orgFormat}
                      ownerNames={ownerNames}
                    />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
