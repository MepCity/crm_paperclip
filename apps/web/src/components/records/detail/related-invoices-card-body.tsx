"use client";

import type { Criteria, RecordData, RecordId } from "@crm/core/records";
import { useMemo, useState } from "react";
import { FieldValueView } from "@/components/records/detail/field-value";
import { RelatedRecordsListError } from "@/components/records/detail/related-records-list-error";
import { Link } from "@/components/ui/link";
import { useRecordLabel } from "@/i18n/record-labels";
import { useModule, useRecordList, useUsers, useViews } from "@/lib/api/client/hooks";
import { useFormat } from "@/lib/format-context";

const LIST_PAGE_SIZE = 100;

const INVOICES_CARD_COLUMNS = [
  "Subject",
  "Status",
  "Invoice_Date",
  "Grand_Total",
  "Account_Name",
  "Owner",
] as const;

export interface RelatedInvoicesCardBodyProps {
  managerRecord: RecordData;
  filterField?: string;
  invoiceRecordPath: (recordId: RecordId) => string;
}

export function RelatedInvoicesCardBody({
  managerRecord,
  filterField = "Invoiced_Items.Product_Name",
  invoiceRecordPath,
}: RelatedInvoicesCardBodyProps) {
  const recordLabel = useRecordLabel();
  const orgFormat = useFormat();
  const [page, setPage] = useState(1);
  const moduleQuery = useModule("Invoices");
  const viewsQuery = useViews("Invoices");
  const usersQuery = useUsers();
  const defaultViewId = useMemo(
    () => viewsQuery.data?.find((view) => view.isDefault)?.id ?? "all-invoices",
    [viewsQuery.data],
  );
  const filter: Criteria = useMemo(
    () => ({ field: filterField, comparator: "equal", value: managerRecord.id }),
    [filterField, managerRecord.id],
  );
  const listQuery = useMemo(
    () => ({
      viewId: defaultViewId,
      page,
      perPage: LIST_PAGE_SIZE,
      filters: filter,
    }),
    [defaultViewId, filter, page],
  );
  const list = useRecordList("Invoices", listQuery, { enabled: defaultViewId !== null });
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

  if (list.isLoading || moduleQuery.isLoading || viewsQuery.isLoading || usersQuery.isLoading) {
    return (
      <div data-part="empty" className="py-8 text-center text-md text-text-empty">
        Loading...
      </div>
    );
  }

  if (list.isError || moduleQuery.isError || viewsQuery.isError || usersQuery.isError) {
    return <RelatedRecordsListError />;
  }

  if (rows.length === 0 && page === 1) {
    return (
      <div data-part="empty" className="py-8 text-center text-md text-text-empty">
        {recordLabel("No records found")}
      </div>
    );
  }

  const columns = INVOICES_CARD_COLUMNS.map((apiName) => fieldsByName.get(apiName)).filter(
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
                        href={invoiceRecordPath(row.id)}
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
                      format={orgFormat}
                    />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {page > 1 || list.data?.moreRecords ? (
        <div data-part="pager" className="flex justify-end gap-3 px-2 py-2 text-md">
          <button
            type="button"
            className="text-primary hover:underline disabled:text-text-muted disabled:no-underline"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </button>
          <button
            type="button"
            className="text-primary hover:underline disabled:text-text-muted disabled:no-underline"
            disabled={!list.data?.moreRecords}
            onClick={() => setPage(page + 1)}
          >
            Next
          </button>
        </div>
      ) : null}
    </div>
  );
}
