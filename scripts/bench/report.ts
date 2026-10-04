export type TimingRow = {
  scenario: string;
  option: string;
  stage: string;
  medianMs: number;
  p95Ms: number;
  plan: string;
  buffers: number;
  sharedRead: number;
};

export type WriteRow = {
  scenario: string;
  option: string;
  stage: string;
  rls: string;
  operations: number;
  totalMs: number;
  medianMs: number;
  p95Ms: number;
  walBytesPerOp: number;
};

export type SizeSnapshot = {
  stage: string;
  schema: string;
  name: string;
  kind: string;
  bytes: number;
};

export type LoadRow = {
  phase: string;
  ms: number;
};

export type CheckRow = {
  option: string;
  name: string;
  pass: boolean;
  detail: string;
};

export type Selectivity = {
  /** Share of non-deleted org A leads matched by one lead_status value. */
  leadStatusShare: number;
  /** Share of non-deleted org A leads with email_opt_out = false. */
  emailOptOutFalseShare: number;
};

export type PlanNode = {
  "Node Type": string;
  "Index Name"?: string;
  "Relation Name"?: string;
  Plans?: PlanNode[];
  "Shared Hit Blocks"?: number;
  "Shared Read Blocks"?: number;
};

/**
 * Buffer counts on a plan node already include the children. Only the root
 * node's shared hit + read blocks are the bytes the query touched.
 */
export function summarizePlan(
  plan: PlanNode,
  jitTotalMs?: number,
): { summary: string; buffers: number; sharedRead: number } {
  const scans: string[] = [];
  const walk = (node: PlanNode): void => {
    if (node["Node Type"].includes("Scan")) {
      const index = node["Index Name"];
      scans.push(
        index
          ? `${node["Node Type"]} ${index}`
          : `${node["Node Type"]} ${node["Relation Name"] ?? ""}`.trim(),
      );
    }
    for (const child of node.Plans ?? []) walk(child);
  };
  walk(plan);
  const buffers = (plan["Shared Hit Blocks"] ?? 0) + (plan["Shared Read Blocks"] ?? 0);
  const sharedRead = plan["Shared Read Blocks"] ?? 0;
  let summary = scans.join("; ") || plan["Node Type"];
  if (jitTotalMs !== undefined && jitTotalMs > 0) {
    summary = `${summary}; jit ${jitTotalMs.toFixed(1)}ms`;
  }
  return { summary, buffers, sharedRead };
}

export type BenchReport = {
  version: string;
  sharedBuffers: string;
  workMem: string;
  jit: string;
  cpus: number;
  memoryBytes: number;
  rows: number;
  seed: number;
  warmup: number;
  measuredRuns: number;
  writesPerKind: number;
  fullScale: boolean;
  timings: TimingRow[];
  writes: WriteRow[];
  sizes: SizeSnapshot[];
  loads: LoadRow[];
  checks: CheckRow[];
  alter: {
    addNullMs: number;
    addDefaultMs: number;
    indexConcurrentMs: number;
    rows: number;
  } | null;
  selectivity: Selectivity;
  notes: string[];
};

function ms(value: number): string {
  return value.toFixed(2);
}

function table(headers: string[], rows: string[][]): string {
  const head = `| ${headers.join(" | ")} |`;
  const rule = `| ${headers.map(() => "---").join(" | ")} |`;
  const body = rows.map((row) => `| ${row.join(" | ")} |`).join("\n");
  return `${head}\n${rule}\n${body}`;
}

export function percentile(samples: number[], p: number): number {
  if (samples.length === 0) throw new Error("no samples");
  const sorted = [...samples].sort((a, b) => a - b);
  const last = sorted.length - 1;
  const index = last * p;
  const lo = Math.floor(index);
  const hi = Math.ceil(index);
  const left = sorted[lo] ?? 0;
  const right = sorted[hi] ?? left;
  return left + (right - left) * (index - lo);
}

