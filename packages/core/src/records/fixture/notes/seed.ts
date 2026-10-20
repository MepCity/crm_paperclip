import type { FieldValue, RecordData } from "../../contract";
import { generateFixtureAccounts } from "../accounts/seed";
import { generateFixtureCalls } from "../calls/seed";
import { generateFixtureCampaigns } from "../campaigns/seed";
import { generateFixtureCases } from "../cases/seed";
import { generateFixtureContacts } from "../contacts/seed";
import { generateFixtureDeals } from "../deals/seed";
import { generateFixtureEvents } from "../events/seed";
import { generateFixtureLeads } from "../seed";
import { generateFixtureSolutions } from "../solutions/seed";
import { generateFixtureTasks } from "../tasks/seed";
import { notesMetadata, notesParentModules } from "./metadata";

const seedParentModules = notesParentModules;

const parentGenerators = {
  Leads: generateFixtureLeads,
  Contacts: generateFixtureContacts,
  Accounts: generateFixtureAccounts,
  Deals: generateFixtureDeals,
  Campaigns: generateFixtureCampaigns,
  Cases: (_seed: number, now: Date) => generateFixtureCases(now),
  Solutions: (_seed: number, now: Date) => generateFixtureSolutions(now),
  Tasks: generateFixtureTasks,
  Events: generateFixtureEvents,
  Calls: generateFixtureCalls,
};

/** Synthetic notes bound to the first generated record of each confirmed parent. */
export function generateFixtureNotes(
  seed = 68,
  now = new Date("2026-01-15T12:00:00.000Z"),
): RecordData[] {
  return seedParentModules.flatMap((module, index) => {
    const parent = parentGenerators[module](seed, now)[0];
    if (!parent) throw new Error(`Missing fixture parent for ${module}.`);
    const id = String(180000000000000000n + BigInt(index));
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
    const first = { id, fields };
    if (index < 4) return [first];
    const extraId = String(180000000000000000n + BigInt(seedParentModules.length + index));
    return [
      first,
      {
        id: extraId,
        fields: { ...fields, id: extraId, Note_Title: `Follow-up note ${index + 1}` },
      },
    ];
  });
}
