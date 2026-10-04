import type { FieldValue, RecordData } from "../contract";
import { leadsMetadata } from "./metadata";
import { OPEN_STATUS_VALUES } from "./views";

export function fullName(fields: Readonly<Record<string, FieldValue>>): string {
  return fields.First_Name ? `${fields.First_Name} ${fields.Last_Name}` : String(fields.Last_Name);
}

/** Deterministic synthetic domain records, independent of organization/account data. */
export function generateFixtureLeads(seed = 68): RecordData[] {
  let state = seed >>> 0;
  const random = () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state;
  };
  const statuses = [...OPEN_STATUS_VALUES, "Junk Lead", "Not Qualified", null];
  const sources = [
    ...(leadsMetadata.fields.find((field) => field.apiName === "Lead_Source")?.picklist ?? [])
      .map((option) => option.storedValue)
      .filter((value) => value !== "-None-"),
    null,
  ];
  return Array.from({ length: 250 }, (_, index) => {
    const suffix = String(index + 1).padStart(3, "0");
    const id = String(100000000000000000n + BigInt(index));
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
      Lead_Status: statuses[random() % statuses.length],
      Lead_Source: sources[random() % sources.length],
      Created_Time: new Date(Date.UTC(2026, 0, 1, 0, index)).toISOString(),
      Modified_Time: new Date(Date.UTC(2026, 0, 1, 0, index)).toISOString(),
    });
    fields.Full_Name = fullName(fields);
    return { id, fields };
  });
}
