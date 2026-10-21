import type {
  FieldValue,
  ModuleApiName,
  ModuleRecordReference,
  RecordData,
} from "@crm/core/records";
import { moduleCreatePath } from "@/lib/crm-paths";
import { writeRecordCreatePrefill } from "@/lib/records/record-create-prefill";

export type ActivityModule = "Tasks" | "Meetings" | "Calls";

export const ACTIVITY_ADD_NEW_ENTRIES: readonly { module: ActivityModule; label: string }[] = [
  { module: "Tasks", label: "Task" },
  { module: "Meetings", label: "Meeting" },
  { module: "Calls", label: "Call" },
];

function ref(module: ModuleApiName, id: string, name: unknown): ModuleRecordReference {
  return { module, id, ...(typeof name === "string" && name ? { name } : {}) };
}

function accountOf(fields: RecordData["fields"]): ModuleRecordReference | null {
  const value = fields.Account_Name as FieldValue | undefined;
  if (typeof value !== "object" || value === null || !("id" in value)) return null;
  const id = (value as ModuleRecordReference).id;
  if (typeof id !== "string" || id.length === 0) return null;
  return ref("Accounts", id, (value as ModuleRecordReference).name);
}

/**
 * Provisional rule (MEP-950): the reference Add New menu was never invoked. Leads and Contacts
 * fill Who; Accounts and Deals fill What (Related To); a Contact also fills its Account as What.
 */
export function activityPrefillFields(
  parentModule: ModuleApiName,
  parent: Pick<RecordData, "id" | "fields">,
): Record<string, FieldValue> {
  const f = parent.fields;
  switch (parentModule) {
    case "Leads":
      return { Who_Id: ref("Leads", parent.id, f.Full_Name ?? f.Last_Name) };
    case "Contacts": {
      const account = accountOf(f);
      return {
        Who_Id: ref("Contacts", parent.id, f.Full_Name ?? f.Last_Name),
        ...(account ? { What_Id: account } : {}),
      };
    }
    case "Accounts":
      return { What_Id: ref("Accounts", parent.id, f.Account_Name) };
    case "Deals":
      return { What_Id: ref("Deals", parent.id, f.Deal_Name) };
    case "Campaigns":
      return { What_Id: ref("Campaigns", parent.id, f.Campaign_Name) };
    default:
      return {};
  }
}

export function openActivityCreate(
  orgSlug: string,
  activity: ActivityModule,
  parentModule: ModuleApiName,
  parent: Pick<RecordData, "id" | "fields">,
  navigate: (path: string) => void,
  returnTo?: string,
): void {
  writeRecordCreatePrefill(orgSlug, {
    module: activity,
    fields: activityPrefillFields(parentModule, parent),
    ...(returnTo ? { returnTo } : {}),
  });
  navigate(moduleCreatePath(orgSlug, activity));
}
