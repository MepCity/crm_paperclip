import type { FieldValue, RecordData } from "../contract";
import { leadsMetadata } from "./metadata";

const DAY_MS = 86_400_000;
const STATUS_CYCLE: readonly (string | null)[] = [
  "Attempted to Contact",
  "Contact in Future",
  "Contacted",
  "Lost Lead",
  "Not Contacted",
  "Pre-Qualified",
  "Junk Lead",
  "Not Qualified",
  null,
];

export function fullName(fields: Readonly<Record<string, FieldValue>>): string {
  return fields.First_Name ? `${fields.First_Name} ${fields.Last_Name}` : String(fields.Last_Name);
}

function iso(ms: number | null): string | null {
  return ms === null ? null : new Date(ms).toISOString();
}

/**
 * Times are relative to `now`. Indexes 0–7 are fixed boundaries:
 * 0 today just after UTC midnight, 1 just before it, 2 age 31 days,
 * 3 age 32 days, 4 modified age 31 / created age 40, 5 null timestamps,
 * 6 locked today, 7 email opt-out today.
 */
function leadTimes(index: number, now: Date): { created: string | null; modified: string | null } {
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
  let createdMs = instant - ageDays * DAY_MS;
  let modifiedMs = createdMs;
  if (index % 19 === 0) modifiedMs = instant - 2 * DAY_MS;
  if (index % 19 === 1) {
    createdMs = instant - 2 * DAY_MS;
    modifiedMs = instant - 40 * DAY_MS;
  }
  return { created: iso(createdMs), modified: iso(modifiedMs) };
}

/** Deterministic synthetic domain records. `now` is the clock; the same pair always yields the same rows. */
export function generateFixtureLeads(
  seed = 68,
  now = new Date("2026-01-15T12:00:00.000Z"),
): RecordData[] {
  let state = seed >>> 0;
  const random = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state;
  };
  const sources = [
    ...(leadsMetadata.fields.find((field) => field.apiName === "Lead_Source")?.picklist ?? [])
      .map((option) => option.storedValue)
      .filter((value) => value !== "-None-"),
    null,
  ];
  return Array.from({ length: 250 }, (_, index) => {
    const suffix = String(index + 1).padStart(3, "0");
    const id = String(100000000000000000n + BigInt(index));
    const boundary = index <= 7;
    const converted = !boundary && index % 17 === 0;
    const locked = !converted && (index === 6 || (!boundary && index % 13 === 0));
    const emailOptOut = !converted && (index === 7 || (!boundary && index % 11 === 0));
    const times = leadTimes(index, now);
    const fields: Record<string, FieldValue> = Object.fromEntries(
      leadsMetadata.fields.map((field) => [field.apiName, null]),
    );
    Object.assign(fields, {
      id,
      Last_Name: `Lead ${suffix}`,
      First_Name: random() % 3 === 0 ? null : `Sample ${suffix}`,
      Company: `Example Company ${suffix}`,
      Email: `lead-${suffix}@example.org`,
      Phone: `000-${suffix}`,
      No_of_Employees: random() % 1000,
      Annual_Revenue: (random() % 10000000) / 100,
      Lead_Status: STATUS_CYCLE[index % STATUS_CYCLE.length],
      Lead_Source: sources[random() % sources.length],
      Converted__s: converted,
      Locked__s: locked,
      Email_Opt_Out: emailOptOut,
      Created_Time: times.created,
      Modified_Time: times.modified,
    });
    fields.Full_Name = fullName(fields);
    return { id, fields };
  });
}
