"use client";

import type { ModuleRecordReference, RecordData } from "@crm/core/records";
import { Icons } from "@/components/ui/icon";
import { Link } from "@/components/ui/link";
import { useRecord } from "@/lib/api/client/hooks";

export interface DealsContactPersonSummaryProps {
  dealRecord: RecordData;
  contactRecordPath: (contactId: string) => string;
  accountRecordPath: (accountId: string) => string;
}

function asLookup(value: unknown): ModuleRecordReference | null {
  if (!value || typeof value !== "object" || !("module" in value) || !("id" in value)) return null;
  return value as ModuleRecordReference;
}

/** DD-66 – DD-68: Contact Person summary from the deal's Contact_Name lookup. */
export function DealsContactPersonSummary({
  dealRecord,
  contactRecordPath,
  accountRecordPath,
}: DealsContactPersonSummaryProps) {
  const contactRef = asLookup(dealRecord.fields.Contact_Name);
  const contactQuery = useRecord("Contacts", contactRef?.id ?? "");

  if (!contactRef) return null;
  if (contactQuery.isLoading) return null;
  const contact = contactQuery.data;
  if (!contact) return null;

  const name =
    typeof contact.fields.Full_Name === "string" && contact.fields.Full_Name.length > 0
      ? contact.fields.Full_Name
      : (contactRef.name ?? contact.id);
  const accountRef = asLookup(contact.fields.Account_Name);
  const accountName =
    accountRef?.name ?? (typeof accountRef?.id === "string" ? accountRef.id : null);
  const email =
    typeof contact.fields.Email === "string" && contact.fields.Email.length > 0
      ? contact.fields.Email
      : null;

  return (
    <section
      aria-label="Contact Person summary"
      data-deals-contact-person-summary
      className="mx-3 mb-3 flex flex-col gap-2 rounded-md border border-panel-border bg-surface px-4 py-3"
    >
      <h3 className="text-md font-semibold text-text">Contact Person</h3>
      <div className="flex gap-3">
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
          {accountRef && accountName ? (
            <p className="text-md text-text">
              <span className="text-text-muted">at </span>
              <Link
                href={accountRecordPath(accountRef.id)}
                variant="body"
                className="text-primary hover:underline"
              >
                {accountName}
              </Link>
            </p>
          ) : null}
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
      </div>
    </section>
  );
}
