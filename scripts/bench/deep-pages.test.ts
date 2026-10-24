import { mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { universe } from "./dataset";
import { deepQuery } from "./deep-pages-queries";
import { renderDeep } from "./deep-pages-report";
import {
  cleanupOrphanedClusters,
  emptyEvidence,
  getAvailableDiskGB,
  inspectDeep,
  type TimedPlan,
} from "./deep-pages-run";
import type { ListParams } from "./queries";
import type { Plan } from "./slots2-measure";
import { matrixQuery } from "./slots2-queries";

const world = universe(1);
const p = { orgId: world.orgA, moduleId: world.moduleLeads, leadStatus: "synthetic" } as ListParams;
describe("deep measurement evidence", () => {
  it("retains the unchanged S1 forms and narrows both split arms", () => {
    for (const order of ["O1", "O2", "O3", "O4"] as const) {
      expect(deepQuery("S1", order, 5000, p, true)).toEqual(
        matrixQuery("A4b", order, 5000, p, true, order === "O3" || order === "O4"),
      );
      const inner = deepQuery("S2", order, 5000, p, true).text.split(")\n    select r.*")[0];
      expect(inner).not.toContain("select r.*");
      if (order === "O3" || order === "O4")
        expect(inner?.match(/select r.id,r.ix_text_1/g)).toHaveLength(2);
      expect(deepQuery("S3", order, 5000, p, true).text).not.toContain("union all");
    }
  });
  it("distinguishes page-only Sort from full matching-set Sort", () => {
    const page: Plan = {
      "Node Type": "Sort",
      Plans: [
        {
          "Node Type": "Nested Loop",
          Plans: [
            { "Node Type": "CTE Scan", "CTE Name": "page" } as Plan,
            { "Node Type": "Limit", Plans: [{ "Node Type": "Index Scan" }] },
          ],
        },
      ],
    };
    expect(inspectDeep(page, 198015).fullSort).toBe(false);
    const full: Plan = {
      "Node Type": "Sort",
      Plans: [{ "Node Type": "Index Scan", "Actual Rows": 198015 }],
    };
    expect(inspectDeep(full, 198015).fullSort).toBe(true);
  });
  it("generates summary minima, ranges and matching off rounds from raw evidence", () => {
    const e = emptyEvidence({ rows: 800 });
    for (let round = 1; round <= 3; round++)
      for (const rls of ["off", "on"] as const)
        e.reads.push({
          model: "S1",
          scenario: "O1 plain boundary",
          section: 1,
          round,
          rls,
          median: round,
          p95: [8, 4, 7][round - 1] ?? 0,
          plan: "Index Scan slot_ix_text_1",
          buffers: 10,
          indexCond: false,
          ordered: true,
          fullSort: false,
          conditions: [],
          arms: [],
          estimated: null,
          actual: 800,
        });
    e.checks.push(
      ...["on", "off"].map((rls) => ({
        name: `S1 O1 plain boundary ${rls}`,
        pass: true,
        detail: "identity and order",
      })),
    );
    const report = renderDeep(e);
    expect(report).toContain(
      "| S1 / O1 plain boundary | 2 | 2.000 / 4.000 | 2.000 / 4.000 | 4.00–8.00 |",
    );
    expect(report).toContain("| S1 | 4.000 | pending | pending | pending |");
  });
  it("aligns scans when the policy adds a tenant InitPlan", () => {
    const e = emptyEvidence({ rows: 800 });
    const scan = (time: number): TimedPlan => ({
      "Node Type": "Index Scan",
      "Index Name": "slot_ix_text_1",
      "Actual Total Time": time,
      "Actual Startup Time": 0,
      "Actual Rows": 5051,
      "Actual Loops": 1,
    });
    const off: TimedPlan = {
      "Node Type": "Limit",
      "Actual Total Time": 3,
      "Actual Startup Time": 0,
      Plans: [scan(3)],
    };
    const on: TimedPlan = {
      "Node Type": "Limit",
      "Actual Total Time": 4,
      "Actual Startup Time": 0,
      Plans: [
        {
          "Node Type": "Result",
          "Subplan Name": "InitPlan 1",
          "Actual Total Time": 0.01,
          "Actual Startup Time": 0,
          "Actual Rows": 1,
          "Actual Loops": 1,
        },
        {
          "Node Type": "Result",
          "Actual Total Time": 4,
          "Actual Startup Time": 0,
          Plans: [scan(4)],
        },
      ],
    };
    e.nodes.push({ order: "O1", off: Array(5).fill(off), on: Array(5).fill(on) });
    const report = renderDeep(e);
    expect(report).toContain(
      "O1 / main/Index Scan/slot_ix_text_1#0 / Index Scan slot_ix_text_1 | 0.000/0.000 | 3.000/4.000 | 1.000",
    );
    expect(report).toContain("O1 / init/Result/#0 / Result");
  });

  it("checks disk space and cleans up orphaned cluster directories", async () => {
    const gb = await getAvailableDiskGB(".");
    expect(gb).toBeGreaterThan(0);

    const testScratch = join(tmpdir(), `test-bench-cleanup-${Date.now()}`);
    await mkdir(testScratch, { recursive: true });
    try {
      const clusterA = join(testScratch, "crm-deep-pages-test1");
      const clusterB = join(testScratch, "crm-deep-pages-test2");
      const otherDir = join(testScratch, "other-dir");
      await mkdir(clusterA, { recursive: true });
      await mkdir(clusterB, { recursive: true });
      await mkdir(otherDir, { recursive: true });
      await writeFile(join(clusterA, "test.txt"), "hello");

      const removed = await cleanupOrphanedClusters(testScratch);
      expect(removed).toHaveLength(2);
      expect(removed).toContain(clusterA);
      expect(removed).toContain(clusterB);
    } finally {
      await rm(testScratch, { recursive: true, force: true });
    }
  });
});
