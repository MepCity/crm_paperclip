"use client";

import type { Criteria, RecordData, RecordId } from "@crm/core/records";
import { useMemo } from "react";
import { FieldValueView } from "@/components/records/detail/field-value";
import { Link } from "@/components/ui/link";
import { useModule, useRecordList, useViews } from "@/lib/api/client/hooks";
import { DEFAULT_FORMAT } from "@/lib/locale";

const LIST_PAGE_SIZE = 100;

export interface ReportingContactsCardBodyProps {
  managerRecord: RecordData;
  orgSlug: string;
  recordPath: (recordId: RecordId) => string;
}

function reportingToFilter(manager: RecordData): Criteria | null {
  const name =
    typeof manager.fields.Full_Name === "string" && manager.fields.Full_Name.length > 0
      ? manager.fields.Full_Name
      : null;
  if (!name) return null;
  return { field: "Reporting_To", comparator: "equal", value: name };
}

export function ReportingContactsCardBody({
  managerRecord,
  recordPath,
}: ReportingContactsCardBodyProps) {
  const moduleQuery = useModule("Contacts");
  const viewsQuery = useViews("Contacts");
  const defaultViewId = useMemo(
    () => viewsQuery.data?.find((view) => view.isDefault)?.id ?? null,
    [viewsQuery.data],
  );
  const reportingFilter = useMemo(() => reportingToFilter(managerRecord), [managerRecord]);
  const listQuery = useMemo(
    () =>
      defaultViewId
        ? {
            viewId: defaultViewId,
            page: 1,
            perPage: LIST_PAGE_SIZE,
            ...(reportingFilter ? { filters: reportingFilter } : {}),
          }
        : { viewId: "pending", page: 1, perPage: LIST_PAGE_SIZE },
    [defaultViewId, reportingFilter],
  );
  const list = useRecordList("Contacts", listQuery, { enabled: defaultViewId !== null });
  const columnApiNames = useMemo(() => {
    const fromView = ["Full_Name", "Account_Name", "Email", "Phone"];
    const withoutName = fromView.filter((name) => name !== "Full_Name");
    return { name: "Full_Name", extras: withoutName.slice(0, 3) };
  }, []);

  const rows = useMemo(() => list.data?.records ?? [], [list.data]);

  const fieldsByName = useMemo(
    () => new Map((moduleQuery.data?.fields ?? []).map((field) => [field.apiName, field])),
    [moduleQuery.data?.fields],
  );

  if (list.isLoading || moduleQuery.isLoading) {
    return (
      <div data-part="empty" className="py-8 text-center text-md text-text-empty">
        Loading...
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div data-part="empty" className="py-8 text-center text-md text-text-empty">
        No records found
      </div>
    );
  }

  const nameField = fieldsByName.get(columnApiNames.name);
  const extraFields = columnApiNames.extras
    .map((apiName: string) => fieldsByName.get(apiName))
    .filter((field): field is NonNullable<typeof field> => field !== undefined);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-md">
        <thead>
          <tr className="border-b border-panel-border text-left text-text-muted">
            <th className="px-4 py-2 font-semibold">
              {nameField?.apiName === "Full_Name" ? "Contact Name" : (nameField?.label ?? "Name")}
            </th>
            {extraFields.map((field) => (
              <th key={field.apiName} className="px-4 py-2 font-semibold">
                {field.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-panel-border last:border-b-0">
              <td className="px-4 py-2">
                <Link
                  href={recordPath(row.id)}
                  variant="body"
                  className="text-primary hover:underline"
                >
                  {typeof row.fields.Full_Name === "string" ? row.fields.Full_Name : row.id}
                </Link>
              </td>
              {extraFields.map((field) => (
                <td key={field.apiName} className="px-4 py-2 text-text">
                  <FieldValueView
                    field={field}
                    value={row.fields[field.apiName] ?? null}
                    format={DEFAULT_FORMAT}
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
