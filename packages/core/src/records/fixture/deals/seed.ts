import type { FieldValue, RecordData } from "../../contract";
import { fixtureAccountId } from "../accounts/seed";
import { dealsMetadata } from "./metadata";
import { dealsPicklists } from "./picklists";

export function fullName(fields: Readonly<Record<string, FieldValue>>): string {
  return typeof fields.Deal_Name === "string" ? fields.Deal_Name : "";
}

/** Synthetic deals cover every stage and leave the final account without deals. */
export function generateFixtureDeals(
  seed = 68,
  now = new Date("2026-01-15T12:00:00.000Z"),
): RecordData[] {
  const stages = dealsPicklists.Stage ?? [];
  return Array.from({ length: 250 }, (_, index) => {
    const id = String(700000000000000000n + BigInt(index));
    const stamp = new Date(now.getTime() - (index % 45) * 86_400_000).toISOString();
    const stage = stages[index % stages.length];
    const fields: Record<string, FieldValue> = Object.fromEntries(
      dealsMetadata.fields.map((field) => [field.apiName, null]),
    );
    Object.assign(fields, {
      id,
      Deal_Name: `Deal ${String(index + 1).padStart(3, "0")}`,
      Stage: stage?.storedValue ?? "Qualification",
      Probability: stage?.stage?.probability ?? 10,
      Amount: (((index + seed) % 1000) + 1) * 100,
      Closing_Date: new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + (index % 3) - 1, (index % 28) + 1),
      )
        .toISOString()
        .slice(0, 10),
      Account_Name: { module: "Accounts", id: fixtureAccountId(index % 125) },
      Contact_Name: { module: "Contacts", id: String(300000000000000000n + BigInt(index % 125)) },
      Locked__s: index > 10 && index % 13 === 0,
      Created_Time: stamp,
      Modified_Time: stamp,
    });
    return { id, fields };
  });
}
