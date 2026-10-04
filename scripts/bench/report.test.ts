import { describe, expect, it } from "vitest";
import { summarizePlan } from "./report";

describe("summarizePlan", () => {
  it("counts buffers on the root node only", () => {
    const summary = summarizePlan(
      {
        "Node Type": "Limit",
        "Shared Hit Blocks": 10,
        "Shared Read Blocks": 2,
        Plans: [
          {
            "Node Type": "Index Scan",
            "Index Name": "bl_x_company",
            "Shared Hit Blocks": 100,
            "Shared Read Blocks": 40,
            "Plan Rows": 12,
            "Actual Rows": 5,
            "Actual Loops": 2,
            "Rows Removed by Filter": 9,
            Plans: [
              {
                "Node Type": "Seq Scan",
                "Relation Name": "leads",
                "Shared Hit Blocks": 1000,
                "Shared Read Blocks": 400,
                "Plan Rows": 400,
                "Actual Rows": 80,
                "Actual Loops": 3,
                "Rows Removed by Filter": 70,
              },
            ],
          },
        ],
      },
      3.25,
    );
    expect(summary.buffers).toBe(12);
    expect(summary.sharedRead).toBe(2);
    expect(summary.summary).toContain("Index Scan bl_x_company");
    expect(summary.summary).toContain("Seq Scan leads");
    expect(summary.summary).toContain("jit 3.3ms");
    expect(summary.estRows).toBe(12);
    expect(summary.actualRows).toBe(10);
    expect(summary.rowsRemoved).toBe(9);
  });
});
