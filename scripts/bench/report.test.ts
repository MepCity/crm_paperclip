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

  it("lists Incremental Sort and Gather in tree order", () => {
    const summary = summarizePlan({
      "Node Type": "Limit",
      "Shared Hit Blocks": 4,
      "Shared Read Blocks": 1,
      Plans: [
        {
          "Node Type": "Gather",
          "Workers Planned": 2,
          "Workers Launched": 2,
          "Shared Hit Blocks": 4,
          "Shared Read Blocks": 1,
          Plans: [
            {
              "Node Type": "Incremental Sort",
              Plans: [
                {
                  "Node Type": "Index Scan",
                  "Index Name": "a_updated_idx",
                  "Plan Rows": 50,
                  "Actual Rows": 50,
                  "Actual Loops": 1,
                  "Rows Removed by Filter": 3,
                },
              ],
            },
          ],
        },
      ],
    });
    expect(summary.summary).toBe(
      "Gather planned=2 launched=2; Incremental Sort; Index Scan a_updated_idx",
    );
    expect(summary.buffers).toBe(5);
    expect(summary.actualRows).toBe(50);
    expect(summary.rowsRemoved).toBe(3);
  });
});
