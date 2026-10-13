import type { FieldValue, ModuleRecordReference, RecordData, RecordId } from "@crm/core/records";
import { moduleCreatePath } from "@/lib/crm-paths";
import { writeRecordCreatePrefill } from "@/lib/records/record-create-prefill";

function contactDisplayName(fields: RecordData["fields"]): string {
  return (
    (typeof fields.Full_Name === "string" && fields.Full_Name.length > 0
      ? fields.Full_Name
      : [fields.First_Name, fields.Last_Name]
          .filter((part) => typeof part === "string" && part.length > 0)
          .join(" ")) || ""
  );
}

function accountLookupOfContact(fields: RecordData["fields"]): ModuleRecordReference | null {
  const value = fields.Account_Name as FieldValue | undefined;
  if (typeof value !== "object" || value === null || !("id" in value)) return null;
  const ref = value as ModuleRecordReference;
  if (typeof ref.id !== "string" || ref.id.length === 0) return null;
  return { module: "Accounts", id: ref.id, ...(ref.name ? { name: ref.name } : {}) };
}

export function openContactCreateWithReportingTo(
  orgSlug: string,
  manager: Pick<RecordData, "id" | "fields">,
  navigate: (path: string) => void,
): void {
  writeRecordCreatePrefill(orgSlug, {
    module: "Contacts",
    fields: {
      Reporting_To: {
        module: "Contacts",
        id: manager.id,
        name: contactDisplayName(manager.fields),
      },
    },
  });
  navigate(moduleCreatePath(orgSlug, "Contacts"));
}

/** AD-114 / D-56: New Deal from the Contacts card opens the create form with the person filled. */
export function openDealCreateWithContact(
  orgSlug: string,
  contact: Pick<RecordData, "id" | "fields">,
  navigate: (path: string) => void,
): void {
  const account = accountLookupOfContact(contact.fields);
  writeRecordCreatePrefill(orgSlug, {
    module: "Deals",
    fields: {
      Contact_Name: {
        module: "Contacts",
        id: contact.id,
        name: contactDisplayName(contact.fields),
      },
      ...(account ? { Account_Name: account } : {}),
    },
  });
  navigate(moduleCreatePath(orgSlug, "Deals"));
}

export function reportingToLookupFromManager(
  managerId: RecordId,
  managerFields: RecordData["fields"],
): { module: "Contacts"; id: RecordId; name: string } {
  return { module: "Contacts", id: managerId, name: contactDisplayName(managerFields) };
}
