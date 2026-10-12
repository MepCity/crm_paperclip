import type { RecordData, RecordId } from "@crm/core/records";
import { moduleCreatePath } from "@/lib/crm-paths";
import { writeRecordCreatePrefill } from "@/lib/records/record-create-prefill";

export function openContactCreateWithReportingTo(
  orgSlug: string,
  manager: Pick<RecordData, "id" | "fields">,
  navigate: (path: string) => void,
): void {
  const name =
    typeof manager.fields.Full_Name === "string" && manager.fields.Full_Name.length > 0
      ? manager.fields.Full_Name
      : [manager.fields.First_Name, manager.fields.Last_Name]
          .filter((part) => typeof part === "string" && part.length > 0)
          .join(" ");
  writeRecordCreatePrefill(orgSlug, {
    module: "Contacts",
    fields: {
      Reporting_To: { module: "Contacts", id: manager.id, name },
    },
  });
  navigate(moduleCreatePath(orgSlug, "Contacts"));
}

export function reportingToLookupFromManager(
  managerId: RecordId,
  managerFields: RecordData["fields"],
): { module: "Contacts"; id: RecordId; name: string } {
  const name =
    typeof managerFields.Full_Name === "string" && managerFields.Full_Name.length > 0
      ? managerFields.Full_Name
      : [managerFields.First_Name, managerFields.Last_Name]
          .filter((part) => typeof part === "string" && part.length > 0)
          .join(" ");
  return { module: "Contacts", id: managerId, name };
}
