"use client";

import type { Criteria, RecordData, RecordId } from "@crm/core/records";
import { useMemo } from "react";
import { FieldValueView } from "@/components/records/detail/field-value";
import { RelatedRecordsListError } from "@/components/records/detail/related-records-list-error";
import { Link } from "@/components/ui/link";
import { useModule, useRecordList, useUsers, useView, useViews } from "@/lib/api/client/hooks";
import { DEFAULT_FORMAT } from "@/lib/locale";

const LIST_PAGE_SIZE = 100;

/** Provisional rule (MEP-900): the filled card was not observed. */
const CASES_CARD_COLUMNS = ["Subject", "Case_Number", "Status", "Priority", "Owner"] as const;

export interface RelatedCasesCardBodyProps {
  managerRecord: RecordData;
  /** Lookup field on Cases that points back to the record owning this card. */
  filterField: string;
  caseRecordPath: (recordId: RecordId) => string;
}

function casesOfRecord(managerId: RecordId, filterField: string): Criteria {
  return { field: filterField, comparator: "equal", value: managerId };
}

export function RelatedCasesCardBody({
  managerRecord,
  filterField,
  caseRecordPath,
}: RelatedCasesCardBodyProps) {
  const moduleQuery = useModule("Cases");
  const viewsQuery = useViews("Cases");
  const usersQuery = useUsers();
  const defaultViewId = useMemo(
    () => viewsQuery.data?.find((view) => view.isDefault)?.id ?? null,
    [viewsQuery.data],
  );
  const defaultView = useView("Cases", defaultViewId ?? "");
  const filter = useMemo(
    () => casesOfRecord(managerRecord.id, filterField),
    [managerRecord.id, filterField],
  );
  const listQuery = useMemo(
    () =>
      defaultViewId
        ? { viewId: defaultViewId, page: 1, perPage: LIST_PAGE_SIZE, filters: filter }
        : { viewId: "pending", page: 1, perPage: LIST_PAGE_SIZE },
    [defaultViewId, filter],
  );
  const list = useRecordList("Cases", listQuery, { enabled: defaultViewId !== null });
  const fieldsByName = useMemo(
    () => new Map((moduleQuery.data?.fields ?? []).map((field) => [field.apiName, field])),
    [moduleQuery.data?.fields],
  );
  const ownerNames = useMemo(() => {
    const map: Record<string, string> = {};
    for (const member of usersQuery.data ?? []) map[member.userId] = member.name;
    return map;
  }, [usersQuery.data]);
  const rows = list.data?.records ?? [];

  if (
    list.isLoading ||
    moduleQuery.isLoading ||
    viewsQuery.isLoading ||
    defaultView.isLoading ||
    usersQuery.isLoading
  ) {
    return (
      <div data-part="empty" className="py-8 text-center text-md text-text-empty">
        Loading...
      </div>
    );
  }

  if (
    list.isError ||
    moduleQuery.isError ||
    viewsQuery.isError ||
    defaultView.isError ||
    usersQuery.isError
  ) {
    return <RelatedRecordsListError />;
  }

  if (rows.length === 0) {
    return (
      <div data-part="empty" className="py-8 text-center text-md text-text-empty">
        No records found
      </div>
    );
  }

  const columns = CASES_CARD_COLUMNS.map((apiName) => fieldsByName.get(apiName)).filter(
    (field): field is NonNullable<typeof field> => field !== undefined,
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-md">
        <thead>
          <tr className="border-b border-panel-border text-left text-text-muted">
            {columns.map((field) => (
              <th key={field.apiName} className="px-2 py-2 font-semibold">
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
                if (field.apiName === "Subject") {
                  return (
                    <td key={field.apiName} className="px-2 py-2">
                      <Link
                        href={caseRecordPath(row.id)}
                        variant="body"
                        className="text-primary hover:underline"
                      >
                        {typeof value === "string" ? value : row.id}
                      </Link>
                    </td>
                  );
                }
                return (
                  <td key={field.apiName} className="px-2 py-2 text-text">
                    <FieldValueView
                      field={field}
                      value={value}
                      ownerNames={ownerNames}
                      format={DEFAULT_FORMAT}
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
