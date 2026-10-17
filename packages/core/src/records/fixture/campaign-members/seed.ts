import type { RecordData } from "../../contract";
import { fixtureCampaignId } from "../campaigns/seed";
import { campaignMemberStatuses } from "./picklists";
export function generateFixtureCampaignMembers(
  now = new Date("2026-01-15T12:00:00.000Z"),
): RecordData[] {
  return campaignMemberStatuses.map((status, index) => {
    const id = String(230000000000000000n + BigInt(index));
    const lead = index % 2 === 0;
    return {
      id,
      fields: {
        id,
        Campaign: { module: "Campaigns", id: fixtureCampaignId(index % 3) },
        Lead: lead ? { module: "Leads", id: String(100000000000000000n + BigInt(index)) } : null,
        Contact: lead
          ? null
          : { module: "Contacts", id: String(300000000000000000n + BigInt(index)) },
        Member_Status: status,
        Created_By: null,
        Modified_By: null,
        Created_Time: now.toISOString(),
        Modified_Time: now.toISOString(),
      },
    };
  });
}
