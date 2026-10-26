"use client";

import type { Criteria, RecordData, RecordId } from "@crm/core/records";
import { useMemo } from "react";
import { FieldValueView } from "@/components/records/detail/field-value";
import { RelatedRecordsListError } from "@/components/records/detail/related-records-list-error";
import { Button } from "@/components/ui/button";
import { Icons } from "@/components/ui/icon";
import { Link } from "@/components/ui/link";
import { useModule, useRecordList, useViews } from "@/lib/api/client/hooks";
import { useFormat } from "@/lib/format-context";

const LIST_PAGE_SIZE = 100;

const CONTACTS_TABLE_FIELDS = ["Full_Name", "Email", "Phone", "Mobile", "Fax", "Owner"] as const;

export interface AccountContactsCardBodyProps {
  accountRecord: RecordData;
  orgSlug: string;
  contactRecordPath: (recordId: RecordId) => string;
}

function accountContactsFilter(accountId: RecordId): Criteria {
  return { field: "Account_Name", comparator: "equal", value: accountId };
}

export function AccountContactsCardBody({
  accountRecord,
  contactRecordPath,
}: AccountContactsCardBodyProps) {
  const orgFormat = useFormat();
  const moduleQuery = useModule("Contacts");
  const viewsQuery = useViews("Contacts");
  const defaultViewId = useMemo(
    () => viewsQuery.data?.find((view) => view.isDefault)?.id ?? null,
    [viewsQuery.data],
  );
  const filter = useMemo(() => accountContactsFilter(accountRecord.id), [accountRecord.id]);
  const listQuery = useMemo(
    () =>
      defaultViewId
        ? { viewId: defaultViewId, page: 1, perPage: LIST_PAGE_SIZE, filters: filter }
        : { viewId: "pending", page: 1, perPage: LIST_PAGE_SIZE },
    [defaultViewId, filter],
  );
  const list = useRecordList("Contacts", listQuery, { enabled: defaultViewId !== null });
  const fieldsByName = useMemo(
    () => new Map((moduleQuery.data?.fields ?? []).map((field) => [field.apiName, field])),
    [moduleQuery.data?.fields],
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

  const columns = CONTACTS_TABLE_FIELDS.map((apiName) => fieldsByName.get(apiName)).filter(
    (field): field is NonNullable<typeof field> => field !== undefined,
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-md">
        <thead>
          <tr className="border-b border-panel-border text-left text-text-muted">
            {columns.map((field) => (
              <th key={field.apiName} className="px-2 py-2 font-semibold">
                {field.apiName === "Full_Name" ? "Contact Name" : field.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-panel-border last:border-b-0">
              {columns.map((field) => {
                const value = row.fields[field.apiName] ?? null;
                if (field.apiName === "Full_Name") {
                  return (
                    <td key={field.apiName} className="px-2 py-2">
                      <Link
                        href={contactRecordPath(row.id)}
                        variant="body"
                        className="text-primary hover:underline"
                      >
                        {typeof value === "string" ? value : row.id}
                      </Link>
                    </td>
                  );
                }
                if (field.apiName === "Email" && typeof value === "string" && value.length > 0) {
                  return (
                    <td key={field.apiName} className="px-2 py-2">
                      <Link
                        href={`mailto:${value}`}
                        variant="body"
                        laterModule="M10"
                        className="text-primary hover:underline"
                      >
                        {value}
                      </Link>
                    </td>
                  );
                }
                if (field.apiName === "Phone" && typeof value === "string" && value.length > 0) {
                  return (
                    <td key={field.apiName} className="px-2 py-2">
                      <span className="inline-flex items-center gap-1">
                        <span>{value}</span>
                        <Button variant="icon" size="compact" laterModule="M5" aria-label="Call">
                          <Icons.phone aria-hidden className="size-3.5" />
                        </Button>
                      </span>
                    </td>
                  );
                }
                return (
                  <td key={field.apiName} className="px-2 py-2 text-text">
                    <FieldValueView field={field} value={value} format={orgFormat} />
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
