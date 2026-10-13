import type { RecordData, RecordId } from "@crm/core/records";
import { moduleCreatePath } from "@/lib/crm-paths";
import { writeRecordCreatePrefill } from "@/lib/records/record-create-prefill";

function accountDisplayName(fields: RecordData["fields"]): string {
  return typeof fields.Account_Name === "string" ? fields.Account_Name : "";
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
