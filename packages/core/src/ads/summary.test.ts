import { describe, expect, it } from "vitest";
import { aggregateAdsSummary } from "./summary";

const names = {
  campaigns: new Map([
    ["c1", "Beta"],
    ["c2", "alpha"],
  ]),
  groups: new Map([
    ["g1", "Brand"],
    ["g2", "Generic"],
  ]),
  keywords: new Map([["k1", "crm"]]),
};
const row = (
  recordModule: string,
  recordId: string,
  campaignId: string | null,
  adGroupId: string | null = null,
  keywordId: string | null = null,
) => ({ recordModule, recordId, campaignId, adGroupId, keywordId });

describe("aggregateAdsSummary", () => {
  it("counts leads, contacts and deals per campaign → group → keyword and sums deal amounts", () => {
    const summary = aggregateAdsSummary(
      [
        row("Leads", "l1", "c1", "g1", "k1"),
        row("Leads", "l2", "c1", "g1", "k1"),
        row("Contacts", "ct1", "c1", "g1", "k1"),
        row("Deals", "d1", "c1", "g1", "k1"),
        row("Deals", "d2", "c1", "g2"),
        row("Leads", "l3", "c2"),
        row("Leads", "l4", null),
      ],
      names,
      new Map([
        ["d1", 1000.5],
        ["d2", 250],
      ]),
    );
    expect(summary.rows).toEqual([
      expect.objectContaining({ campaignName: "alpha", adGroupName: null, leads: 1 }),
      expect.objectContaining({
        campaignName: "Beta",
        adGroupName: "Brand",
        keywordName: "crm",
        leads: 2,
        contacts: 1,
        deals: 1,
        dealAmount: 1000.5,
      }),
      expect.objectContaining({
        adGroupName: "Generic",
        keywordName: null,
        deals: 1,
        dealAmount: 250,
      }),
      expect.objectContaining({ campaignName: null, leads: 1 }),
    ]);
    expect(summary.totals).toEqual({ leads: 4, contacts: 1, deals: 2, dealAmount: 1250.5 });
  });

  it("counts a record once, ignores other modules and treats unknown names as no campaign", () => {
    const summary = aggregateAdsSummary(
      [
        row("Leads", "l1", "c1"),
        row("Leads", "l1", "c2"),
        row("Accounts", "a1", "c1"),
        row("Deals", "d1", "deleted-campaign", "deleted-group"),
      ],
      names,
    );
    expect(summary.totals).toEqual({ leads: 1, contacts: 0, deals: 1, dealAmount: 0 });
    expect(summary.rows.map((r) => [r.campaignId, r.adGroupId])).toEqual([
      ["c1", null],
      [null, null],
    ]);
  });

  it("returns no rows for no attributions", () => {
    expect(aggregateAdsSummary([], names)).toEqual({
      rows: [],
      totals: { leads: 0, contacts: 0, deals: 0, dealAmount: 0 },
    });
  });
});
