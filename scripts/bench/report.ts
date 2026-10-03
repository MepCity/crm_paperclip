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

Storage C keeps the same system indexes as A0 on the record header, plus the value indexes named in the scenario. Search indexes (trigram and \`simple\` tsvector) are identical on every option and stay in place for the write scenarios.

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

export function collectNotes(report: Pick<BenchReport, "timings" | "checks">): string[] {
  const notes: string[] = [];
  for (const row of report.timings) {
    if (row.scenario === "S1" && row.plan.includes("Seq Scan")) {
      notes.push(`${row.option} ${row.stage} S1 used a sequential scan (${row.plan}).`);
    }
    if (row.medianMs > 0 && row.p95Ms > row.medianMs * 8 && row.p95Ms > 20) {
      notes.push(
        `${row.option} ${row.stage} ${row.scenario} p95 is ${row.p95Ms.toFixed(1)} ms versus median ${row.medianMs.toFixed(1)} ms.`,
      );
    }
  }
  for (const check of report.checks) {
    if (!check.pass)
      notes.push(`RLS check failed: ${check.option} ${check.name} (${check.detail}).`);
  }
  return notes;
}
