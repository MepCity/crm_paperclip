import { ValidationError } from "@crm/core/errors";
import { describe, expect, it } from "vitest";
import { decodeCampaignFilter, encodeCampaignFilter } from "./codec";

describe("campaign filter wire codec", () => {
  it.each([
    { campaignIds: ["one"] },
    { campaignIds: ["one", "two"], memberStatuses: ["Opened", "Sent"] },
  ])("round trips %j with snake case keys", (filter) => {
    const wire = encodeCampaignFilter(filter);
    expect(wire).toEqual({
      campaign_ids: filter.campaignIds,
      ...(filter.memberStatuses ? { member_statuses: filter.memberStatuses } : {}),
    });
    expect(decodeCampaignFilter(wire)).toEqual(filter);
  });
  it.each([
    null,
    [],
    {},
    { campaign_ids: "one" },
    { campaign_ids: [] },
    { campaign_ids: ["one"], member_statuses: null },
    { campaign_ids: ["one"], member_statuses: ["unknown"] },
    { campaign_ids: ["one"], extra: true },
    { campaignIds: ["one"] },
  ])("rejects malformed body %j", (wire) => {
    expect(() => decodeCampaignFilter(wire)).toThrow(ValidationError);
  });
});
