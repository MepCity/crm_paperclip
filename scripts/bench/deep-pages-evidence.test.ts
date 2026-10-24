import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { VARIANTS } from "./deep-pages-queries";
import type { DeepEvidence } from "./deep-pages-run";
import { ORDERS } from "./slots2-queries";

const jsonUrl = new URL("./results/record-storage-deep-pages.json", import.meta.url);
const reportUrl = new URL("./results/record-storage-deep-pages.md", import.meta.url);

describe("frozen full-scale deep-page evidence", () => {
  it("contains every requested cell, sample, policy, round and passing equivalence check", () => {
    const e = JSON.parse(readFileSync(jsonUrl, "utf8")) as DeepEvidence;
    expect(e.complete).toBe(true);
    expect(e.protocol).toEqual({ rows: 200000, writes: 2000, warmup: 5, measure: 30, seed: 1 });
    expect(e.reads).toHaveLength(720);
    expect(e.samples).toHaveLength(720);
    expect(e.checks.every((c) => c.pass)).toBe(true);
    for (const model of VARIANTS)
      for (const order of Object.keys(ORDERS))
        for (const filter of ["plain", "status"])
          for (const page of ["first", "offset5000", "boundary"]) {
            const scenario = `${order} ${filter} ${page}`;
            const rows = e.reads.filter((r) => r.model === model && r.scenario === scenario);
            expect(rows).toHaveLength(6);
            for (const round of [1, 2, 3])
              for (const rls of ["off", "on"]) {
                const r = rows.find((r) => r.round === round && r.rls === rls);
                const samples = e.samples.find(
                  (r) =>
                    r.model === model &&
                    r.scenario === scenario &&
                    r.round === round &&
                    r.rls === rls,
                )?.ms;
                expect(samples).toHaveLength(30);
                const sorted = [...(samples ?? [])].sort((a, b) => a - b);
                expect(r?.median).toBeCloseTo(((sorted[14] ?? 0) + (sorted[15] ?? 0)) / 2, 9);
                expect(r?.p95).toBeCloseTo(
                  (sorted[27] ?? 0) + ((sorted[28] ?? 0) - (sorted[27] ?? 0)) * 0.55,
                  9,
                );
              }
            expect(e.checks.filter((c) => c.name.startsWith(`${model} ${scenario} `))).toHaveLength(
              2,
            );
          }
    expect(e.writes).toHaveLength(6);
    expect(e.writes.every((w) => w.operations === 2000 && w.wal > 0 && w.p95 > 0)).toBe(true);
    expect(e.sizes).toHaveLength(2);
    expect(e.nodes.map((p) => [p.order, p.off.length, p.on.length])).toEqual([
      ["O1", 5, 5],
      ["O2", 5, 5],
    ]);
    expect(e.loadStart).toHaveLength(3);
    expect(e.loadEnd).toHaveLength(3);
  });
  it("matches every report summary against the raw on/off rounds and every raw round row", () => {
    const e = JSON.parse(readFileSync(jsonUrl, "utf8")) as DeepEvidence;
    const report = readFileSync(reportUrl, "utf8");
    const lines = report.split("\n");
    for (const model of VARIANTS)
      for (const order of Object.keys(ORDERS))
        for (const filter of ["plain", "status"])
          for (const page of ["first", "offset5000", "boundary"]) {
            const scenario = `${order} ${filter} ${page}`;
            const on = e.reads
              .filter((r) => r.model === model && r.scenario === scenario && r.rls === "on")
              .sort((a, b) => a.p95 - b.p95);
            const best = on[0];
            if (!best) throw new Error("missing best round");
            const off = e.reads.find(
              (r) =>
                r.model === model &&
                r.scenario === scenario &&
                r.rls === "off" &&
                r.round === best.round,
            );
            const columns = lines
              .find((l) => l.startsWith(`| ${model} / ${scenario} |`))
              ?.split("|")
              .map((c) => c.trim());
            expect(columns?.[2]).toBe(String(best.round));
            expect(columns?.[3]).toBe(`${off?.median.toFixed(3)} / ${off?.p95.toFixed(3)}`);
            expect(columns?.[4]).toBe(`${best.median.toFixed(3)} / ${best.p95.toFixed(3)}`);
            expect(columns?.[5]).toBe(`${best.p95.toFixed(2)}–${on[2]?.p95.toFixed(2)}`);
            for (const r of e.reads.filter((r) => r.model === model && r.scenario === scenario))
              expect(report).toContain(
                `| ${model} / ${scenario} | ${r.round} | ${r.rls} | ${r.median.toFixed(3)} | ${r.p95.toFixed(3)} |`,
              );
          }
  });
  it("retains all twenty-four frozen baseline summary values", () => {
    const e = JSON.parse(readFileSync(jsonUrl, "utf8")) as DeepEvidence;
    const baseline = readFileSync(
      new URL("./results/record-storage-slots-2.md", import.meta.url),
      "utf8",
    );
    let count = 0;
    for (const line of baseline.split("\n")) {
      const columns = line.split("|").map((c) => c.trim());
      if (
        !/^A4b \/ O[1-4] (plain|status) (first|offset5000|boundary)$/.test(columns[1] ?? "") ||
        !/^\d+\.\d+ \/ \d+\.\d+$/.test(columns[3] ?? "")
      )
        continue;
      const scenario = columns[1]?.slice("A4b / ".length);
      expect(e.environment[`baseline ${scenario}`]).toBe(Number(columns[4]?.split(" / ")[1]));
      count++;
    }
    expect(count).toBe(24);
  });
});
