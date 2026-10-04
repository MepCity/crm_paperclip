import { describe, expect, it } from "vitest";
import { universe } from "./dataset";
import type { ListParams } from "./queries";
import { bestPairs, inspect, type Plan, type ReadRow, unbounded } from "./slots2-measure";
import { compiledThreshold, edgeDecimals, OPERATORS, scaledWrite } from "./slots2-numeric";
import { coreQuery, matrixQuery, sideNullQuery, twoStep } from "./slots2-queries";

const world = universe(1);
const p: ListParams = {
  orgId: world.orgA,
  moduleId: world.moduleLeads,
  ownerId: world.usersA[0] ?? world.orgA,
  leadStatus: "status",
  revenueMin: "1234567890123456.005",
  industries: ["industry"],
  rating: "rating",
  country: "country",
  contactId: world.moduleContacts,
  cursorCompany: "company",
  cursorId: world.moduleContacts,
  offset: 5000,
  searchLike: "%x%",
  prefixQuery: "x:*",
};
describe("exact scaled bigint compiler", () => {
  it("preserves 16 digits and adjacent cents; rejects scale and range instead of rounding", () => {
    expect(scaledWrite("9999999999999999.99")).toBe("999999999999999999");
    expect(scaledWrite("-9999999999999999.99")).toBe("-999999999999999999");
    expect(scaledWrite("1234567890123456.01")).toBe("123456789012345601");
    expect(scaledWrite("-0")).toBe("0");
    expect(() => scaledWrite("1.001")).toThrow("decimal places");
    expect(() => scaledWrite("1.000")).toThrow("decimal places");
    expect(() => scaledWrite("92233720368547758.08")).toThrow("exceeds bigint");
    expect(() => scaledWrite("1e2")).toThrow("decimal text");
  });
  it("uses mathematical floor and ceil for positive and negative fractional thresholds", () => {
    for (const [threshold, floor, ceil] of [
      ["1.001", "100", "101"],
      ["-1.001", "-101", "-100"],
      ["0.001", "0", "1"],
      ["-0.001", "-1", "0"],
    ]) {
      if (!threshold) throw new Error("missing threshold");
      expect(compiledThreshold(">=", threshold).value).toBe(ceil);
      expect(compiledThreshold(">", threshold).value).toBe(floor);
      expect(compiledThreshold("<=", threshold).value).toBe(floor);
      expect(compiledThreshold("<", threshold).value).toBe(ceil);
      expect(compiledThreshold("=", threshold).sql).toBe("false");
      expect(compiledThreshold("<>", threshold).sql).toBe("ix_num_1 is not null");
    }
  });
  it("folds out-of-range thresholds without emitting an overflowing bigint parameter", () => {
    for (const op of OPERATORS) {
      const high = compiledThreshold(op, "92233720368547758.08"),
        low = compiledThreshold(op, "-92233720368547758.09");
      expect(high.value).toBeNull();
      expect(low.value).toBeNull();
      expect(high.sql).toBe(["<", "<=", "<>"].includes(op) ? "ix_num_1 is not null" : "false");
      expect(low.sql).toBe([">", ">=", "<>"].includes(op) ? "ix_num_1 is not null" : "false");
    }
    expect(compiledThreshold("=", "92233720368547758.07").value).toBe("9223372036854775807");
    expect(compiledThreshold("=", "-92233720368547758.08").value).toBe("-9223372036854775808");
  });
  it("agrees with independent rational comparison over signed cents and three-place thresholds", () => {
    const compare = (a: bigint, b: bigint, op: string) =>
      op === "="
        ? a === b
        : op === "<>"
          ? a !== b
          : op === "<"
            ? a < b
            : op === "<="
              ? a <= b
              : op === ">"
                ? a > b
                : a >= b;
    for (let milli = -305; milli <= 305; milli += 7) {
      const threshold = `${milli < 0 ? "-" : ""}${Math.floor(Math.abs(milli) / 1000)}.${String(Math.abs(milli) % 1000).padStart(3, "0")}`;
      for (const op of OPERATORS) {
        const compiled = compiledThreshold(op, threshold);
        for (let cent = -35; cent <= 35; cent++) {
          const actual =
            compiled.sql === "false"
              ? false
              : compiled.value === null
                ? true
                : compare(BigInt(cent), BigInt(compiled.value), op);
          expect(actual, `${op} ${threshold} at cent ${cent}`).toBe(
            compare(BigInt(cent) * 10n, BigInt(milli), op),
          );
        }
      }
    }
  });
  it("plants 2,000 rows with cent-only pairs, signed values and extremes", () => {
    const values = edgeDecimals();
    expect(values).toHaveLength(2000);
    for (let i = 0; i < 1992; i += 2)
      expect(BigInt(scaledWrite(values[i + 1] ?? "")) - BigInt(scaledWrite(values[i] ?? ""))).toBe(
        1n,
      );
    expect(values).toContain("9999999999999999.99");
    expect(values).toContain("-9999999999999999.99");
  });
});
describe("second slot protocol SQL and plan evidence", () => {
  it("keeps exact document display and bigint-bound predicates in both models", () => {
    const q = coreQuery("A4b", "S14 (b)", p, world.orgA);
    expect(q.text).toContain("ix_num_1 >= $3::bigint");
    expect(q.values[2]).toBe("123456789012345601");
    expect(q.text).toContain("ix_num_1 desc, bench_slot.records.id desc");
    expect(q.text).not.toContain("numeric(16,2)");
    expect(coreQuery("A5", "S3", p, world.orgA).text).toContain("v_num>=");
  });
  it("cuts the narrow page before fetching documents by organization and primary key", () => {
    for (const scenario of ["S3", "S14 (a)", "S2-OFFSET"] as const) {
      const q = twoStep("A4b", scenario, p, world.orgA);
      expect(q.text).toContain("with page as materialized");
      expect(q.text).toContain("and id=p.id offset 0");
      expect(q.text.slice(0, q.text.indexOf(") select"))).not.toContain("data->");
    }
  });
  it("reverses branch priority for ascending nulls first, and keeps both arms capped", () => {
    const o3 = matrixQuery("A4b", "O3", 5000, p, true, true),
      o4 = matrixQuery("A4b", "O4", 0, p, false, true);
    expect(o3.text).toContain("r.*,0 as part");
    expect(o4.text).toContain("r.*,1 as part");
    expect(o3.text.match(/limit \(\$3::int\+51\)/g)).toHaveLength(2);
    expect(o4.text).toContain("q.ix_text_1 asc nulls first,q.id asc");
    expect(sideNullQuery("O3", p, 0, "null").text).toContain("left join");
    expect(sideNullQuery("O3", p, 0, "null").text).toContain("co.v_text is null");
  });
  it("distinguishes an ordering index, a value condition, and a full-set sort", () => {
    const scan: Plan = {
      "Node Type": "Index Scan",
      "Index Name": "slot_ix_text_1",
      "Index Cond": "organization_id='synthetic'::uuid",
    };
    expect(inspect(scan).indexCond).toBe(false);
    expect(inspect(scan).ordered).toBe(true);
    const filtered = { ...scan, "Index Cond": "ix_text_1='secret'::text" };
    expect(inspect(filtered).indexCond).toBe(true);
    expect(inspect(filtered).conditions.join()).not.toContain("secret");
    const full: Plan = { "Node Type": "Sort", Plans: [scan] };
    expect(inspect(full).fullSort).toBe(true);
    const capped: Plan = {
      "Node Type": "Sort",
      Plans: [
        {
          "Node Type": "Append",
          "Actual Rows": 100,
          Plans: [
            { "Node Type": "Limit", Plans: [scan] },
            { "Node Type": "Limit", Plans: [scan] },
          ],
        },
      ],
    };
    expect(inspect(capped, 200).fullSort).toBe(false);
    expect(inspect(capped, 100).fullSort).toBe(true);
  });
  it("removes pagination for cardinality and binds now-unused offsets", () => {
    const q = unbounded(matrixQuery("A4b", "O3", 5000, p, true, true));
    expect(q.text).not.toMatch(/\blimit|\boffset/i);
    expect(q.text).toContain("$3::text is null");
    const count = unbounded(coreQuery("A4b", "S2 count", p, world.orgA));
    expect(count.text).toContain("select 1");
  });
  it("selects the off/on values of the same minimum-on-p95 round", () => {
    const row = (round: number, rls: "off" | "on", p95: number): ReadRow => ({
      section: 1,
      model: "A4b",
      scenario: "S3",
      round,
      rls,
      median: p95 / 2,
      p95,
      plan: "scan",
      buffers: 1,
      indexCond: true,
      ordered: false,
      fullSort: false,
      conditions: [],
      arms: [],
      estimated: 1,
      actual: 1,
    });
    const pair = bestPairs([
      row(1, "off", 1),
      row(1, "on", 8),
      row(2, "off", 20),
      row(2, "on", 4),
      row(3, "off", 2),
      row(3, "on", 10),
    ])[0];
    expect(pair?.on.round).toBe(2);
    expect(pair?.off.p95).toBe(20);
    expect(pair?.range).toBe("4.00–10.00");
  });
});