export function renderMarkdown(report: BenchReport): string {
  const memoryGiB = (report.memoryBytes / 1024 ** 3).toFixed(1);
  const timingRows = report.timings.map((row) => [
    row.scenario,
    row.option,
    row.stage,
    ms(row.medianMs),
    ms(row.p95Ms),
    row.plan.replaceAll("|", "/"),
    String(row.buffers),
    String(row.sharedRead),
  ]);
  const writeRows = report.writes.map((row) => [
    row.scenario,
    row.option,
    row.stage,
    row.rls,
    String(row.operations),
    ms(row.totalMs),
    ms(row.medianMs),
    ms(row.p95Ms),
    row.walBytesPerOp.toFixed(0),
  ]);
  const sizeRows = report.sizes.map((row) => [
    row.stage,
    row.schema,
    row.name,
    row.kind,
    String(row.bytes),
  ]);
  const loadRows = report.loads.map((row) => [row.phase, ms(row.ms)]);
  const checkRows = report.checks.map((row) => [
    row.option,
    row.name,
    row.pass ? "pass" : "fail",
    row.detail.replaceAll("|", "/"),
  ]);
  const notes =
    report.notes.length > 0 ? report.notes.map((note) => `- ${note}`).join("\n") : "- none";
  const alter = report.alter
    ? table(
        ["operation", "ms", "rows"],
        [
          ["add column (no default)", ms(report.alter.addNullMs), String(report.alter.rows)],
          [
            "add column (constant default)",
            ms(report.alter.addDefaultMs),
            String(report.alter.rows),
          ],
          [
            "create index concurrently",
            ms(report.alter.indexConcurrentMs),
            String(report.alter.rows),
          ],
        ],
      )
    : "_not run_";

  return `# Record storage benchmark

Client-side timings. Each measured query uses bind parameters. Partial expression indexes are planned with session \`plan_cache_mode=force_custom_plan\` so a bound \`module_id\` still matches the index predicate. Other server settings stay at their defaults.

Storage C keeps the same system indexes as A0 on the record header, plus the value indexes named in the scenario. Search indexes are identical on every option. S7a and S7b run with those indexes. Storage-stage writes run without them; \`+trgm\` and \`+tsv\` write rows add one search index family on top of A2 or B1.

${report.fullScale ? "Full-scale protocol: 5 warmup runs and 30 measured runs; 2000 writes of each kind." : "Smoke protocol: warmup, measured runs, and write counts are reduced because `--rows` is below 200000. Full scale uses 5 warmup runs, 30 measured runs, and 2000 writes of each kind."}

## Environment

${table(
  ["setting", "value"],
  [
    ["postgres", report.version.replaceAll("|", "/")],
    ["shared_buffers", report.sharedBuffers],
    ["work_mem", report.workMem],
    ["jit", report.jit],
    ["cpus", String(report.cpus)],
    ["memory_gib", memoryGiB],
    ["rows", String(report.rows)],
    ["seed", String(report.seed)],
    ["warmup", String(report.warmup)],
    ["measured_runs", String(report.measuredRuns)],
    ["writes_per_kind", String(report.writesPerKind)],
    ["s2_status_share", report.selectivity.leadStatusShare.toFixed(4)],
    ["s4_opt_out_false_share", report.selectivity.emailOptOutFalseShare.toFixed(4)],
  ],
)}

## Load

${table(["phase", "ms"], loadRows)}

## Queries

${table(
  ["scenario", "option", "stage", "median_ms", "p95_ms", "plan", "buffers", "shared_read"],
  timingRows,
)}

## Writes

${table(
  [
    "scenario",
    "option",
    "stage",
    "rls",
    "ops",
    "total_ms",
    "median_ms",
    "p95_ms",
    "wal_bytes_per_op",
  ],
  writeRows,
)}

## Sizes

Table bytes are \`pg_table_size\` (heap, toast, free space). Index bytes are \`pg_relation_size\`.

${table(["stage", "schema", "relation", "kind", "bytes"], sizeRows)}

## Alter on the typed leads table

${alter}

## RLS isolation

${table(["option", "check", "result", "detail"], checkRows)}

## Notes

${notes}
`;
}

const A2_EQUALITY = new Set([
  "S2",
  "S2-KEYSET",
  "S2-OFFSET",
  "S4",
  "S5",
  "S11",
  "S2 count",
  "S2 capped",
  "S4 count",
  "S4 capped",
]);

function walOf(
  report: Pick<BenchReport, "writes">,
  scenario: string,
  option: string,
  stage: string,
) {
  return report.writes.find(
    (row) =>
      row.scenario === scenario &&
      row.option === option &&
      row.stage === stage &&
      row.rls === "n/a",
  )?.walBytesPerOp;
}

function walInverted(earlier: number, later: number): boolean {
  return earlier > later + Math.max(4096, later * 0.02);
}

