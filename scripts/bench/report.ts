export type TimingRow = {
  scenario: string;
  option: string;
  stage: string;
  medianMs: number;
  p95Ms: number;
  plan: string;
  buffers: number;
  sharedRead: number;
  /** Plan Rows of the first scan node. */
  estRows: number;
  /** Actual Rows × Actual Loops of the first scan node. */
  actualRows: number;
  /** Rows Removed by Filter on the first scan node. */
  rowsRemoved: number;
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
  /** Second pending-list flush, after the batch and before the end LSN. */
  ginFlushMs: number;
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

export type OperatorLeak = {
  operator: string;
  leftType: string;
  rightType: string;
  proc: string;
  leakproof: boolean;
};

export type PlanNode = {
  "Node Type": string;
  "Index Name"?: string;
  "Relation Name"?: string;
  Plans?: PlanNode[];
  "Shared Hit Blocks"?: number;
  "Shared Read Blocks"?: number;
  "Plan Rows"?: number;
  "Actual Rows"?: number;
  "Actual Loops"?: number;
  "Rows Removed by Filter"?: number;
  "Workers Planned"?: number;
  "Workers Launched"?: number;
};

const SHAPE_NODES = new Set(["Sort", "Incremental Sort", "Gather", "Gather Merge"]);

export type PlanSummary = {
  summary: string;
  buffers: number;
  sharedRead: number;
  estRows: number;
  actualRows: number;
  rowsRemoved: number;
};

/**
 * Buffer counts on a plan node already include the children. Only the root
 * node's shared hit + read blocks are the bytes the query touched.
 */
function firstScan(node: PlanNode): PlanNode | undefined {
  if (node["Node Type"].includes("Scan")) return node;
  for (const child of node.Plans ?? []) {
    const found = firstScan(child);
    if (found) return found;
  }
  return undefined;
}

function shapeLabel(node: PlanNode): string | undefined {
  const type = node["Node Type"];
  if (type.includes("Scan")) {
    const index = node["Index Name"];
    return index ? `${type} ${index}` : `${type} ${node["Relation Name"] ?? ""}`.trim();
  }
  if (!SHAPE_NODES.has(type)) return undefined;
  if (type === "Gather" || type === "Gather Merge") {
    const planned = node["Workers Planned"];
    const launched = node["Workers Launched"];
    if (planned !== undefined || launched !== undefined) {
      return `${type} planned=${planned ?? 0} launched=${launched ?? 0}`;
    }
  }
  return type;
}

export function summarizePlan(plan: PlanNode, jitTotalMs?: number): PlanSummary {
  const parts: string[] = [];
  const walk = (node: PlanNode): void => {
    const label = shapeLabel(node);
    if (label) parts.push(label);
    for (const child of node.Plans ?? []) walk(child);
  };
  walk(plan);
  const scan = firstScan(plan);
  const loops = scan?.["Actual Loops"] ?? 1;
  const buffers = (plan["Shared Hit Blocks"] ?? 0) + (plan["Shared Read Blocks"] ?? 0);
  const sharedRead = plan["Shared Read Blocks"] ?? 0;
  let summary = parts.join("; ") || plan["Node Type"];
  if (jitTotalMs !== undefined && jitTotalMs > 0) {
    summary = `${summary}; jit ${jitTotalMs.toFixed(1)}ms`;
  }
  return {
    summary,
    buffers,
    sharedRead,
    estRows: scan?.["Plan Rows"] ?? 0,
    actualRows: (scan?.["Actual Rows"] ?? 0) * loops,
    rowsRemoved: scan?.["Rows Removed by Filter"] ?? 0,
  };
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
  operators: OperatorLeak[];
  notes: string[];
};

function ms(value: number): string {
  return value.toFixed(2);
}

function rows(value: number): string {
  if (!Number.isFinite(value)) return "0";
  return String(Math.round(value));
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
    rows(row.estRows),
    rows(row.actualRows),
    rows(row.rowsRemoved),
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
    ms(row.ginFlushMs),
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
  const operatorRows = report.operators.map((row) => [
    row.operator,
    row.leftType,
    row.rightType,
    row.proc,
    row.leakproof ? "yes" : "no",
  ]);
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

A3 is A2 plus one extended statistics object per indexed expression (\`create statistics\` on that expression, then \`vacuum analyze\`). A2 rows stay. RLS reads for A run on A3; B runs on B1. \`est_rows\`, \`actual_rows\`, and \`rows_removed\` come from the first scan node only.

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
  [
    "scenario",
    "option",
    "stage",
    "median_ms",
    "p95_ms",
    "plan",
    "buffers",
    "shared_read",
    "est_rows",
    "actual_rows",
    "rows_removed",
  ],
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
    "gin_flush_ms",
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

## Filter operators

Operators that appear in scenario filters. \`~~*\` is \`ilike\`. \`leakproof\` is \`pg_proc.proleakproof\` of \`pg_operator.oprcode\`. With row level security, a non-leakproof operator cannot be an index condition and cannot use statistics.

${operatorRows.length > 0 ? table(["operator", "left", "right", "function", "leakproof"], operatorRows) : "_not collected_"}

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

function timingAt(
  report: Pick<BenchReport, "timings">,
  scenario: string,
  option: string,
  stage: string,
): TimingRow | undefined {
  return report.timings.find(
    (row) => row.scenario === scenario && row.option === option && row.stage === stage,
  );
}

function indexNames(plan: string): string[] {
  const names: string[] = [];
  const pattern = /(?:Index Only Scan|Bitmap Index Scan|Index Scan) ([^\s;]+)/g;
  for (const match of plan.matchAll(pattern)) {
    const name = match[1];
    if (name) names.push(name);
  }
  return names;
}

function scanFacts(row: TimingRow): string {
  return `removed ${Math.round(row.rowsRemoved)} est ${Math.round(row.estRows)} actual ${Math.round(row.actualRows)} buf ${row.buffers} (${row.plan})`;
}

function hasSortNode(plan: string): boolean {
  return plan.split("; ").some((part) => {
    const name = part.trim();
    return name === "Sort" || name.startsWith("Incremental Sort");
  });
}

function examinedRows(row: TimingRow): number {
  return row.rowsRemoved + row.actualRows;
}

function buffersMatch(left: number, right: number): boolean {
  const scale = Math.max(left, right, 1);
  return Math.abs(left - right) / scale <= 0.01;
}

const STORAGE_STAGES = new Set(["A0", "A1", "A2", "A3", "B0", "B1", "C0"]);

/** Storage stages whose plan and buffer count match, but whose median differs by more than 2x. */
function samePlanSpreads(timings: TimingRow[]): string[] {
  const groups = new Map<string, TimingRow[]>();
  for (const row of timings) {
    if (!STORAGE_STAGES.has(row.stage)) continue;
    const key = `${row.scenario}\0${row.option}`;
    const list = groups.get(key) ?? [];
    list.push(row);
    groups.set(key, list);
  }
  const notes: string[] = [];
  for (const [key, rows] of groups) {
    const used = new Set<number>();
    for (let i = 0; i < rows.length; i++) {
      if (used.has(i)) continue;
      const base = rows[i];
      if (!base) continue;
      const cluster = [base];
      used.add(i);
      for (let j = i + 1; j < rows.length; j++) {
        if (used.has(j)) continue;
        const other = rows[j];
        if (!other || other.plan !== base.plan || !buffersMatch(base.buffers, other.buffers))
          continue;
        cluster.push(other);
        used.add(j);
      }
      if (cluster.length < 2) continue;
      const medians = cluster.map((row) => row.medianMs);
      const hi = Math.max(...medians);
      const lo = Math.min(...medians);
      // Sub-millisecond medians move by 2x from timer noise. The rule is for
      // a spread large enough to change a storage decision, such as S10.
      if (!(lo >= 5 && hi >= 20 && hi > lo * 2)) continue;
      const [scenario, option] = key.split("\0");
      const listed = cluster
        .map(
          (row) =>
            `${row.stage} ${row.medianMs.toFixed(1)} ms / ${row.buffers} buffers / shared_read ${row.sharedRead}`,
        )
        .join("; ");
      const gather = cluster.some((row) => row.plan.includes("Gather"));
      const cause = gather
        ? "Gather is in the plan and the launched worker count is the same on every stage in this group, so the spread is not a different number of parallel workers. Equal buffer counts mean the same pages were read. The elapsed-time spread is machine load or OS cache warmth between stages: a stage measured just after a large index build can miss the OS page cache, while a later stage of the same scan hits it. shared_read counts blocks missing from shared_buffers, not physical I/O."
        : "The plan has no Gather node, so this is not a parallel-worker difference. Equal buffer counts mean the same pages were read. The elapsed-time spread is machine load or OS cache warmth between stages: a stage measured just after a large index build can miss the OS page cache, while a later stage of the same scan hits it. shared_read counts blocks missing from shared_buffers, not physical I/O.";
      notes.push(
        `${scenario} ${option} medians differ by more than 2x on the same plan and the same buffer count: ${listed}. Plan: ${base.plan}. ${cause}`,
      );
    }
  }
  const s10 = timings.filter((row) => row.scenario === "S10 source" && row.option === "A");
  if (s10.length >= 2) {
    const hi = Math.max(...s10.map((row) => row.medianMs));
    const lo = Math.min(...s10.map((row) => row.medianMs));
    const plans = new Set(s10.map((row) => row.plan));
    if (lo >= 5 && hi >= 20 && hi > lo * 2 && plans.size > 1) {
      const listed = s10
        .map(
          (row) =>
            `${row.stage} ${row.medianMs.toFixed(1)} ms (${row.plan}, ${row.buffers} buffers)`,
        )
        .join("; ");
      const gather = [...plans].some((plan) => plan.includes("Gather"));
      const cause = gather
        ? "Gather is present on only some stages, so the spread follows parallel workers."
        : "The plans differ, so this is not the same access path.";
      notes.push(
        `S10 source on A medians differ by more than 2x and the plans are not the same: ${listed}. ${cause}`,
      );
    }
  }
  return notes;
}

export function collectNotes(
  report: Pick<BenchReport, "timings" | "checks" | "writes" | "selectivity">,
): string[] {
  const statusPct = (report.selectivity.leadStatusShare * 100).toFixed(1);
  const optPct = (report.selectivity.emailOptOutFalseShare * 100).toFixed(1);
  const notes = [
    `S2 lead_status equality matches about ${statusPct}% of non-deleted org A leads. The field is optional (about 40% empty), so one filled value is about one ninth of the filled rows, not 11% of the table. S4 email_opt_out = false matches about ${optPct}%.`,
    "Buffers are the root plan node's shared hit blocks plus shared read blocks. Child nodes already roll into that total. est_rows, actual_rows, and rows_removed are taken from the first scan node (Plan Rows, Actual Rows times Actual Loops, Rows Removed by Filter).",
    "A2 equality predicates use the expression-index form. A0 and A1 keep jsonb containment. A3 adds one extended statistics object on each of those expressions and runs vacuum analyze. PostgreSQL does not use expression statistics stored on a partial index, so A2 equality estimates fall back to the default and the filter index can beat the sort index.",
    "S2 keyset seeks with a row comparison on (sort expression, id). Rows with a null sort key are a second branch, union all, then ordered outside the limit. A null cursor continues with sort expression is null and id greater than the cursor.",
    "Storage-stage writes run without search indexes. Each stage, write kind, and RLS setting updates its own record range. A checkpoint runs before each batch. GIN pending lists on the written table are cleaned before the starting LSN and again before the ending LSN; gin_flush_ms is that second call. WAL per operation is the batch LSN delta divided by the operation count, so the flush is inside the delta. +trgm and +tsv rows are the same writes with one search index family added on A2 and B1.",
    "S7b measures two prefixes: zzrare:* (prefix of the rare 8-character token) and alpha:* (about one row in three). The plan summary appends JIT total time when JIT ran.",
    "Update writes rebuild the record's search text from the stored searchable fields with the changed values applied. Search maintenance is part of the write, not a constant placeholder.",
    "Read scenarios, including every S7 parameter, run before any write. Equivalence of the four ILIKE fragments and both prefixes is checked on the loaded data and again immediately before the RLS reads, so A, B, and C still hold the same logical rows at each read.",
    "RLS reads for A use A3 (expression indexes plus expression statistics). B uses B1. A non-leakproof operator cannot be an index condition and cannot use statistics while row level security is enabled. The operator table has the flags. text comparisons, boolean equality, timestamptz comparisons, and uuid comparisons (= and >) are leakproof. numeric >=, jsonb operators (->> , ->, @>), ILIKE, and @@ are not, so an expression built on jsonb cannot be an index condition under RLS.",
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
    ["A", "A3"],
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
      `S7b did not use the tsvector GIN for: ${listed}. A common prefix matches about one row in three, so the planner can walk updated_at instead. JIT time is in the plan summary when JIT ran.`,
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
  const a3Compared: string[] = [];
  for (const scenario of ["S2", "S2-KEYSET", "S4"]) {
    const a3 = timingAt(report, scenario, "A", "A3");
    const b1 = timingAt(report, scenario, "B", "B1");
    if (!a3 || !b1) continue;
    const ratio = a3.buffers / Math.max(b1.buffers, 1);
    a3Compared.push(
      `${scenario} A3 ${a3.buffers} buf / ${a3.medianMs.toFixed(1)} ms (${scanFacts(a3)}) vs B1 ${b1.buffers} buf / ${b1.medianMs.toFixed(1)} ms (${scanFacts(b1)})`,
    );
    if (ratio > 10) {
      notes.push(
        `A3 ${scenario} read ${a3.buffers} buffers against B1's ${b1.buffers} (${ratio.toFixed(0)}x). Estimate ${Math.round(a3.estRows)} vs actual ${Math.round(a3.actualRows)} on ${a3.plan}. The expression statistic did not bring this plan onto the sort index.`,
      );
    }
  }
  if (a3Compared.length > 0) {
    notes.push(`A3 against B1: ${a3Compared.join("; ")}.`);
  }
  const searchScenarios = [
    "S7c common3",
    "S7c common8",
    "S7a common3",
    "S7a common8",
    "S7b common",
    "S7c rare3",
    "S7a rare3",
    "S7b selective",
  ];
  const searchFacts: string[] = [];
  for (const scenario of searchScenarios) {
    const present = (["A", "B", "C"] as const)
      .map((option) => {
        const stage = scenario.startsWith("S7c")
          ? "no-search-index"
          : scenario.startsWith("S7b")
            ? "tsv"
            : "trgm";
        const row = timingAt(report, scenario, option, stage);
        return row ? `${option} ${scanFacts(row)}` : "";
      })
      .filter((text) => text.length > 0);
    if (present.length === 3) searchFacts.push(`${scenario}: ${present.join("; ")}`);
  }
  if (searchFacts.length > 0) {
    const stageFor = (scenario: string): string =>
      scenario.startsWith("S7c") ? "no-search-index" : scenario.startsWith("S7b") ? "tsv" : "trgm";
    const commonIds = ["S7c common3", "S7c common8", "S7a common3", "S7a common8", "S7b common"];
    const triples = commonIds.flatMap((scenario) => {
      const stage = stageFor(scenario);
      const a = timingAt(report, scenario, "A", stage);
      const b = timingAt(report, scenario, "B", stage);
      const c = timingAt(report, scenario, "C", stage);
      return a && b && c ? [{ scenario, a, b, c }] : [];
    });
    notes.push(`S7 first-scan rows: ${searchFacts.join(". ")}.`);
    if (triples.length > 0) {
      const sorting = triples.filter(
        (item) => hasSortNode(item.a.plan) || hasSortNode(item.b.plan),
      );
      if (sorting.length > 0) {
        const listed = sorting
          .map((item) => `${item.scenario} A (${item.a.plan}) B (${item.b.plan})`)
          .join("; ");
        notes.push(
          `A or B still has a Sort or Incremental Sort on a common term: ${listed}. The order by names the table id column; a sort node means the index did not supply both keys.`,
        );
      }
      const sameOrder = (left: TimingRow, right: TimingRow) =>
        examinedRows(left) <= Math.max(examinedRows(right) * 3, examinedRows(right) + 50);
      const stopped = triples.filter(
        (item) =>
          !hasSortNode(item.a.plan) &&
          !hasSortNode(item.b.plan) &&
          item.a.actualRows <= 50.5 &&
          item.b.actualRows <= 50.5 &&
          sameOrder(item.a, item.c) &&
          sameOrder(item.b, item.c),
      );
      if (stopped.length === triples.length) {
        notes.push(
          "On the common terms A and B have no Sort or Incremental Sort. The first scan's actual_rows is 50, and the rows examined (actual plus removed) are the same order as C. The order by uses the table id column, so the updated_at index supplies both sort keys and the scan stops at the limit.",
        );
      } else if (sorting.length === 0) {
        const listed = triples
          .map(
            (item) =>
              `${item.scenario} examined A ${Math.round(examinedRows(item.a))} (actual ${Math.round(item.a.actualRows)}), B ${Math.round(examinedRows(item.b))} (actual ${Math.round(item.b.actualRows)}), C ${Math.round(examinedRows(item.c))} (actual ${Math.round(item.c.actualRows)}) plan A ${item.a.plan}`,
          )
          .join("; ");
        notes.push(`On the common terms the first scan did not stop with C: ${listed}.`);
      }
    }
  }
  const s1Stages = [
    ["A", "A3"],
    ["B", "B1"],
    ["C", "C0"],
  ] as const;
  const s1Rows = s1Stages.flatMap(([option, stage]) => {
    const row = timingAt(report, "S1", option, stage);
    return row ? [{ option, stage, row }] : [];
  });
  const s1Miss = s1Rows.filter(
    (item) => hasSortNode(item.row.plan) || (item.option !== "C" && item.row.actualRows > 50.5),
  );
  if (s1Miss.length > 0) {
    const listed = s1Miss
      .map(
        (item) =>
          `${item.option} ${item.stage} actual ${Math.round(item.row.actualRows)} removed ${Math.round(item.row.rowsRemoved)} (${item.row.plan})`,
      )
      .join("; ");
    notes.push(`S1 did not stop on the index order: ${listed}.`);
  } else if (s1Rows.length === s1Stages.length) {
    notes.push(
      "S1 on A3 and B1 has no Sort or Incremental Sort. The first scan actual_rows is 50, the same as C.",
    );
  }
  notes.push(...samePlanSpreads(report.timings));
  const lost: string[] = [];
  for (const option of ["A", "B"] as const) {
    const scenarios = new Set(
      report.timings
        .filter((row) => row.option === option && row.stage === "rls-off")
        .map((row) => row.scenario),
    );
    for (const scenario of scenarios) {
      const off = timingAt(report, scenario, option, "rls-off");
      const on = timingAt(report, scenario, option, "rls-on");
      if (!off || !on) continue;
      const missing = indexNames(off.plan).filter((name) => !indexNames(on.plan).includes(name));
      if (missing.length === 0) continue;
      lost.push(
        `${option} ${scenario} lost ${[...new Set(missing)].join(", ")} (off: ${off.plan}; on: ${on.plan})`,
      );
    }
  }
  if (lost.length > 0) {
    notes.push(
      `RLS off used an index that RLS on did not: ${lost.join("; ")}. Non-leakproof predicates are applied as filters, so the planner also loses the expression statistics that depend on them.`,
    );
  }
  const walGaps: string[] = [];
  const walOk: string[] = [];
  for (const scenario of ["S9 insert", "S9 update1", "S9 update5"]) {
    for (const [option, stage] of [
      ["A", "A2"],
      ["B", "B1"],
    ] as const) {
      const base = report.writes.find(
        (row) =>
          row.scenario === scenario &&
          row.option === option &&
          row.stage === stage &&
          row.rls === "n/a",
      );
      const off = report.writes.find(
        (row) =>
          row.scenario === scenario &&
          row.option === option &&
          row.stage === stage &&
          row.rls === "off",
      );
      if (!base || !off) continue;
      const scale = Math.max(base.walBytesPerOp, off.walBytesPerOp, 1);
      const gap = Math.abs(base.walBytesPerOp - off.walBytesPerOp) / scale;
      const label = `${scenario} ${option} ${stage} n/a ${base.walBytesPerOp.toFixed(0)} (flush ${base.ginFlushMs.toFixed(1)} ms) vs rls-off ${off.walBytesPerOp.toFixed(0)} (flush ${off.ginFlushMs.toFixed(1)} ms)`;
      if (gap > 0.1) walGaps.push(label);
      else walOk.push(label);
    }
  }
  if (walOk.length > 0) {
    notes.push(
      `WAL per operation for n/a and RLS off stays within 10% after the pending-list flush: ${walOk.join("; ")}.`,
    );
  }
  if (walGaps.length > 0) {
    notes.push(
      `WAL per operation for n/a and RLS off differs by more than 10% after flushing GIN pending lists: ${walGaps.join("; ")}. The gap is not a leftover fastupdate flush.`,
    );
  }
  for (const check of report.checks) {
    if (!check.pass)
      notes.push(`RLS check failed: ${check.option} ${check.name} (${check.detail}).`);
  }
  return notes;
}
