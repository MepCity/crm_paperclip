import type { FieldValue, RecordData } from "../../contract";
import { generateFixtureAccounts } from "../accounts/seed";
import { generateFixtureContacts } from "../contacts/seed";
import { generateFixtureDeals } from "../deals/seed";
import { generateFixtureLeads } from "../seed";
import { notesMetadata, notesParentModules } from "./metadata";

const parentGenerators = {
  Leads: generateFixtureLeads,
  Contacts: generateFixtureContacts,
  Accounts: generateFixtureAccounts,
  Deals: generateFixtureDeals,
};

/** Synthetic notes bound to the first generated record of each confirmed parent. */
export function generateFixtureNotes(
  seed = 68,
  now = new Date("2026-01-15T12:00:00.000Z"),
): RecordData[] {
  return notesParentModules.map((module, index) => {
    const parent = parentGenerators[module](seed, now)[0];
    if (!parent) throw new Error(`Missing fixture parent for ${module}.`);
    const id = String(190000000000000000n + BigInt(index));
    const fields: Record<string, FieldValue> = Object.fromEntries(
      notesMetadata.fields.map((field) => [field.apiName, null]),
    );
    Object.assign(fields, {
      id,
      Note_Title: index === 0 ? null : `Note ${index + 1}`,
      Note_Content: `General follow-up information ${index + 1}.`,
      Parent_Id: { module, id: parent.id },
      Created_Time: now.toISOString(),
      Modified_Time: now.toISOString(),
    });
    return { id, fields };
  });
}
