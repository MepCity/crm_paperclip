import type { RecordData, RecordId } from "@crm/core/records";
import { moduleCreatePath } from "@/lib/crm-paths";
import { writeRecordCreatePrefill } from "@/lib/records/record-create-prefill";

function accountDisplayName(fields: RecordData["fields"]): string {
  const val = fields.Account_Name;
  if (typeof val === "string") return val;
  if (
    typeof val === "object" &&
    val !== null &&
    "name" in val &&
    typeof (val as { name?: unknown }).name === "string"
  ) {
    return (val as { name: string }).name;
  }
  return "";
}

export function accountNameLookupFromRecord(
  accountId: RecordId,
  fields: RecordData["fields"],
): { module: "Accounts"; id: RecordId; name: string } {
  return { module: "Accounts", id: accountId, name: accountDisplayName(fields) };
}

export function openContactCreateWithAccountName(
  orgSlug: string,
  account: Pick<RecordData, "id" | "fields">,
  navigate: (path: string) => void,
): void {
  writeRecordCreatePrefill(orgSlug, {
    module: "Contacts",
    fields: {
      Account_Name: accountNameLookupFromRecord(account.id, account.fields),
    },
  });
  navigate(moduleCreatePath(orgSlug, "Contacts"));
}

export function openAccountCreateWithParentAccount(
  orgSlug: string,
  parent: Pick<RecordData, "id" | "fields">,
  navigate: (path: string) => void,
): void {
  writeRecordCreatePrefill(orgSlug, {
    module: "Accounts",
    fields: {
      Parent_Account: accountNameLookupFromRecord(parent.id, parent.fields),
    },
  });
  navigate(moduleCreatePath(orgSlug, "Accounts"));
}

export function openDealCreateWithAccountName(
  orgSlug: string,
  account: Pick<RecordData, "id" | "fields">,
  navigate: (path: string) => void,
): void {
  writeRecordCreatePrefill(orgSlug, {
    module: "Deals",
    fields: {
      Account_Name: accountNameLookupFromRecord(account.id, account.fields),
    },
  });
  navigate(moduleCreatePath(orgSlug, "Deals"));
}

/** Provisional rule (MEP-900): New Case from the Accounts card fills Account Name. */
export function openCaseCreateWithAccountName(
  orgSlug: string,
  account: Pick<RecordData, "id" | "fields">,
  navigate: (path: string) => void,
): void {
  writeRecordCreatePrefill(orgSlug, {
    module: "Cases",
    fields: {
      Account_Name: accountNameLookupFromRecord(account.id, account.fields),
    },
  });
  navigate(moduleCreatePath(orgSlug, "Cases"));
}
