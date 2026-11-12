import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import type { Transaction } from "../tenancy/types";
import { matchAttribution } from "./matching";
import {
  createAdGroupSchema,
  createAdItemSchema,
  createAdKeywordSchema,
  createCampaignSchema,
  recordAttributionInputSchema,
} from "./types";

describe("Ads core Zod schemas", () => {
  it("validates createCampaignSchema", () => {
    const valid = createCampaignSchema.parse({ name: "  Summer Promo  " });
    expect(valid).toEqual({ name: "Summer Promo", status: "active" });

    expect(() => createCampaignSchema.parse({ name: "" })).toThrow();
    expect(() => createCampaignSchema.parse({ name: "a".repeat(256) })).toThrow();
  });

  it("validates createAdGroupSchema", () => {
    const campaignId = "00000000-0000-7000-8000-000000000001";
    const valid = createAdGroupSchema.parse({ campaignId, name: "Search Group" });
    expect(valid).toEqual({ campaignId, name: "Search Group", status: "active" });

    expect(() => createAdGroupSchema.parse({ campaignId: "invalid", name: "G" })).toThrow();
  });

  it("validates createAdKeywordSchema", () => {
    const campaignId = "00000000-0000-7000-8000-000000000001";
    const adGroupId = "00000000-0000-7000-8000-000000000002";
    const valid = createAdKeywordSchema.parse({
      campaignId,
      adGroupId,
      name: "best crm software",
    });
    expect(valid).toEqual({
      campaignId,
      adGroupId,
      name: "best crm software",
      matchType: "broad",
      status: "active",
    });

    const exact = createAdKeywordSchema.parse({
      campaignId,
      adGroupId,
      name: "[crm]",
      matchType: "exact",
      status: "paused",
    });
    expect(exact.matchType).toBe("exact");
    expect(exact.status).toBe("paused");
  });

  it("validates createAdItemSchema", () => {
    const campaignId = "00000000-0000-7000-8000-000000000001";
    const adGroupId = "00000000-0000-7000-8000-000000000002";
    const valid = createAdItemSchema.parse({
      campaignId,
      adGroupId,
      name: "Responsive Search Ad 1",
    });
    expect(valid).toEqual({
      campaignId,
      adGroupId,
      name: "Responsive Search Ad 1",
      status: "active",
    });
  });

  it("validates recordAttributionInputSchema", () => {
    const valid = recordAttributionInputSchema.parse({
      recordModule: "Leads",
      recordId: "lead-123",
      gclid: "test-gclid-123",
      utmCampaign: "Spring Sale",
      utmTerm: "crm tool",
    });
    expect(valid.source).toBe("webform");
    expect(valid.recordModule).toBe("Leads");

    // Rejects over-length values (> 255)
    expect(() =>
      recordAttributionInputSchema.parse({
        recordModule: "Leads",
        recordId: "lead-123",
        utmCampaign: "a".repeat(256),
      }),
    ).toThrow();
  });
});

describe("Ads matching logic", () => {
  it("matches utm_campaign case-insensitively", async () => {
    const orgId = "00000000-0000-7000-8000-000000000001";
    const mockTx = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([{ id: "campaign-1" }]),
          }),
        }),
      }),
    } as unknown as Transaction;

    const match = await matchAttribution(mockTx, orgId, {
      utmCampaign: "summer_campaign",
    });
    expect(match.campaignId).toBe("campaign-1");
    expect(match.adGroupId).toBeNull();
    expect(match.keywordId).toBeNull();
  });

  it("matches utm_term to keyword and resolves campaign/group", async () => {
    const orgId = "00000000-0000-7000-8000-000000000001";
    let callCount = 0;
    const mockTx = {
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockImplementation(() => {
              callCount++;
              if (callCount === 1) {
                // campaign query returns not found
                return Promise.resolve([]);
              }
              // keyword query returns match
              return Promise.resolve([{ id: "kw-1", campaignId: "camp-kw", adGroupId: "grp-kw" }]);
            }),
          }),
        }),
      }),
    } as unknown as Transaction;

    const match = await matchAttribution(mockTx, orgId, {
      utmCampaign: "unknown_campaign",
      utmTerm: "CRM Software",
    });
    expect(match.campaignId).toBe("camp-kw");
    expect(match.adGroupId).toBe("grp-kw");
    expect(match.keywordId).toBe("kw-1");
  });
});

describe("Ads local boundary (grep test)", () => {
  it("makes no network calls (no fetch/http import in packages/core/src/ads/)", () => {
    const adsDir = __dirname;
    const files = readdirSync(adsDir).filter((f) => f.endsWith(".ts") && !f.endsWith(".test.ts"));
    expect(files.length).toBeGreaterThan(0);

    const forbiddenPatterns = [
      /\bfetch\s*\(/,
      /from\s+["']node:http["']/,
      /from\s+["']http["']/,
      /from\s+["']node:https["']/,
      /from\s+["']https["']/,
      /from\s+["']node:net["']/,
      /from\s+["']net["']/,
      /from\s+["']undici["']/,
      /from\s+["']axios["']/,
    ];

    for (const file of files) {
      const content = readFileSync(join(adsDir, file), "utf-8");
      for (const pattern of forbiddenPatterns) {
        expect(
          pattern.test(content),
          `File ${file} must not match forbidden network pattern ${pattern}`,
        ).toBe(false);
      }
    }
  });
});
