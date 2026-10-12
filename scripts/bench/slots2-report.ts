import { bestPairs, type Evidence, type ReadRow } from "./slots2-measure";
import { ALL_SLOTS } from "./slots2-storage";

const f = (n: number | undefined) => (n !== undefined && Number.isFinite(n) ? n.toFixed(2) : "—");
const yes = (v: boolean) => (v ? "yes" : "no");
const clean = (s: string) => s.replaceAll("|", "/").replace(/\s+/g, " ");
export function outcomes(e: Evidence): void {
  const best = bestPairs(e.reads);
  const selected = (model: string, scenario: string) =>
    best.find((p) => p.on.model === model && p.on.scenario === scenario)?.on;
  const numeric = ["S3", "S14 (b)"].map((s) => selected("A4b", s));
  const matrix = best.filter(
    (p) =>
      p.on.model === "A4b" &&
      /^O[1-4]/.test(p.on.scenario) &&
      !p.on.scenario.includes("single alternate") &&
      !/ arm$/.test(p.on.scenario),
  );
  const writes = e.writes.filter((w) => w.model === "A4b20");
  const reports = ["S8", "S10 source", "S10 owner"].map((s) => selected("A4b", s));
  const a4 = e.reads.filter((r) => r.model === "A4b");
  const rlsSame = a4
    .filter((r) => r.rls === "on")
    .every((on) => {
      const off = a4.find(
        (r) => r.scenario === on.scenario && r.round === on.round && r.rls === "off",
      );
      return off?.plan === on.plan && off.buffers === on.buffers;
    });
  e.outcomes = [
    {
      rule: 1,
      pass:
        numeric.every((r) => r?.indexCond && r.p95 <= 100) &&
        e.checks
          .filter((c) => /^exact |^write rejects|^negative zero/.test(c.name))
          .every((c) => c.pass),
      detail: "S3/S14(b): Index Cond, p95 ≤100 ms; all exact comparisons",
    },
    {
      rule: 2,
      pass:
        matrix.length === 24 &&
        matrix.every(
          (p) =>
            p.on.p95 <= (p.on.scenario.includes("offset5000") ? 300 : 100) &&
            p.on.ordered &&
            !p.on.fullSort,
        ),
      detail:
        "O1–O4, full indexes, both filters and all pages; ordered access and no full-set Sort",
    },
    {
      rule: 3,
      pass: writes.length === 3 && writes.every((w) => w.p95 <= 15),
      detail: "20 populated slots: insert/update1/update5 p95 ≤15 ms",
    },
    {
      rule: 4,
      pass:
        [0, 200, 0].every(
          (n, i) => n === e.backfill[["initialCount", "corruptedCount", "repairedCount"][i] ?? ""],
        ) && (e.backfill.writerOperations ?? 0) > 0,
      detail: "Concurrent backfill: 0 → exactly 200 → 0 mismatches",
    },
    {
      rule: 5,
      pass: reports.every((r) => r && r.p95 <= (r.scenario === "S8" ? 5 : 1000)),
      detail: "S8 p95 ≤5 ms; S10 source/owner p95 ≤1000 ms",
    },
    {
      rule: 6,
      pass: rlsSame && e.paired.length === 5 && e.paired.every((p) => p.planSame && p.ratio <= 1.1),
      detail:
        "All A4b off/on access plans and buffers equal in all rounds; paired ratio median ≤1.10",
    },
  ];
}
function readTable(rows: ReadRow[]): string {
  const lines = [
    "| Model / scenario | round | off median / p95 ms | on median / p95 ms | on p95 range (3 rounds) | buffers off/on | slot Index Cond | ordered scan | full-set Sort | same plan+buffers | est / predicate count | plan (on) |",
    "| --- | ---: | ---: | ---: | --- | --- | --- | --- | --- | --- | --- | --- |",
  ];
  for (const { on, off, range, same } of bestPairs(rows))
    lines.push(
      `| ${on.model} / ${on.scenario} | ${on.round} | ${f(off.median)} / ${f(off.p95)} | ${f(on.median)} / ${f(on.p95)} | ${range} | ${off.buffers}/${on.buffers} | ${yes(on.indexCond)} | ${yes(on.ordered)} | ${yes(on.fullSort)} | ${yes(same)} | ${on.estimated ?? "—"} / ${on.actual ?? "—"} | ${clean(on.plan)} |`,
    );
  return lines.join("\n");
}
const writes = (e: Evidence, models: string[]) =>
  [
    "| Model | operation | key-share lock | median / p95 ms | WAL bytes/op |",
    "| --- | --- | --- | ---: | ---: |",
    ...e.writes
      .filter((w) => models.includes(w.model))
      .map(
        (w) =>
          `| ${w.model} | ${w.scenario} | ${yes(w.locked)} | ${f(w.median)} / ${f(w.p95)} | ${f(w.wal)} |`,
      ),
  ].join("\n");