export function collectNotes(
  report: Pick<BenchReport, "timings" | "checks" | "writes" | "selectivity">,
): string[] {
  const statusPct = (report.selectivity.leadStatusShare * 100).toFixed(1);
  const optPct = (report.selectivity.emailOptOutFalseShare * 100).toFixed(1);
  const notes = [
    `S2 lead_status equality matches about ${statusPct}% of non-deleted org A leads. The field is optional (about 40% empty), so one filled value is about one ninth of the filled rows, not 11% of the table. S4 email_opt_out = false matches about ${optPct}%.`,
    "Buffers are the root plan node's shared hit blocks plus shared read blocks. Child nodes already roll into that total.",
    "A2 equality predicates use the expression-index form. A0 and A1 keep jsonb containment.",
    "S2 keyset seeks with a row comparison on (sort expression, id). Rows with a null sort key are a second branch, union all, then ordered outside the limit. A null cursor continues with sort expression is null and id greater than the cursor.",
    "Storage-stage writes run without search indexes. Each stage, write kind, and RLS setting updates its own record range. A checkpoint runs before each batch. WAL per operation is the batch LSN delta divided by the operation count. +trgm and +tsv rows are the same writes with one search index family added on A2 and B1.",
    "S7b measures two prefixes: zzrare:* (prefix of the rare 8-character token) and alpha:* (about one row in three). The plan summary appends JIT total time when JIT ran.",
    "Update writes rebuild the record's search text from the stored searchable fields with the changed values applied. Search maintenance is part of the write, not a constant placeholder.",
  ];
  for (const row of report.timings) {
    if (row.scenario === "S1" && row.plan.includes("Seq Scan")) {
      notes.push(`${row.option} ${row.stage} S1 used a sequential scan (${row.plan}).`);
    }
    if (
      row.option === "A" &&
      row.stage === "A2" &&
      A2_EQUALITY.has(row.scenario) &&
      row.plan.includes("a_data_gin") &&
      !row.plan.includes("a_x_")
    ) {
      notes.push(
        `A2 ${row.scenario} used the jsonb GIN index and not an expression index (${row.plan}).`,
      );
    }
    if (row.medianMs > 0 && row.p95Ms > row.medianMs * 8 && row.p95Ms > 20) {
      notes.push(
        `${row.option} ${row.stage} ${row.scenario} p95 is ${row.p95Ms.toFixed(1)} ms versus median ${row.medianMs.toFixed(1)} ms.`,
      );
    }
  }
  for (const [option, stage] of [
    ["A", "A2"],
    ["B", "B1"],
    ["A", "rls-on"],
    ["B", "rls-on"],
  ] as const) {
    const at = (scenario: string) =>
      report.timings.find(
        (row) => row.scenario === scenario && row.option === option && row.stage === stage,
      );
    const first = at("S2");
    const keyset = at("S2-KEYSET");
    const offset = at("S2-OFFSET");
    if (!first || !keyset) continue;
    const slowerThanOffset = offset !== undefined && keyset.medianMs > offset.medianMs * 1.25;
    const heavierThanFirst = keyset.buffers > Math.max(500, first.buffers * 1.5);
    if (slowerThanOffset || heavierThanFirst) {
      const offsetText = offset
        ? `; offset 5000 ${offset.medianMs.toFixed(1)} ms / ${offset.buffers} buffers`
        : "";
      notes.push(
        `S2 keyset on ${option} ${stage} took ${keyset.medianMs.toFixed(1)} ms and ${keyset.buffers} buffers (first page ${first.medianMs.toFixed(1)} ms / ${first.buffers} buffers${offsetText}). Plan: ${keyset.plan}.`,
      );
    }
  }
  const s4a = report.timings.find(
    (row) => row.scenario === "S4" && row.option === "A" && row.stage === "A2",
  );
  const s4b = report.timings.find(
    (row) => row.scenario === "S4" && row.option === "B" && row.stage === "B1",
  );
  if (s4a && s4b && s4a.medianMs > s4b.medianMs * 5) {
    notes.push(
      `S4 on A2 used ${s4a.plan} (${s4a.medianMs.toFixed(1)} ms, ${s4a.buffers} buffers) while B1 used ${s4b.plan} (${s4b.medianMs.toFixed(1)} ms, ${s4b.buffers} buffers). Both filters are boolean equality with last_name order. The expression-index plan walks the low-selectivity boolean index; the typed plan walks last_name and stops after 50 rows.`,
    );
  }
  const missedTsv = report.timings.filter(
    (row) => row.scenario.startsWith("S7b") && row.stage === "tsv" && !row.plan.includes("_tsv"),
  );
  if (missedTsv.length > 0) {
    const listed = missedTsv
      .map(
        (row) => `${row.option} ${row.scenario} median ${row.medianMs.toFixed(1)} ms (${row.plan})`,
      )
      .join("; ");
    notes.push(
      `S7b did not use the tsvector GIN for: ${listed}. A common prefix matches about one row in three, so the planner can walk updated_at instead. A and B heap tuples are wider than C's header row, so the same plan costs more there. JIT time is in the plan summary when JIT ran.`,
    );
  }
  for (const scenario of ["S9 insert", "S9 update1", "S9 update5"]) {
    const a0 = walOf(report, scenario, "A", "A0");
    const a1 = walOf(report, scenario, "A", "A1");
    const a2 = walOf(report, scenario, "A", "A2");
    if (
      a0 !== undefined &&
      a1 !== undefined &&
      a2 !== undefined &&
      (walInverted(a0, a1) || walInverted(a1, a2))
    ) {
      notes.push(
        `WAL per operation is not monotone for ${scenario} on A: A0 ${a0.toFixed(0)}, A1 ${a1.toFixed(0)}, A2 ${a2.toFixed(0)}. Full-page writes after a checkpoint still depend on which heap and index pages the batch touches first.`,
      );
    }
    const b0 = walOf(report, scenario, "B", "B0");
    const b1 = walOf(report, scenario, "B", "B1");
    if (b0 !== undefined && b1 !== undefined && walInverted(b0, b1)) {
      notes.push(
        `WAL per operation is not monotone for ${scenario} on B: B0 ${b0.toFixed(0)}, B1 ${b1.toFixed(0)}. Full-page writes after a checkpoint still depend on which heap and index pages the batch touches first.`,
      );
    }
  }
  for (const check of report.checks) {
    if (!check.pass)
      notes.push(`RLS check failed: ${check.option} ${check.name} (${check.detail}).`);
  }
  return notes;
}
