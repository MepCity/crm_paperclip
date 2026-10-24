"use client";

import type { Criteria, RecordData, RecordId } from "@crm/core/records";
import { useMemo } from "react";
import { FieldValueView } from "@/components/records/detail/field-value";
import { RelatedRecordsListError } from "@/components/records/detail/related-records-list-error";
import { Link } from "@/components/ui/link";
import { useModule, useRecordList, useUsers, useViews } from "@/lib/api/client/hooks";
import { DEFAULT_FORMAT } from "@/lib/locale";

const LIST_PAGE_SIZE = 100;
const MEMBER_ACCOUNT_COLUMNS = ["Account_Name", "Phone", "Website", "Owner"] as const;

export interface AccountMemberAccountsCardBodyProps {
  parentRecord: RecordData;
  orgSlug: string;
  accountRecordPath: (recordId: RecordId) => string;
}

function memberAccountsFilter(parentId: RecordId): Criteria {
  return { field: "Parent_Account", comparator: "equal", value: parentId };
}

export function AccountMemberAccountsCardBody({
  parentRecord,
  accountRecordPath,
}: AccountMemberAccountsCardBodyProps) {
  const moduleQuery = useModule("Accounts");
  const viewsQuery = useViews("Accounts");
  const usersQuery = useUsers();
  const defaultViewId = useMemo(
    () => viewsQuery.data?.find((view) => view.isDefault)?.id ?? "all-accounts",
    [viewsQuery.data],
  );
  const filter = useMemo(() => memberAccountsFilter(parentRecord.id), [parentRecord.id]);
  const listQuery = useMemo(
    () => ({ viewId: defaultViewId, page: 1, perPage: LIST_PAGE_SIZE, filters: filter }),
    [defaultViewId, filter],
  );
  const list = useRecordList("Accounts", listQuery, { enabled: Boolean(defaultViewId) });
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

  const columns = MEMBER_ACCOUNT_COLUMNS.map((apiName) => fieldsByName.get(apiName)).filter(
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
                if (field.apiName === "Account_Name") {
                  return (
                    <td key={field.apiName} className="px-2 py-2">
                      <Link
                        href={accountRecordPath(row.id)}
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
