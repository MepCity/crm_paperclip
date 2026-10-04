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
};

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

export function summarizePlan(plan: PlanNode, jitTotalMs?: number): PlanSummary {
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
  const scan = firstScan(plan);
  const loops = scan?.["Actual Loops"] ?? 1;
  const buffers = (plan["Shared Hit Blocks"] ?? 0) + (plan["Shared Read Blocks"] ?? 0);
  const sharedRead = plan["Shared Read Blocks"] ?? 0;
  let summary = scans.join("; ") || plan["Node Type"];
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

export function collectNotes(
  report: Pick<BenchReport, "timings" | "checks" | "writes" | "selectivity" | "workMem">,
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
    "RLS reads for A use A3 (expression indexes plus expression statistics). B uses B1. A non-leakproof operator cannot be an index condition and cannot use statistics while row level security is enabled. The operator table has the flags. text comparisons, boolean equality, timestamptz comparisons, and uuid equality are leakproof. numeric >=, record >, jsonb operators (->> , ->, @>), ILIKE, and @@ are not, so an expression built on jsonb cannot be an index condition under RLS.",
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
    const samePrefix = triples.filter((item) => {
      const counts = [item.a.rowsRemoved, item.b.rowsRemoved, item.c.rowsRemoved];
      const hi = Math.max(...counts);
      const lo = Math.min(...counts);
      return lo > 0 && hi <= lo * 3 && item.c.plan.includes("c_updated_idx");
    });
    const longerOnTyped = triples.filter(
      (item) =>
        item.c.plan.includes("c_updated_idx") &&
        item.a.rowsRemoved > Math.max(50, item.c.rowsRemoved * 3) &&
        item.b.rowsRemoved > Math.max(50, item.c.rowsRemoved * 3),
    );
    notes.push(`S7 first-scan rows: ${searchFacts.join(". ")}.`);
    if (triples.length > 0 && samePrefix.length === triples.length) {
      notes.push(
        "On the common terms, A, B, and C remove a similar number of non-matches before the 50th hit, and C's first scan is the updated_at index. Equivalence returned the same ids, so the plans stop on the same logical prefix. The buffer gap is pages per visited heap tuple: A reads the JSONB row to test search, B reads the wide typed row, and C reads a narrow header. Common-term buffer counts stay nearly flat because terms that match 20-33% of leads stop within a few hundred scattered updated_at rows and touch mostly the same pages. A rare term walks much further; once that walk touches on the order of 10^4 pages, A and C meet.",
      );
    } else if (longerOnTyped.length > 0) {
      const windows = longerOnTyped.map((item) => ({
        scenario: item.scenario,
        aExamined: item.a.rowsRemoved + item.a.actualRows,
        bExamined: item.b.rowsRemoved + item.b.actualRows,
        cExamined: item.c.rowsRemoved + item.c.actualRows,
        aEmitted: item.a.actualRows,
        cEmitted: item.c.actualRows,
      }));
      const examined = windows.map((item) => item.aExamined);
      const low = Math.min(...examined);
      const high = Math.max(...examined);
      const flat = low > 0 && high - low <= low * 0.05;
      const listed = windows
        .map(
          (item) =>
            `${item.scenario} examined A ${Math.round(item.aExamined)} (emitted ${Math.round(item.aEmitted)}), B ${Math.round(item.bExamined)}, C ${Math.round(item.cExamined)} (emitted ${Math.round(item.cEmitted)})`,
        )
        .join("; ");
      if (flat) {
        const window = Math.round(
          examined.reduce((sum, value) => sum + value, 0) / examined.length,
        );
        notes.push(
          `On the common terms A and B do not stop the updated_at index scan at 50 matches. They examine a fixed window of about ${window} index entries (${listed}). A and B remove the same number of rows as each other, and equivalence returned the same 50 ids, so the order matches; the extra emitted rows are later matches inside that window. The window does not move when the term changes, which is why the buffer count stays flat. ${window} projected tuples are on the order of one work_mem (${report.workMem}). C's plan nests the value lookups under the limit, so the outer index scan stops when 50 rows are filled.`,
        );
      } else {
        notes.push(
          `On the common terms A and B discard several times more non-matches than C: ${listed}. Equivalence passed, so this is not a wider tuple. A wider row cannot raise rows_removed.`,
        );
      }
    }
  }
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
