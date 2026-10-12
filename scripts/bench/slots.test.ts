import { describe, expect, it } from "vitest";
import { generateDataset } from "./dataset";
import type { ListParams } from "./queries";
import { LEAD_SLOTS, SLOT_COLUMNS, slotIndexes, slotValues } from "./slot-layout";
import { paramsForScenario, projectSlots, scenarioQuery } from "./slot-queries";
import { inspectSlots, type SlotEvidence, samePlanNoise } from "./slots";

const input: ListParams = {
  orgId: "11111111-1111-7111-8111-111111111111",
  moduleId: "22222222-2222-7222-8222-222222222222",
  leadStatus: "lead_status_0",
  ownerId: "33333333-3333-7333-8333-333333333333",
  revenueMin: "2500000",
  industries: ["industry_00"],
  rating: "rating_0",
  country: "country_000",
  contactId: "44444444-4444-7444-8444-444444444444",
  cursorCompany: "Company 000001",
  cursorId: "55555555-5555-7555-8555-555555555555",
  searchLike: "%xqz%",
  prefixQuery: "alpha:*",
  offset: 5000,
};

describe("slot compiler and layout", () => {
  it("keeps document display values and replaces only indexed filter/order expressions", () => {
    for (const scenario of [
      "S2",
      "S2-KEYSET",
      "S3",
      "S4",
      "S5",
      "S11",
      "S14",
      "S2 count",
    ] as const) {
      const a3 = scenarioQuery("A3", scenario, input, input.cursorId ?? "");
      const a4 = scenarioQuery("A4", scenario, input, input.cursorId ?? "");
      expect(a4.values).toEqual(a3.values);
      expect(a4.text).not.toMatch(
        /\(data->>'(?:company|lead_status|country|industry|rating|cf_lookup_1|cf_datetime_1)'\) collate/,
      );
      expect(a4.text).not.toMatch(/ix_\w+_\d\s*::/);
      if (scenario !== "S2 count") {
        expect(a4.text).toContain("data->>'company' as company");
        expect(a4.text).toContain("(data->'annual_revenue')::numeric(16,2) as annual_revenue");
      }
    }
    expect(scenarioQuery("A4", "S2-KEYSET", input, "").text).toContain(
      "order by ix_text_1 asc nulls last, id asc",
    );
    expect(scenarioQuery("A4", "S4", input, "").text).toContain("data->>'email_opt_out'");
    expect(scenarioQuery("A4", "S3", input, "").text).toMatch(/ix_time_1 >= \$\d+::timestamptz/);
    expect(scenarioQuery("A4", "S11", input, "").text).toMatch(/ix_ref_1 = \$\d+::uuid/);
    expect(scenarioQuery("A4", "S14", input, "").text).toMatch(
      /ix_num_1 >= \$\d+::double precision/,
    );
    expect(scenarioQuery("A4", "S14", input, "").text).toContain(
      "ix_num_1 desc nulls last, bench_a.records.id asc",
    );
    expect(scenarioQuery("B1", "S14", input, "").text).toMatch(/annual_revenue >= \$\d+::numeric/);
    const full = scenarioQuery("A3", "S8", input, input.cursorId ?? "");
    expect(projectSlots(full)).toEqual(full);
    expect(paramsForScenario({ ...input, s14Min: "4500000" } as ListParams, "S14").revenueMin).toBe(
      "4500000",
    );
  });
  it("populates module-specific slots and leaves unused and missing slots null", () => {
    const data = generateDataset({ seed: 11, scale: { leadsA: 200, contactsA: 50, leadsB: 50 } });
    for (const record of data.leads) {
      const values = slotValues(record);
      for (const [field, slot] of Object.entries(LEAD_SLOTS))
        expect(values[SLOT_COLUMNS.findIndex((s) => s.name === slot)]).toBe(
          record.fields[field]?.column ?? null,
        );
      expect(values[7]).toBeNull();
      expect(values[9]).toBeNull();
    }
    const contact = data.contacts[0];
    if (!contact) throw new Error("missing contact");
    const values = slotValues(contact, true);
    expect(values.slice(0, 3)).toEqual(
      ["last_name", "company", "email"].map((key) => contact.fields[key]?.column ?? null),
    );
    expect(values.slice(3).every((value) => value === null)).toBe(true);
    expect(slotIndexes(false)).toHaveLength(20);
    expect(slotIndexes(true)).toHaveLength(20);
    expect(slotIndexes(false).every((sql) => !sql.includes("is not null"))).toBe(true);
    expect(slotIndexes(true).every((sql) => sql.includes("is not null"))).toBe(true);
  });
  it("distinguishes filtering from ordering-only index scans, including bitmap children", () => {
    expect(
      inspectSlots({
        "Node Type": "Index Scan",
        "Index Name": "a_slot_ix_text_1",
        "Index Cond": "(organization_id = 'synthetic')",
      }).indexCond,
    ).toBe(false);
    const inspected = inspectSlots({
      "Node Type": "Bitmap Heap Scan",
      Filter: "(ix_text_7 = 'country')",
      Plans: [
        {
          "Node Type": "Bitmap Index Scan",
          "Index Name": "a_slot_ix_num_1",
          "Index Cond": "((ix_num_1 >= '10'::double precision) AND (module_id = 'synthetic'))",
        },
      ],
    });
    expect(inspected.indexCond).toBe(true);
    expect(inspected.slotFilters).toContain("ix_num_1");
    expect(inspected.slotFilters).toContain("ix_text_7");
    expect(inspected.conditions.join()).not.toContain("synthetic");
  });
  it("retries only >2x gaps with identical plans and buffers", () => {
    const off = { plan: "Index Scan", buffers: 50, sharedRead: 0, medianMs: 1 } as SlotEvidence;
    expect(samePlanNoise(off, { ...off, medianMs: 2.1 })).toBe(true);
    expect(samePlanNoise(off, { ...off, medianMs: 2.1, sharedRead: 50 })).toBe(true);
    expect(samePlanNoise(off, { ...off, medianMs: 2 })).toBe(false);
    expect(samePlanNoise(off, { ...off, medianMs: 3, buffers: 51 })).toBe(false);
    expect(samePlanNoise(off, { ...off, medianMs: 3, plan: "Seq Scan" })).toBe(false);
  });
});
