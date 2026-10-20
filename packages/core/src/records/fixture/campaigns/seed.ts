import type { FieldValue, RecordData } from "../../contract";
import { campaignsMetadata } from "./metadata";
import { campaignsPicklists } from "./picklists";

export const fixtureCampaignId = (index: number) => String(210000000000000000n + BigInt(index));
export const fullName = (fields: Readonly<Record<string, FieldValue>>) =>
  String(fields.Campaign_Name ?? "");
export function generateFixtureCampaigns(
  seed = 68,
  now = new Date("2026-01-15T12:00:00.000Z"),
): RecordData[] {
  return Array.from({ length: 250 }, (_, index) => {
    const id = fixtureCampaignId(index);
    const start = new Date(now.getTime() + ((index % 17) - 8) * 86400000);
    const fields: Record<string, FieldValue> = Object.fromEntries(
      campaignsMetadata.fields.map((field) => [field.apiName, null]),
    );
    Object.assign(fields, {
      id,
      Locked__s: index === 125,
      Campaign_Name: `Campaign ${String(index + 1).padStart(3, "0")}`,
      Type: campaignsPicklists.Type?.[(index + seed) % 13]?.storedValue ?? null,
      Status: campaignsPicklists.Status?.[index % 5]?.storedValue ?? null,
      Start_Date: start.toISOString().slice(0, 10),
      End_Date: new Date(start.getTime() + 2 * 86400000).toISOString().slice(0, 10),
      Created_Time: now.toISOString(),
      Modified_Time: now.toISOString(),
      Parent_Campaign:
        index > 0 && index < 3 ? { module: "Campaigns", id: fixtureCampaignId(index - 1) } : null,
    });
    return { id, fields };
  });
}
