"use client";

import type { Criteria, FieldValue, ModuleRecordReference, RecordId } from "@crm/core/records";
import { useMemo } from "react";
import { RelatedRecordsListError } from "@/components/records/detail/related-records-list-error";
import { Link } from "@/components/ui/link";
import { useRecordList, useViews } from "@/lib/api/client/hooks";

const LIST_PAGE_SIZE = 200;

export interface ContactRolesCardBodyProps {
  dealId: RecordId;
  contactPath: (recordId: RecordId) => string;
  accountPath: (recordId: RecordId) => string;
}

export function contactRolesOfDeal(dealId: RecordId): Criteria {
  return { field: "Deal", comparator: "equal", value: dealId };
}

function reference(value: FieldValue | undefined): ModuleRecordReference | null {
  return typeof value === "object" && value !== null && "id" in value && "module" in value
    ? (value as ModuleRecordReference)
    : null;
}

function text(value: FieldValue | undefined): string {
  return typeof value === "string" ? value : "";
}

function EmptyState({ children }: { children: string }) {
  return (
    <div data-part="empty" className="py-8 text-center text-md text-text-empty">
      {children}
    </div>
  );
}

export function ContactRolesCardBody({
  dealId,
  contactPath,
  accountPath,
}: ContactRolesCardBodyProps) {
  const filter = useMemo(() => contactRolesOfDeal(dealId), [dealId]);
  const roles = useRecordList(
    "Contact_Roles",
    { viewId: "all-contact-roles", page: 1, perPage: LIST_PAGE_SIZE, filters: filter },
    { enabled: true },
  );
  const contactViews = useViews("Contacts");
  const contactsViewId = useMemo(
    () => contactViews.data?.find((view) => view.isDefault)?.id ?? null,
    [contactViews.data],
  );
  const roleRows = roles.data?.records ?? [];
  // One batched read for the people on this deal; no per-row requests.
  const contacts = useRecordList(
    "Contacts",
    { viewId: contactsViewId ?? "pending", page: 1, perPage: LIST_PAGE_SIZE },
    { enabled: contactsViewId !== null && roleRows.length > 0 },
  );
  const contactsById = useMemo(
    () => new Map((contacts.data?.records ?? []).map((record) => [record.id, record])),
    [contacts.data],
  );

  if (roles.isLoading || contactViews.isLoading || (roleRows.length > 0 && contacts.isLoading)) {
    return <EmptyState>Loading...</EmptyState>;
  }
  if (roles.isError || contactViews.isError || contacts.isError) {
    return <RelatedRecordsListError />;
  }
  if (roleRows.length === 0) return <EmptyState>No records found</EmptyState>;

  return (
    <div className="overflow-x-auto py-2">
      <table className="w-full text-left text-md">
        <thead>
          <tr className="border-b border-panel-border text-text-muted">
            {["Contact Name", "Account Name", "Phone", "Email", "Role Name"].map((label) => (
              <th key={label} className="px-2 py-2 font-semibold text-text-strong">
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {roleRows.map((row) => {
            const contactRef = reference(row.fields.Contact);
            const contact = contactRef ? contactsById.get(contactRef.id) : undefined;
            const account = reference(contact?.fields.Account_Name);
            const contactName = text(contact?.fields.Full_Name) || contactRef?.name || "";
            return (
              <tr key={row.id} className="border-b border-panel-border last:border-b-0">
                <td className="whitespace-nowrap px-2 py-2">
                  {contactRef ? (
                    <Link
                      href={contactPath(contactRef.id)}
                      variant="body"
                      className="text-primary hover:underline"
                    >
                      {contactName || contactRef.id}
                    </Link>
                  ) : null}
                </td>
                <td className="whitespace-nowrap px-2 py-2">
                  {account ? (
                    <Link
                      href={accountPath(account.id)}
                      variant="body"
                      className="text-primary hover:underline"
                    >
                      {account.name ?? account.id}
                    </Link>
                  ) : null}
                </td>
                <td className="whitespace-nowrap px-2 py-2 text-text">
                  {text(contact?.fields.Phone)}
                </td>
                <td className="whitespace-nowrap px-2 py-2 text-text">
                  {text(contact?.fields.Email)}
                </td>
                <td className="whitespace-nowrap px-2 py-2 text-text">
                  {text(row.fields.Contact_Role)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
