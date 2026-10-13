import type { FieldValue, RecordData } from "../../contract";
import { fixtureAccountId } from "../accounts/seed";
import { tasksMetadataSource } from "./metadata";
import { tasksPicklists } from "./picklists";

export function fullName(fields: Readonly<Record<string, FieldValue>>): string {
  return typeof fields.Subject === "string" ? fields.Subject : "";
}

/** Prepared seed; module registration awaits approved lookup target metadata. */
export function generateFixtureTasks(
  seed = 68,
  now = new Date("2026-01-15T12:00:00.000Z"),
): RecordData[] {
  const statuses = tasksPicklists.Status ?? [];
  const priorities = tasksPicklists.Priority ?? [];
  return Array.from({ length: 250 }, (_, index) => {
    const id = String(110000000000000000n + BigInt(index));
    const targetIndex = Math.floor(index / 8);
    const stamp = new Date(now.getTime() - (index % 45) * 86_400_000).toISOString();
    const fields: Record<string, FieldValue> = Object.fromEntries(
      tasksMetadataSource.fields.map((field) => [field.apiName, null]),
    );
    const status = statuses[(index + seed) % statuses.length]?.storedValue;
    Object.assign(fields, {
      id,
      Subject: `Task ${String(index + 1).padStart(3, "0")}`,
      Due_Date: new Date(now.getTime() + ((index % 17) - 8) * 86_400_000)
        .toISOString()
        .slice(0, 10),
      Status: status ?? "Not Started",
      Priority:
        priorities[(Math.floor(index / 5) + seed) % priorities.length]?.storedValue ?? "Normal",
      Send_Notification_Email: false,
      Locked__s: index > 10 && index % 13 === 0,
      Created_Time: stamp,
      Modified_Time: stamp,
      Closed_Time: status === "Completed" ? stamp : null,
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
