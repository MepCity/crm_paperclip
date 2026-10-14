import type { FieldValue, RecordData } from "../../contract";
import { fixtureAccountId } from "../accounts/seed";
import { callsMetadataSource } from "./metadata";
import { callsPicklists } from "./picklists";

export function fullName(fields: Readonly<Record<string, FieldValue>>): string {
  return typeof fields.Subject === "string" ? fields.Subject : "";
}

const stored = (name: string): string[] =>
  (callsPicklists[name] ?? []).map((option) => option.storedValue);

/** Synthetic topology: direct links only, cycling through every picklist value. */
export function generateFixtureCalls(
  seed = 68,
  now = new Date("2026-01-15T12:00:00.000Z"),
): RecordData[] {
  const pick = (name: string, index: number, step = 1): string => {
    const values = stored(name);
    return values[(Math.floor(index / step) + seed) % values.length] ?? "";
  };
  return Array.from({ length: 250 }, (_, index) => {
    const id = String(130000000000000000n + BigInt(index));
    const targetIndex = Math.floor(index / 8);
    const stamp = new Date(now.getTime() - (index % 45) * 86_400_000).toISOString();
    const start = new Date(now.getTime() + ((index % 17) - 8) * 86_400_000).toISOString();
    const fields: Record<string, FieldValue> = Object.fromEntries(
      callsMetadataSource.fields.map((field) => [field.apiName, null]),
    );
    const type = pick("Call_Type", index);
    const outgoing = type === "Outbound" ? pick("Outgoing_Call_Status", index, 3) : null;
    const seconds =
      type === "Missed" || index % 5 === 0 || (outgoing === "Completed" && index % 2 === 0)
        ? 0
        : 60 * ((index % 12) + 1);
    Object.assign(fields, {
      id,
      Subject: `Call ${String(index + 1).padStart(3, "0")}`,
      Call_Type: type,
      Call_Purpose: pick("Call_Purpose", index, 2),
      Call_Result: pick("Call_Result", index, 3),
      Call_Start_Time: start,
      Call_Duration: `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`,
      Call_Duration_in_seconds: seconds,
      Reminder: pick("Reminder", index, 2),
      Outgoing_Call_Status: outgoing,
      Scheduled_In_CRM: pick("Scheduled_In_CRM", index, 4),
      Description: index % 3 === 0 ? `Synthetic call notes ${index + 1}` : null,
      CTI_Entry: false,
      Created_Time: stamp,
      Modified_Time: stamp,
    });
    const kind = index % 8;
    if ([0, 1, 4, 5, 6].includes(kind)) {
      const contact = kind === 1 || kind === 5;
      fields.Who_Id = {
        module: contact ? "Contacts" : "Leads",
        id: String((contact ? 300000000000000000n : 100000000000000000n) + BigInt(targetIndex)),
      };
    }
    if ([2, 3, 4, 5, 7].includes(kind)) {
      const account = kind === 2 || kind === 4;
      fields.What_Id = {
        module: account ? "Accounts" : "Deals",
        id: account
          ? fixtureAccountId(targetIndex)
          : String(700000000000000000n + BigInt(targetIndex)),
      };
    }
    return { id, fields };
  });
}
