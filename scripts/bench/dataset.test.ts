import { describe, expect, it } from "vitest";
import {
  composeSearch,
  generateDataset,
  LEAD_FIELDS,
  SEARCH_TERMS,
  scaleCounts,
  stableUuid,
  uuidV7,
} from "./dataset";

describe("scaleCounts", () => {
  it("scales the other populations with the lead row count", () => {
    expect(scaleCounts(200_000)).toEqual({ leadsA: 200_000, contactsA: 50_000, leadsB: 50_000 });
    expect(scaleCounts(2000)).toEqual({ leadsA: 2000, contactsA: 500, leadsB: 500 });
  });
});

describe("composeSearch", () => {
  it("replaces the changed field and keeps the other searchable text", () => {
    const texts = {
      last_name: "Lane",
      lead_status: "lead_status_0",
      company: "Company 000001",
    };
    const before = composeSearch("Lane", texts);
    const after = composeSearch("Lane", { ...texts, lead_status: "lead_status_1" });
    expect(before).toContain("lead_status_0");
    expect(before).toContain("company 000001");
    expect(after).toContain("lead_status_1");
    expect(after).not.toContain("lead_status_0");
    expect(after).toContain("company 000001");
  });
});

describe("identifiers", () => {
  it("builds stable entity ids and uuid version 7 record ids", () => {
    expect(stableUuid(1, "org-a")).toBe(stableUuid(1, "org-a"));
    expect(stableUuid(1, "org-a")).not.toBe(stableUuid(1, "org-b"));
    const id = uuidV7(Date.UTC(2024, 0, 1), 12);
    expect(id[14]).toBe("7");
    expect(id).toBe(uuidV7(Date.UTC(2024, 0, 1), 12));
    expect(id).not.toBe(uuidV7(Date.UTC(2024, 0, 1), 13));
  });
});

describe("generateDataset", () => {
  it("repeats the same rows for a seed", () => {
    const scale = { leadsA: 25, contactsA: 8, leadsB: 6 };
    const first = generateDataset({ seed: 7, scale });
    const second = generateDataset({ seed: 7, scale });
    expect(second.contacts).toEqual(first.contacts);
    expect(second.leads).toEqual(first.leads);
    expect(second.universe).toEqual(first.universe);
  });

  it("changes when the seed changes", () => {
    const scale = { leadsA: 10, contactsA: 4, leadsB: 4 };
    const first = generateDataset({ seed: 1, scale });
    const second = generateDataset({ seed: 2, scale });
    expect(second.leads[0]?.id).not.toBe(first.leads[0]?.id);
  });

  it("keeps lead field counts and approximate fill rates", () => {
    expect(LEAD_FIELDS).toHaveLength(46);
    const { leads } = generateDataset({
      seed: 3,
      scale: { leadsA: 2000, contactsA: 20, leadsB: 0 },
    });
    const orgA = leads.filter((record) => record.moduleId.endsWith(record.moduleId));
    expect(orgA).toHaveLength(2000);
    const ratio = (present: (record: (typeof leads)[number]) => boolean) =>
      orgA.filter(present).length / orgA.length;
    expect(ratio((record) => record.fields.first_name !== undefined)).toBeGreaterThan(0.55);
    expect(ratio((record) => record.fields.first_name !== undefined)).toBeLessThan(0.65);
    expect(ratio((record) => record.fields.email_opt_out?.bool === true)).toBeGreaterThan(0.07);
    expect(ratio((record) => record.fields.email_opt_out?.bool === true)).toBeLessThan(0.13);
    expect(ratio((record) => record.deletedAt !== null)).toBeGreaterThan(0.01);
    expect(ratio((record) => record.deletedAt !== null)).toBeLessThan(0.04);
    expect(ratio((record) => record.fields.description !== undefined)).toBeGreaterThan(0.65);
    expect(ratio((record) => record.fields.description !== undefined)).toBeLessThan(0.75);
    const described = orgA.filter((record) => record.fields.description?.text);
    const average =
      described.reduce((sum, record) => sum + (record.fields.description?.text?.length ?? 0), 0) /
      described.length;
    expect(average).toBeGreaterThan(280);
    expect(average).toBeLessThan(320);
    for (const record of orgA) {
      expect(record.fields.last_name?.text).toBeTruthy();
      expect(record.search).toBe(record.search.toLowerCase());
      const parsed = JSON.parse(record.dataJson) as Record<string, unknown>;
      expect(Object.values(parsed)).not.toContain(null);
      if (record.search.includes(SEARCH_TERMS.common3)) {
        expect(record.fields.cf_text_6?.text).toContain(SEARCH_TERMS.common3);
      }
    }
  });
});
