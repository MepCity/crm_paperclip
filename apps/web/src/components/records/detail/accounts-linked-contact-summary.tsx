"use client";

import type { Criteria, RecordData, RecordId } from "@crm/core/records";
import { useMemo } from "react";
import { Icons } from "@/components/ui/icon";
import { Link } from "@/components/ui/link";
import { useRecordList, useViews } from "@/lib/api/client/hooks";

const LIST_PAGE_SIZE = 1;

export interface AccountsLinkedContactSummaryProps {
  accountRecord: RecordData;
  contactRecordPath: (recordId: RecordId) => string;
}

function accountContactsFilter(accountId: RecordId): Criteria {
  return { field: "Account_Name", comparator: "equal", value: accountId };
}

/** First related Contact in list order (interim rule per accounts-record-detail spec). */
export function AccountsLinkedContactSummary({
  accountRecord,
  contactRecordPath,
}: AccountsLinkedContactSummaryProps) {
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
  const contact = list.data?.records[0];

  if (list.isLoading || viewsQuery.isLoading) return null;
  if (!contact) return null;

  const name =
    typeof contact.fields.Full_Name === "string" && contact.fields.Full_Name.length > 0
      ? contact.fields.Full_Name
      : contact.id;
  const email =
    typeof contact.fields.Email === "string" && contact.fields.Email.length > 0
      ? contact.fields.Email
      : null;

  return (
    <section
      aria-label="Contacts summary"
      data-accounts-contacts-summary
      className="mx-3 mb-3 flex gap-3 rounded-md border border-panel-border bg-surface px-4 py-3"
    >
      <div
        data-contact-portrait
        aria-hidden
        className="flex size-12 shrink-0 items-center justify-center rounded-md bg-bg text-avatar"
      >
        <Icons.recordPortrait className="size-full" />
      </div>
      <div className="flex min-w-0 flex-col gap-1">
        <Link
          href={contactRecordPath(contact.id)}
          variant="body"
          className="text-md font-semibold text-primary hover:underline"
        >
          {name}
        </Link>
        {email ? (
          <Link
            href={`mailto:${email}`}
            variant="body"
            laterModule="M10"
            className="text-md text-primary hover:underline"
          >
            {email}
          </Link>
        ) : null}
      </div>
    </section>
  );
}
