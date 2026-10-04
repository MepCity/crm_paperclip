import { describe, expect, it } from "vitest";
import { type ListParams, listQuery } from "./queries";

const input: ListParams = {
  orgId: "11111111-1111-7111-8111-111111111111",
  moduleId: "22222222-2222-7222-8222-222222222222",
  leadStatus: "lead_status_0",
  ownerId: "33333333-3333-7333-8333-333333333333",
  revenueMin: "10.00",
  industries: ["industry_00", "industry_01", "industry_02"],
  rating: "rating_0",
  country: "country_000",
  contactId: "44444444-4444-7444-8444-444444444444",
  cursorCompany: "Company 000001",
  cursorId: "55555555-5555-7555-8555-555555555555",
  searchLike: "%xqz%",
  prefixQuery: "alpha:*",
  offset: 50,
};

describe("listQuery", () => {
  it("keeps jsonb containment on A0 and uses expression equality on A2", () => {
    const contained = listQuery("A", "s2", input, "containment");
    const expressed = listQuery("A", "s2", input, "expression");
    expect(contained.text).toContain("@>");
    expect(expressed.text).not.toContain("@>");
    expect(expressed.text).toContain(`(data->>'lead_status') collate "und-x-icu"`);
    expect(expressed.values).toContain("lead_status_0");

    const optOut = listQuery("A", "s4", input, "expression");
    expect(optOut.text).toContain(`(data->>'email_opt_out')`);
    expect(optOut.text).not.toContain("@>");
    expect(optOut.values).toContain("false");

    const mixed = listQuery("A", "s5", input, "expression");
    expect(mixed.text).toContain("= any(");
    expect(mixed.text).toContain(`(data->>'country') collate "und-x-icu"`);
    expect(mixed.text).not.toContain("@>");

    const lookup = listQuery("A", "s11", input, "expression");
    expect(lookup.text).toContain(`(data->>'cf_lookup_1') collate "und-x-icu"`);
    expect(lookup.text).not.toContain("@>");
  });

  it("seeks a filled keyset cursor with a row comparison and a null tail", () => {
    const query = listQuery("A", "s2-keyset", input, "expression");
    expect(query.text.toLowerCase()).toContain("union all");
    expect(query.text).toContain(">");
    expect(query.text).toContain("is null");
    expect(query.values).toContain("Company 000001");
    expect(query.values).toContain(input.cursorId);
  });

  it("orders A and B lists by the qualified id column", () => {
    const orderClause = (text: string) => text.slice(text.toLowerCase().lastIndexOf("order by"));
    for (const kind of ["s1", "s2", "s3", "s4", "s5", "s7-like", "s7-prefix", "s11"] as const) {
      const a = orderClause(listQuery("A", kind, input).text);
      const b = orderClause(listQuery("B", kind, input).text);
      expect(a).toContain("bench_a.records.id");
      expect(b).toContain("bench_b.leads.id");
      expect(a).not.toMatch(/(^|,\s)id (asc|desc)/);
      expect(b).not.toMatch(/(^|,\s)id (asc|desc)/);
    }
  });

  it("continues a null keyset cursor inside the null tail", () => {
    const query = listQuery("B", "s2-keyset", { ...input, cursorCompany: null }, "containment");
    expect(query.text.toLowerCase()).not.toContain("union all");
    expect(query.text).toContain("is null");
    expect(query.text).toContain(">");
    expect(query.values).not.toContain("Company 000001");
    expect(query.values).toContain(input.cursorId);
  });
});