const sizes = (e: Evidence, models: string[]) =>
  [
    "| Model | table MB (TOAST included) | index MB | side rows |",
    "| --- | ---: | ---: | ---: |",
    ...e.sizes
      .filter((s) => models.includes(s.model))
      .map(
        (s) =>
          `| ${s.model} | ${f(s.tables / 1048576)} | ${f(s.indexes / 1048576)} | ${s.sideRows ?? "—"} |`,
      ),
  ].join("\n");
export function render(e: Evidence): string {
  const out = [
    "# Record storage: second slot evidence (MEP-103)",
    "",
    `Complete: ${yes(e.complete)}. Only synthetic data. Acceptance criteria are evaluated without changing the ADR.`,
    "",
    "## Environment",
    "",
    "| Item | Value |",
    "| --- | --- |",
    ...Object.entries(e.environment).map(([k, v]) => `| ${k} | ${v} |`),
    ...Object.entries(e.protocol).map(([k, v]) => `| ${k} | ${v} |`),
    `| load average start (1/5/15 min) | ${e.loadStart.map(f).join(" / ")} |`,
    `| load average end (1/5/15 min) | ${e.loadEnd.map(f).join(" / ")} |`,
    "",
    "Three rounds per read, each with warmup and measured batches: runtime role with RLS disabled, then immediately enabled. Summary selects the minimum RLS-on p95 round and retains that round's off/on pair. All rounds follow below. Writes run once. S7 and C are not loaded/measured. Off/on timing includes BEGIN, local tenant setting, query and COMMIT.",
    "",
    "Index Cond is reported only for typed value predicates; pure sort evidence is ordered index access. A full-set Sort consumes an uncapped matching set, including a union whose arm limits are large enough to consume all matches. The predicate count removes pagination; its estimate is the unbounded predicate plan, never the Actual Rows of an early-stopped LIMIT scan. Plan equality means the access-plan shape and buffer total; the tenant InitPlan is omitted from that shape.",
    "",
    "## 1. Exact bigint and late document reads",
    "",
    readTable(e.reads.filter((r) => r.section === 1)),
    "",
    "## 2. Null sorting matrix",
    "",
    readTable(e.reads.filter((r) => r.section === 2)),
    "",
    "## 3. Full slots and skew",
    "",
    writes(e, ["A4b20"]),
    "",
    sizes(e, ["A4b20"]),
    "",
    "Historical MEP-96 A4 (10 assigned slots, not all values present): insert median/p95 4.71/10.97 ms, update1 p95 24.84 ms, WAL about 105 KB/operation. Historical load differs; same-run A4b/A5 figures below are the controlled comparison.",
    "",
    "| field | slot |",
    "| --- | --- |",
    ...Object.entries(ALL_SLOTS).map(([k, v]) => `| ${k} | ${v} |`),
    "",
    readTable(e.reads.filter((r) => r.section === 3)),
    "",
    "## 4. Mixed organizations/modules",
    "",
    readTable(e.reads.filter((r) => r.section === 4)),
    "",
    "## 5. Module lock and backfill",
    "",
    writes(e, ["A4b"]),
    "",
    "| Backfill evidence | Value |",
    "| --- | ---: |",
    ...Object.entries(e.backfill).map(([k, v]) => `| ${k} | ${f(v)} |`),
    "",
    "Assignment holds FOR UPDATE on the module row; every concurrent writer holds FOR KEY SHARE until commit. Owner-run 5,000-row batches derive the slot from the row's current document inside each UPDATE. Verification uses IS DISTINCT FROM. WAL includes the concurrent writer. Corruption uses 100 populated rows set NULL and 100 set to a wrong value.",
    "",
    "## 6. Indexed-value side table",
    "",
    readTable(e.reads.filter((r) => r.section === 6)),
    "",
    writes(e, ["A4b", "A5", "A4b20", "A520"]),
    "",
    sizes(e, ["A4b", "A5", "A4b20", "A520"]),
    "",
    "A5 uses exactly the same document seed, assigned fields, missing-value distribution, write IDs/patches, event payload and runtime role as A4b; A520 uses the same filled 20-field documents as A4b20. Missing values have no side row. The primary key is (organization_id,record_id,field_id); four partial value indexes start with organization_id,module_id,field_id and end with record_id. Both tables enforce the same tenant policy.",
    "",
    "## 7. Single read, aggregates and paired RLS",
    "",
    readTable(e.reads.filter((r) => r.section === 7)),
    "",
    "| scenario | median paired on/off ratio | bypass access plan = RLS-disabled access plan |",
    "| --- | ---: | --- |",
    ...e.paired.map((p) => `| ${p.scenario} | ${p.ratio.toFixed(3)} | ${yes(p.planSame)} |`),
    "",
    "The paired protocol runs 30 pairs after warmup with identical parameters, bypass role first and runtime RLS role immediately afterwards. Each scenario separately checks the bypass plan against a runtime RLS-disabled plan. S10 keeps the original 12-month created-at window: A4b projects that timestamp to ix_time_2 only for this read comparison, uses ix_text_4 for source and exact sum(ix_num_1)/100 for totals; the extra timestamp projection is removed before writes.",
    "",
    "## Acceptance expectations",
    "",
    "| rule | result | evidence |",
    "| --- | --- | --- |",
    ...e.outcomes.map((o) => `| ${o.rule} | ${o.pass ? "met" : "not met"} | ${o.detail} |`),
    "",
    "## SQL used",
    "",
    ...Object.entries(e.sql).flatMap(([k, v]) => [`### ${k}`, "", "```sql", v, "```", ""]),
    "## Checks",
    "",
    "| check | pass | detail |",
    "| --- | --- | --- |",
    ...e.checks.map((c) => `| ${c.name} | ${yes(c.pass)} | ${c.detail} |`),
    "",
    "## Notes",
    "",
    ...e.notes.map((n) => `- ${n}`),
    "",
    "## All read rounds",
    "",
    "| model / scenario | round | RLS | median / p95 ms | buffers | Index Cond | ordered | full Sort | est / predicate count | plan |",
    "| --- | ---: | --- | ---: | ---: | --- | --- | --- | --- | --- |",
    ...e.reads.map(
      (r) =>
        `| ${r.model} / ${r.scenario} | ${r.round} | ${r.rls} | ${f(r.median)} / ${f(r.p95)} | ${r.buffers} | ${yes(r.indexCond)} | ${yes(r.ordered)} | ${yes(r.fullSort)} | ${r.estimated ?? "—"} / ${r.actual ?? "—"} | ${clean(r.plan)} |`,
    ),
    "",
    "## Branch access (server EXPLAIN time, same best round)",
    "",
    ...bestPairs(e.reads)
      .filter((p) => p.on.arms.length)
      .map((p) => `- ${p.on.model} ${p.on.scenario}: ${p.on.arms.join("; ")}`),
    "",
    "## Sanitized value conditions",
    "",
    ...bestPairs(e.reads)
      .filter((p) => p.on.conditions.length)
      .map((p) => `- ${p.on.model} ${p.on.scenario}: ${p.on.conditions.map(clean).join("; ")}`),
    "",
  ];
  return out.join("\n");
}
export function closing(e: Evidence): string {
  const best = bestPairs(e.reads);
  const out = [
    "Ölçüm tamamlandı; ADR kararı CTO’ya aittir.",
    "",
    `Doğrulama: ${e.checks.filter((c) => c.pass).length}/${e.checks.length}; 200.000 temel kayıt + 2.000 sayısal uç kayıt; 2.000 yazma/tür; okumalarda 3 × (5 ısınma + 30 ölçüm).`,
    "",
  ];
  for (let section = 1; section <= 7; section++) {
    out.push(
      `**Bölüm ${section}**`,
      "",
      "| model / senaryo | ortanca / p95 ms (RLS açık) | buffer | erişim |",
      "| --- | ---: | ---: | --- |",
    );
    const rows = best.filter((p) => p.on.section === section && !/ arm$/.test(p.on.scenario));
    if (section === 2) {
      for (const model of ["A4b", "A4bn"])
        for (const order of ["O1", "O2", "O3", "O4"]) {
          const group = rows.filter(
            (p) =>
              p.on.model === model &&
              p.on.scenario.startsWith(order) &&
              !p.on.scenario.includes("single alternate"),
          );
          const worst = group.sort((a, b) => b.on.p95 - a.on.p95)[0]?.on;
          if (worst)
            out.push(
              `| ${model} ${order} (en yüksek p95: ${worst.scenario}) | ${f(worst.median)} / ${f(worst.p95)} | ${worst.buffers} | sıralı=${yes(worst.ordered)}, tam Sort=${yes(worst.fullSort)} |`,
            );
        }
    } else
      for (const { on } of rows)
        out.push(
          `| ${on.model} ${on.scenario} | ${f(on.median)} / ${f(on.p95)} | ${on.buffers} | Index Cond=${yes(on.indexCond)}, sıralı=${yes(on.ordered)}, tam Sort=${yes(on.fullSort)} |`,
        );
    if (section === 3 || section === 5 || section === 6)
      out.push(
        "",
        writes(
          e,
          section === 3 ? ["A4b20"] : section === 5 ? ["A4b"] : ["A4b", "A5", "A4b20", "A520"],
        ),
      );
    if (section === 3 || section === 6)
      out.push("", sizes(e, section === 3 ? ["A4b20"] : ["A4b", "A5", "A4b20", "A520"]));
    if (section === 5)
      out.push(
        "",
        `Geri doldurma: ${f(e.backfill.elapsedMs)} ms; WAL ${f((e.backfill.walBytes ?? 0) / 1048576)} MB; yazıcı p95 ${f(e.backfill.writerP95)} ms, ${f(e.backfill.writerHz)} işlem/sn. Uyumsuzluk: ${e.backfill.initialCount} → ${e.backfill.corruptedCount} → ${e.backfill.repairedCount}.`,
      );
    if (section === 7)
      out.push(
        "",
        ...e.paired.map((p) => `- ${p.scenario}: çiftli oran ortancası ${p.ratio.toFixed(3)}.`),
      );
    out.push("");
  }
  out.push(
    "**Önceden yazılan beklentiler**",
    "",
    ...e.outcomes.map((o) => `${o.rule}. ${o.pass ? "Tuttu" : "Tutmadı"}: ${o.detail}`),
    "",
    "**Kullanılan SQL biçimleri**",
    "",
  );
  for (const key of [
    "O3 two arms",
    "O4 two arms",
    "S14 (a) two step",
    "S2-OFFSET two step",
    "S3 two step",
    "A5 S2",
    "A5 S3",
    "A5 S14 (b)",
  ]) {
    if (e.sql[key]) out.push(key, "", "```sql", e.sql[key], "```", "");
  }
  return out.join("\n");
}
