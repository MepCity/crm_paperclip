import type { FieldValue, RecordData } from "../../contract";
import { contactRoleNames } from "./picklists";

const idBase = 900000000000000000n;

function accountOf(record: RecordData, key: string): string | null {
  const value = record.fields[key];
  return typeof value === "object" &&
    value !== null &&
    "id" in value &&
    typeof value.id === "string"
    ? value.id
    : null;
}

/** Deterministic rows: the first deals get one or two contacts of their own account. */
export function generateFixtureContactRoles(
  deals: readonly RecordData[],
  contacts: readonly RecordData[],
  now = new Date("2026-01-15T12:00:00.000Z"),
): RecordData[] {
  const rows: RecordData[] = [];
  const stamp = now.toISOString();
  for (const deal of deals.slice(0, 6)) {
    const account = accountOf(deal, "Account_Name");
    if (!account) continue;
    const people = contacts.filter((c) => accountOf(c, "Account_Name") === account).slice(0, 2);
    people.forEach((contact, position) => {
      const id = String(idBase + BigInt(rows.length));
      const role: FieldValue =
        (rows.length + position) % 3 === 2
          ? null
          : (contactRoleNames[rows.length % contactRoleNames.length] ?? null);
      rows.push({
        id,
        fields: {
          id,
          Deal: { module: "Deals", id: deal.id },
          Contact: { module: "Contacts", id: contact.id },
          Contact_Role: role,
          Created_By: null,
          Modified_By: null,
          Created_Time: stamp,
          Modified_Time: stamp,
        },
      });
    });
  }
  return rows;
}
