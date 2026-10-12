import type { FieldValue, RecordData } from "../../contract";
import { fixtureAccountId } from "../accounts/seed";
import { contactsMetadata } from "./metadata";

const DAY_MS = 86_400_000;

export function fullName(fields: Readonly<Record<string, FieldValue>>): string {
  return [fields.Salutation, fields.First_Name, fields.Last_Name]
    .filter((value) => typeof value === "string" && value.length > 0)
    .join(" ");
}

function iso(ms: number | null): string | null {
  return ms === null ? null : new Date(ms).toISOString();
}

function contactTimes(
  index: number,
  now: Date,
): { created: string | null; modified: string | null } {
  const midnight = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const instant = now.getTime();
  if (index === 0) return { created: iso(midnight + 1000), modified: iso(midnight + 1000) };
  if (index === 1) return { created: iso(midnight - 1000), modified: iso(midnight - 1000) };
  if (index === 2)
    return { created: iso(instant - 31 * DAY_MS), modified: iso(instant - 40 * DAY_MS) };
  if (index === 3)
    return { created: iso(instant - 32 * DAY_MS), modified: iso(instant - 32 * DAY_MS) };
  if (index === 4)
    return { created: iso(instant - 40 * DAY_MS), modified: iso(instant - 31 * DAY_MS) };
  if (index === 5) return { created: null, modified: null };
  if (index === 6 || index === 7) return { created: iso(instant), modified: iso(instant) };
  const ageDays = index % 3 === 0 ? 0 : index % 3 === 1 ? 10 : 40;
  const createdMs = instant - ageDays * DAY_MS;
  let modifiedMs = createdMs;
  if (index % 19 === 0) modifiedMs = instant - 2 * DAY_MS;
  return { created: iso(createdMs), modified: iso(modifiedMs) };
}

/** Deterministic synthetic Contacts records for fixture pagination and filters. */
export function generateFixtureContacts(
  seed = 68,
  now = new Date("2026-01-15T12:00:00.000Z"),
): RecordData[] {
  let state = seed >>> 0;
  const random = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state;
  };
  const sources = [
    ...(contactsMetadata.fields.find((field) => field.apiName === "Lead_Source")?.picklist ?? [])
      .map((option) => option.storedValue)
      .filter((value) => value !== "-None-"),
    null,
  ];
  const records = Array.from({ length: 250 }, (_, index) => {
    const suffix = String(index + 1).padStart(3, "0");
    const id = String(300000000000000000n + BigInt(index));
    const boundary = index <= 7;
    const locked = index === 6 || (!boundary && index % 13 === 0);
    const emailOptOut = index === 7 || (!boundary && index % 11 === 0);
    const times = contactTimes(index, now);
    const fields: Record<string, FieldValue> = Object.fromEntries(
      contactsMetadata.fields.map((field) => [field.apiName, null]),
    );
    Object.assign(fields, {
      id,
      Last_Name: `Contact ${suffix}`,
      First_Name: random() % 3 === 0 ? null : `Sample ${suffix}`,
      Email: `contact-${suffix}@example.org`,
      Phone: `100-${suffix}`,
      Mobile: `200-${suffix}`,
      Department: index % 5 === 0 ? "Operations" : null,
      Lead_Source: sources[random() % sources.length],
      Date_of_Birth: index % 7 === 0 ? "1990-06-15" : null,
      Account_Name:
        index % 4 === 0
          ? {
              module: "Accounts",
              id: fixtureAccountId(Math.floor(index / 8)),
              name: `Account ${String(Math.floor(index / 8) + 1).padStart(3, "0")}`,
            }
          : null,
      Vendor_Name:
        index % 9 === 0
          ? { module: "Vendors", id: `vendor-${suffix}`, name: `Vendor ${suffix}` }
          : null,
      Locked__s: locked,
      Email_Opt_Out: emailOptOut,
      Created_Time: times.created,
      Modified_Time: times.modified,
    });
    fields.Full_Name = fullName(fields);
    return { id, fields };
  });
  for (let index = 1; index < records.length; index += 17) {
    const manager = records[index - 1];
    const report = records[index];
    if (!manager || !report) continue;
    report.fields.Reporting_To = { module: "Contacts", id: manager.id };
  }
  return records;
}
