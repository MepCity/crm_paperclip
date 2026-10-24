import type { DeepEvidence, TimedPlan } from "./deep-pages-run";
import { percentile } from "./report";
import { bestPairs } from "./slots2-measure";

const n = (v: number) => v.toFixed(3);
const yes = (v: boolean) => (v ? "yes" : "no");
function flatten(plan: TimedPlan): [string, TimedPlan][] {
  const rows: [string, TimedPlan][] = [];
  const counts = new Map<string, number>();
  const visit = (node: TimedPlan, inInit = false) => {
    const init = inInit || !!node["Subplan Name"]?.startsWith("InitPlan");
    const signature = `${init ? "init" : "main"}/${node["Node Type"]}/${node["Index Name"] ?? node["Relation Name"] ?? ""}`;
    const occurrence = counts.get(signature) ?? 0;
    counts.set(signature, occurrence + 1);
    rows.push([`${signature}#${occurrence}`, node]);
    for (const child of node.Plans ?? []) visit(child, init);
  };
  visit(plan);
  return rows;
}
export function renderDeep(e: DeepEvidence): string {
  const out = [
    "# Record storage: deep-page measurement (MEP-358)",
    "",
    `Complete: ${yes(e.complete)}. Synthetic data only. No ADR decision is made here.`,
    "",
    "## Environment",
    "",
    "| Item | Value |",
    "| --- | --- |",
  ];
  for (const [k, v] of Object.entries({ ...e.environment, ...e.protocol }))
    out.push(`| ${k} | ${v} |`);
  out.push(
    `| load average start (1/5/15 min) | ${e.loadStart.map(n).join(" / ")} |`,
    `| load average end (1/5/15 min) | ${e.loadEnd.map(n).join(" / ")} |`,
    "",
    ...e.notes,
    "",
    "Three rounds; each has five warmups and thirty measurements at full scale, policy off then on, same unprivileged runtime role. Summary selects the lowest RLS-on p95 round and reports the full on-p95 range. Raw JSON retains every measured sample, every check, and all ten node plans per order.",
    "",
    "## 1. Sorting matrix",
    "",
    "| Filter | Empty | Filled | O1 boundary offset | O2 | O3 | O4 |",
    "| --- | ---: | ---: | ---: | ---: | ---: | ---: |",
  );
  for (const b of e.boundaries)
    out.push(
      `| ${b.filtered ? "status" : "plain"} | ${b.empty} | ${b.filled} | ${b.offsets.O1} | ${b.offsets.O2} | ${b.offsets.O3} | ${b.offsets.O4} |`,
    );
  out.push(
    "",
    `Equivalence checks: ${e.checks.filter((c) => c.name.includes("identity") || c.detail.includes("identity")).length}; passing ${e.checks.filter((c) => c.detail.includes("identity") && c.pass).length}. Checks compare every cell under both policies with S1, including S1 self-checks.`,
    "",
    "| Variant / cell | round | off p50 / p95 ms | on p50 / p95 ms | on p95 range | buffers off/on | ordered index scan | full-set Sort | validity | on plan |",
    "| --- | ---: | --- | --- | --- | --- | --- | --- | --- | --- |",
  );
  for (const { on, off, range } of bestPairs(e.reads)) {
    const checks = e.checks.filter((c) => c.name.startsWith(`${on.model} ${on.scenario} `));
    out.push(
      `| ${on.model} / ${on.scenario} | ${on.round} | ${n(off.median)} / ${n(off.p95)} | ${n(on.median)} / ${n(on.p95)} | ${range} | ${off.buffers}/${on.buffers} | ${yes(on.ordered)} | ${yes(on.fullSort)} | ${checks.length === 2 && checks.every((c) => c.pass) ? "valid" : "invalid: identity/order mismatch"} | ${on.plan} |`,
    );
  }
  out.push(
    "",
    "### Unfiltered boundary p95 (minimum on round, ms)",
    "",
    "| Variant | O1 | O2 | O3 | O4 |",
    "| --- | ---: | ---: | ---: | ---: |",
  );
  const pairs = bestPairs(e.reads);
  for (const model of ["S1", "S2", "S3", "B-1", "B-2"])
    out.push(
      `| ${model} | ${["O1", "O2", "O3", "O4"]
        .map((o) => {
          const r = pairs.find(
            (p) => p.on.model === model && p.on.scenario === `${o} plain boundary`,
          );
          return r ? n(r.on.p95) : "pending";
        })
        .join(" | ")} |`,
    );
  out.push(
    "",
    "### S1 beside the frozen MEP-103 baseline",
    "",
    "| Cell | MEP-103 on p95 ms | Same-run S1 on p95 ms |",
    "| --- | ---: | ---: |",
  );
  for (const p of pairs.filter((p) => p.on.model === "S1"))
    out.push(
      `| ${p.on.scenario} | ${e.environment[`baseline ${p.on.scenario}`] ?? "pending"} | ${n(p.on.p95)} |`,
    );
  out.push(
    "",
    "## 2. Twenty-filled-slot write cost",
    "",
    "RLS enabled. Fresh identical A4b20 data for each arrangement; insert/update plus event in each committed transaction. Slot-index counts exclude primary/system indexes. WAL is the checkpoint-to-batch-end cluster insert-LSN delta divided by operations, matching MEP-103. Sizes are post-write, before cleanup, including events/modules and all indexes.",
    "",
    "| Arrangement | Operation | operations | median ms | p95 ms | WAL bytes/op |",
    "| --- | --- | ---: | ---: | ---: | ---: |",
  );
  for (const w of e.writes)
    out.push(
      `| ${w.model} | ${w.scenario} | ${w.operations} | ${n(w.median)} | ${n(w.p95)} | ${n(w.wal)} |`,
    );
  out.push("", "| Arrangement | Table bytes | Index bytes |", "| --- | ---: | ---: |");
  for (const s of e.sizes) out.push(`| ${s.model} | ${s.tables} | ${s.indexes} |`);
  out.push(
    "",
    "## 3. RLS node timings",
    "",
    "Five paired EXPLAIN (ANALYZE, BUFFERS, TIMING) repetitions for unchanged S1 O1/O2 plain offset5000. Each numeric column is the median of that node across five repetitions. Total time is inclusive of children; rows are rows per loop. Delta per row = (on total time − off total time) / (off rows × off loops); undefined at zero rows. Nodes align by type, index/relation name and traversal occurrence, with tenant InitPlans separate, so added Result/InitPlan nodes cannot shift scan alignment; absent nodes contribute zero and have zero loops. Raw plans are in JSON.",
    "",
    "| Order / identity / node | off/on startup ms | off/on total ms | delta ms | off/on rows | off/on loops | delta µs/row | off/on hit blocks | off/on read blocks |",
    "| --- | --- | --- | ---: | --- | --- | ---: | --- | --- |",
  );
  for (const pair of e.nodes) {
    const off = pair.off.map((p) => new Map(flatten(p))),
      on = pair.on.map((p) => new Map(flatten(p)));
    const paths = new Map([
      ...flatten(pair.off[0] as TimedPlan),
      ...flatten(pair.on[0] as TimedPlan),
    ]);
    for (const [path, node] of paths) {
      const med = (plans: Map<string, TimedPlan>[], key: string) =>
        percentile(
          plans.map((p) => Number((p.get(path) as unknown as Record<string, unknown>)?.[key] ?? 0)),
          0.5,
        );
      const totalOff = med(off, "Actual Total Time"),
        totalOn = med(on, "Actual Total Time"),
        rows = med(off, "Actual Rows"),
        loops = med(off, "Actual Loops");
      out.push(
        `| ${pair.order} / ${path} / ${node["Node Type"]}${node["Index Name"] ? ` ${node["Index Name"]}` : ""} | ${n(med(off, "Actual Startup Time"))}/${n(med(on, "Actual Startup Time"))} | ${n(totalOff)}/${n(totalOn)} | ${n(totalOn - totalOff)} | ${rows}/${med(on, "Actual Rows")} | ${loops}/${med(on, "Actual Loops")} | ${rows * loops ? n(((totalOn - totalOff) * 1000) / (rows * loops)) : "undefined"} | ${med(off, "Shared Hit Blocks")}/${med(on, "Shared Hit Blocks")} | ${med(off, "Shared Read Blocks")}/${med(on, "Shared Read Blocks")} |`,
      );
    }
  }
  out.push(
    "",
    "## All rounds",
    "",
    "| Variant / cell | round | policy | median ms | p95 ms | buffers | ordered index scan | full-set Sort | plan |",
    "| --- | ---: | --- | ---: | ---: | ---: | --- | --- | --- |",
  );
  for (const r of e.reads)
    out.push(
      `| ${r.model} / ${r.scenario} | ${r.round} | ${r.rls} | ${n(r.median)} | ${n(r.p95)} | ${r.buffers} | ${yes(r.ordered)} | ${yes(r.fullSort)} | ${r.plan} |`,
    );
  out.push("", "## Checks", "", "| Check | pass | detail |", "| --- | --- | --- |");
  for (const c of e.checks) out.push(`| ${c.name} | ${yes(c.pass)} | ${c.detail} |`);
  out.push(
    "",
    "## SQL",
    "",
    "Bound values are synthetic; placeholders retain the MEP-103 tenant, module, offset and status binding order. Schema/load/write implementation reuses slots2-storage and slots2-writes without modification.",
  );
  for (const [key, sql] of Object.entries(e.sql))
    out.push("", `### ${key}`, "", "```sql", sql, "```");
  return `${out.join("\n")}\n`;
}
