/** Pure aggregation for the ads summary report (ADR 0019 §7, spec §5 A2). */

export interface SummaryAttributionRow {
  recordModule: string;
  recordId: string;
  campaignId: string | null;
  adGroupId: string | null;
  keywordId: string | null;
}

export interface SummaryNames {
  campaigns: ReadonlyMap<string, string>;
  groups: ReadonlyMap<string, string>;
  keywords: ReadonlyMap<string, string>;
}

export interface AdsSummaryRow {
  campaignId: string | null;
  campaignName: string | null;
  adGroupId: string | null;
  adGroupName: string | null;
  keywordId: string | null;
  keywordName: string | null;
  leads: number;
  contacts: number;
  deals: number;
  dealAmount: number;
}

export interface AdsSummary {
  rows: AdsSummaryRow[];
  totals: { leads: number; contacts: number; deals: number; dealAmount: number };
}

const nameOrNull = (map: ReadonlyMap<string, string>, id: string | null) =>
  id ? (map.get(id) ?? null) : null;

/** Unnamed buckets ("no campaign") sort after named ones; names compare case-insensitively. */
function compareNames(a: string | null, b: string | null): number {
  if (a === b) return 0;
  if (a === null) return 1;
  if (b === null) return -1;
  return a.localeCompare(b, undefined, { sensitivity: "base" });
}

/**
 * Counts each record once (callers pass one attribution per record) per
 * campaign → group → keyword bucket. Deal amount sums the `dealAmounts` of the
 * counted deals; a deal without an amount counts with 0.
 */
export function aggregateAdsSummary(
  attributions: readonly SummaryAttributionRow[],
  names: SummaryNames,
  dealAmounts: ReadonlyMap<string, number> = new Map(),
): AdsSummary {
  const buckets = new Map<string, AdsSummaryRow>();
  const seen = new Set<string>();
  const totals = { leads: 0, contacts: 0, deals: 0, dealAmount: 0 };

  for (const row of attributions) {
    const recordKey = `${row.recordModule}:${row.recordId}`;
    if (seen.has(recordKey)) continue;
    if (
      row.recordModule !== "Leads" &&
      row.recordModule !== "Contacts" &&
      row.recordModule !== "Deals"
    )
      continue;
    seen.add(recordKey);
    // Names that no longer resolve (deleted on the settings page) fall back to "none".
    const campaignName = nameOrNull(names.campaigns, row.campaignId);
    const adGroupName = nameOrNull(names.groups, row.adGroupId);
    const keywordName = nameOrNull(names.keywords, row.keywordId);
    const campaignId = campaignName ? row.campaignId : null;
    const adGroupId = adGroupName ? row.adGroupId : null;
    const keywordId = keywordName ? row.keywordId : null;
    const key = `${campaignId ?? ""}|${adGroupId ?? ""}|${keywordId ?? ""}`;
    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = {
        campaignId,
        campaignName,
        adGroupId,
        adGroupName,
        keywordId,
        keywordName,
        leads: 0,
        contacts: 0,
        deals: 0,
        dealAmount: 0,
      };
      buckets.set(key, bucket);
    }
    if (row.recordModule === "Leads") {
      bucket.leads += 1;
      totals.leads += 1;
    } else if (row.recordModule === "Contacts") {
      bucket.contacts += 1;
      totals.contacts += 1;
    } else {
      const amount = dealAmounts.get(row.recordId) ?? 0;
      bucket.deals += 1;
      bucket.dealAmount += amount;
      totals.deals += 1;
      totals.dealAmount += amount;
    }
  }

  const rows = [...buckets.values()].sort(
    (a, b) =>
      compareNames(a.campaignName, b.campaignName) ||
      compareNames(a.adGroupName, b.adGroupName) ||
      compareNames(a.keywordName, b.keywordName),
  );
  return { rows, totals };
}
