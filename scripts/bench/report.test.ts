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
            Plans: [
              {
                "Node Type": "Seq Scan",
                "Relation Name": "leads",
                "Shared Hit Blocks": 1000,
                "Shared Read Blocks": 400,
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
  });
});
