import { ValidationError } from "../errors";
import type { CampaignFilterValue } from "./contract";
// Interim until membership research confirms the values. No default status.
export const campaignMemberStatuses = [
  "Planned",
  "Invited",
  "Sent",
  "Received",
  "Opened",
  "Responded",
  "Bounced",
  "Opted Out",
] as const;

export function validateCampaignFilter(value: unknown): asserts value is CampaignFilterValue {
  const fail = (): never => {
    throw new ValidationError({ campaignFilter: ["Choose a valid campaign filter."] });
  };
  if (!value || typeof value !== "object" || Array.isArray(value)) fail();
  const filter = value as Record<string, unknown>;
  if (Object.keys(filter).some((key) => !["campaignIds", "memberStatuses"].includes(key))) fail();
  if (
    !Array.isArray(filter.campaignIds) ||
    filter.campaignIds.length < 1 ||
    filter.campaignIds.length > 5 ||
    filter.campaignIds.some((id) => typeof id !== "string" || !id.trim()) ||
    new Set(filter.campaignIds).size !== filter.campaignIds.length
  )
    fail();
  if (
    filter.memberStatuses !== undefined &&
    (!Array.isArray(filter.memberStatuses) ||
      !filter.memberStatuses.length ||
      filter.memberStatuses.some((status) => !campaignMemberStatuses.includes(status)))
  )
    fail();
}
