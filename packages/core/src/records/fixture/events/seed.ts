import type { FieldValue, RecordData } from "../../contract";
import { fixtureAccountId } from "../accounts/seed";
import { eventsMetadataSource } from "./metadata";
import { eventsPicklists } from "./picklists";

export function fullName(fields: Readonly<Record<string, FieldValue>>): string {
  return typeof fields.Event_Title === "string" ? fields.Event_Title : "";
}

/** Synthetic topology: direct links only, all-day/timed and past/future meetings. */
export function generateFixtureEvents(
  seed = 68,
  now = new Date("2026-01-15T12:00:00.000Z"),
): RecordData[] {
  const venues = eventsPicklists.Meeting_Venue__s ?? [];
  return Array.from({ length: 250 }, (_, index) => {
    const id = String(130000000000000000n + BigInt(index));
    const targetIndex = Math.floor(index / 8);
    const stamp = new Date(now.getTime() - (index % 45) * 86_400_000).toISOString();
    const fields: Record<string, FieldValue> = Object.fromEntries(
      eventsMetadataSource.fields.map((field) => [field.apiName, null]),
    );
    const start = new Date(now.getTime() + ((index % 17) - 8) * 86_400_000);
    const allDay = index % 4 === 0;
    if (allDay) start.setUTCHours(0, 0, 0, 0);
    Object.assign(fields, {
      id,
      Event_Title: `Meeting ${String(index + 1).padStart(3, "0")}`,
      Start_DateTime: start.toISOString(),
      End_DateTime: new Date(start.getTime() + (allDay ? 86_400_000 : 3_600_000)).toISOString(),
      All_day: allDay,
      Meeting_Venue__s: venues[(index + seed) % venues.length]?.storedValue ?? "In-office",
      Created_Time: stamp,
      Modified_Time: stamp,
      // Synthetic opaque examples only; these keys propose no participant/reminder schema.
      Participants: index % 2 ? [] : [{ example: [index, null, true] }],
      Remind_At: index % 3 ? [] : [{ example: "synthetic" }],
      Remind_Participants: index % 5 ? [] : [null, { example: false }],
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
