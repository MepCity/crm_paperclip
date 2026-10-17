import type { FieldValue, RecordData } from "../../contract";
import { fixtureAccountId } from "../accounts/seed";
import { casesMetadata } from "./metadata";
import { casesPicklists } from "./picklists";
export const fixtureCaseId = (index: number) => String(250000000000000000n + BigInt(index));
export const fullName = (fields: Readonly<Record<string, FieldValue>>) =>
  String(fields.Subject ?? "");
export function generateFixtureCases(now: Date): RecordData[] {
  return Array.from({ length: 60 }, (_, index) => {
    const id = fixtureCaseId(index);
    const fields: Record<string, FieldValue> = Object.fromEntries(
      casesMetadata.fields.map((field) => [field.apiName, null]),
    );
    for (const [name, options] of Object.entries(casesPicklists))
      fields[name] = options[index % options.length]?.storedValue ?? null;
    Object.assign(fields, {
      id,
      Subject: `Case ${index + 1}`,
      Created_Time: new Date(now.getTime() - index * 86400000).toISOString(),
      Modified_Time: now.toISOString(),
      Locked__s: index === 1,
      Account_Name: { module: "Accounts", id: fixtureAccountId(index % 10) },
      Related_To: { module: "Contacts", id: String(300000000000000000n + BigInt(index % 10)) },
      Deal_Name: { module: "Deals", id: String(700000000000000000n + BigInt(index % 10)) },
    });
    return { id, fields };
  });
}
