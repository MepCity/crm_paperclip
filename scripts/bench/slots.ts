import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { cpus, tmpdir, totalmem } from "node:os";
import { join } from "node:path";
import { ensureDatabase, startLocalPostgres } from "@crm/db/local-postgres";
import pg from "pg";
import { scaleCounts, universe } from "./dataset";
import { assertSame } from "./exec";
import { mapFullA, mapFullB, type Query } from "./queries";
import {
  type BenchReport,
  type PlanNode,
  percentile,
  summarizePlan,
  type TimingRow,
} from "./report";
import { type BenchArgs, measureWrites, resolveProtocol } from "./run";
import { SLOT_COLUMNS, slotIndexes } from "./slot-layout";
import {
  loadedParams,
  paramsForScenario,
  SLOT_SCENARIOS,
  type SlotScenario,
  scenarioQuery,
} from "./slot-queries";
import {
  applyStatements,
  configureClient,
  createATable,
  createTables,
  deleteInserted,
  filterOperators,
  generateAndLoad,
  installRls,
  relationSizes,
  roleUrl,
  serverInfo,
  setRls,
  stageStatements,
  vacuumAnalyze,
  verifyRls,
} from "./storage";

export type SlotPlan = PlanNode & { "Index Cond"?: string; Filter?: string; Plans?: SlotPlan[] };
export type SlotEvidence = TimingRow & {
  rls: "off" | "on";
  attempt: number;
  stats: string;
  indexCond: boolean;
  conditions: string[];
  estimateRatio: number;
  slotFilters: string[];
};
export type SlotsReport = BenchReport & {
  evidence: SlotEvidence[];
  outcome: string;
  complete: boolean;
};

export function inspectSlots(plan: SlotPlan): {
  indexCond: boolean;
  conditions: string[];
  slotFilters: string[];
} {
  const conditions: string[] = [];
  const filters = new Set<string>();
  const walk = (node: SlotPlan) => {
    const cond = node["Index Cond"] ?? "";
    if (node["Index Name"]?.startsWith("a_slot_") && /ix_(text|num|time|ref)_\d/.test(cond)) {
      // Retain structure, never serialize bound values or organization identifiers.
      conditions.push(`${node["Index Name"]}: ${cond.replace(/'[^']*'/g, "'?' ")}`);
    }
    for (const slot of SLOT_COLUMNS) {
      if (new RegExp(`\\b${slot.name}\\b\\s*(?:=|>=|<|>)`).test(`${cond} ${node.Filter ?? ""}`))
        filters.add(slot.name);
    }
    for (const child of node.Plans ?? []) walk(child);
  };
  walk(plan);
  return { indexCond: conditions.length > 0, conditions, slotFilters: [...filters] };
}

export function samePlanNoise(off: SlotEvidence, on: SlotEvidence): boolean {
  return (
    off.plan === on.plan &&
    off.buffers === on.buffers &&
    Math.max(off.medianMs, on.medianMs) > 2 * Math.min(off.medianMs, on.medianMs)
  );
}

export async function runSlotsBench(
  args: BenchArgs,
  progress: (s: string) => void = () => undefined,
): Promise<SlotsReport> {
  const protocol = resolveProtocol(args);
  if (protocol.rows < 200 || protocol.measure < 1 || protocol.writes < 1)
    throw new Error("slot protocol needs rows >= 200, measure >= 1, writes >= 1");
  const dir = await mkdtemp(
    join(process.env.PAPERCLIP_RUN_SCRATCH_DIR ?? tmpdir(), "crm-slot-bench-"),
  );
  let server: Awaited<ReturnType<typeof startLocalPostgres>> | undefined;
  let admin: pg.Client | undefined;
  let app: pg.Client | undefined;
  try {
    server = await startLocalPostgres({ dataDir: dir });
    await ensureDatabase(server.urlFor("postgres"), "slots");
    const db = new pg.Client({ connectionString: server.urlFor("slots") });
    admin = db;
    await db.connect();
    await configureClient(db);
    const info = await serverInfo(db);
    const report: SlotsReport = {
      version: info.version.split(",")[0] ?? info.version,
      sharedBuffers: info.sharedBuffers,
      workMem: info.workMem,
      jit: info.jit,
      cpus: cpus().length,
      memoryBytes: totalmem(),
      rows: protocol.rows,
      seed: protocol.seed,
      warmup: protocol.warmup,
      measuredRuns: protocol.measure,
      writesPerKind: protocol.writes,
      fullScale: protocol.full,
      timings: [],
      writes: [],
      sizes: [],
      loads: [],
      checks: [],
      alter: null,
      selectivity: { leadStatusShare: 0, emailOptOutFalseShare: 0 },
      operators: await filterOperators(db),
      notes: [
        "C and S7 are skipped. A3 and B1 retain their original data types, indexes and SQL shapes. A4 is reloaded from the same seed into records with slots; A4n is reloaded before its measurements. No reference CRM access is required.",
        "Text expression indexes and slots both use und-x-icu. Slot values are written with data in the same COPY/INSERT/UPDATE statement. Unassigned slots are NULL. Contacts map last_name/company/email to text slots 1/2/3; statistics mix both modules.",
        "All RLS off/on reads use bench_app, begin + local organization setting + query + commit; role and policy match S12. Each off sample batch is immediately followed by the on batch. Client medians include transaction setup. Plans use the first parameter set; timings rotate loaded parameter sets.",
        "est_rows is first scan Plan Rows; actual_rows is Actual Rows × Actual Loops. The >10x check compares these reported row counts; stopped LIMIT scans can also trigger MCV, and the original result is retained. MCV remeasurements and noise retries retain original rows.",
        "A slot Index Cond means a_slot_* has a condition on a slot, including keyset comparisons; using a slot index only for ordering is no. S4 keeps its JSONB boolean filter. S8 still reads data by primary key.",
      ],
      evidence: [],
      outcome: "pending",
      complete: false,
    };
    const publish = async () => {
      if (args.outPath) await writeFile(args.outPath, renderSlotsMarkdown(report));
      if (args.jsonPath) await writeFile(args.jsonPath, JSON.stringify(report, null, 2));
    };
    progress("slots: loading A/B (C skipped)");
    await createTables(db);
    const options = { seed: protocol.seed, scale: scaleCounts(protocol.rows) };
    const loaded = await generateAndLoad(db, options, { skipC: true });
    report.loads.push(
      { phase: "generate A/B", ms: loaded.generateMs },
      { phase: "copy A", ms: loaded.copyMs.A },
      { phase: "copy B", ms: loaded.copyMs.B },
    );
    const world = universe(protocol.seed);
    const leadId = loaded.orgALeadIds[0];
    if (!leadId || loaded.orgALeadIds.length < protocol.writes * 2)
      throw new Error("not enough live write IDs");
    for (const stage of ["A0", "A1", "A2", "A3", "B0", "B1"] as const) {
      report.loads.push({
        phase: stage,
        ms: await applyStatements(db, stageStatements(stage, world.moduleLeads)),
      });
    }
    await vacuumAnalyze(db, ["bench_a.records", "bench_b.leads", "bench_b.contacts"]);
    const inputs = await loadedParams(db, world, Math.max(30, protocol.measure));
    await installRls(db);
    const session = new pg.Client({ connectionString: roleUrl(server.urlFor("slots")) });
    app = session;
    await session.connect();
    await configureClient(session);
    const baseline = new Map<string, unknown>();
    const canonical = (stage: string, scenario: SlotScenario, rows: Record<string, unknown>[]) => {
      if (scenario === "S8")
        return rows.map((row) => (stage === "B1" ? mapFullB(row) : mapFullA(row)));
      if (scenario.startsWith("S2 ")) return rows.map((row) => row.n);
      return rows.map((row) => row.id);
    };
    const querySets = (stage: string, scenario: SlotScenario): Query[] =>
      inputs.map((input, i) =>
        scenarioQuery(
          stage,
          scenario,
          paramsForScenario(input, scenario),
          loaded.orgALeadIds[i % loaded.orgALeadIds.length] ?? leadId,
        ),
      );
    const checkEquivalent = async (stage: string, scenarios: readonly SlotScenario[]) => {
      for (const scenario of scenarios) {
        for (const [i, query] of querySets(stage, scenario).entries()) {
          const result = await db.query(query.text, query.values);
          const value = canonical(stage, scenario, result.rows);
          const key = `${scenario}:${i}`;
          if (stage === "A3") baseline.set(key, value);
          else assertSame(`${stage} ${key}`, baseline.get(key), value);
          if (["S2", "S3", "S4", "S5", "S11", "S14"].includes(scenario) && !result.rows.length)
            throw new Error(`${stage} ${scenario} returned empty rows`);
        }
        report.checks.push({
          option: stage,
          name: `${scenario} equivalence/nonempty`,
          pass: true,
          detail: `${inputs.length} parameter sets; identity/order (count/full row for counts/S8)`,
        });
      }
    };
    const measure = async (
      stage: string,
      scenario: SlotScenario,
      on: boolean,
      attempt: number,
      stats: string,
    ): Promise<SlotEvidence> => {
      await setRls(db, on);
      const queries = querySets(stage, scenario);
      const first = queries[0];
      if (!first) throw new Error("missing query");
      const transact = async (query: Query, explain = false) => {
        await session.query("begin");
        try {
          await session.query("select set_config('app.org_id', $1, true)", [world.orgA]);
          const result = await session.query(
            `${explain ? "explain (analyze, buffers, format json) " : ""}${query.text}`,
            query.values,
          );
          await session.query("commit");
          return result;
        } catch (error) {
          await session.query("rollback");
          throw error;
        }
      };
      const explained = await transact(first, true);
      const plan = explained.rows[0]?.["QUERY PLAN"][0]?.Plan as SlotPlan;
      if (!plan) throw new Error("no plan");
      const samples: number[] = [];
      for (let i = 0; i < protocol.warmup + protocol.measure; i++) {
        const query = queries[i % queries.length];
        if (!query) throw new Error("missing query");
        const started = performance.now();
        await transact(query);
        if (i >= protocol.warmup) samples.push(performance.now() - started);
      }
      const summary = summarizePlan(plan);
      const estimated = Math.max(1, summary.estRows),
        actual = Math.max(1, summary.actualRows);
      const row: SlotEvidence = {
        scenario,
        option: stage === "B1" ? "B" : "A",
        stage,
        rls: on ? "on" : "off",
        attempt,
        stats,
        medianMs: percentile(samples, 0.5),
        p95Ms: percentile(samples, 0.95),
        plan: summary.summary,
        buffers: summary.buffers,
        sharedRead: summary.sharedRead,
        estRows: summary.estRows,
        actualRows: summary.actualRows,
        rowsRemoved: summary.rowsRemoved,
        ...inspectSlots(plan),
        estimateRatio: Math.max(estimated / actual, actual / estimated),
      };
      report.evidence.push(row);
      report.timings.push(row);
      return row;
    };
    const pair = async (stage: string, scenario: SlotScenario, stats = "none") => {
      let off = await measure(stage, scenario, false, 0, stats);
      let on = await measure(stage, scenario, true, 0, stats);
      for (let retry = 1; retry <= 2 && samePlanNoise(off, on); retry++) {
        report.notes.push(
          `${stage} ${scenario} stats=${stats}: same plan/buffers off ${off.medianMs.toFixed(2)} ms vs on ${on.medianMs.toFixed(2)} ms (>2x); retry ${retry}/2.`,
        );
        off = await measure(stage, scenario, false, retry, stats);
        on = await measure(stage, scenario, true, retry, stats);
      }
      if (samePlanNoise(off, on))
        report.notes.push(
          `${stage} ${scenario} stats=${stats}: >2x same-plan/buffer spread remains after 2 retries (${off.medianMs.toFixed(2)} / ${on.medianMs.toFixed(2)} ms).`,
        );
      return on;
    };
    const sizes = async (stage: string) => {
      const schema = stage === "B1" ? "bench_b" : "bench_a";
      for (const size of await relationSizes(db))
        if (size.schema === schema && size.name !== "events" && !size.name.startsWith("events_"))
          report.sizes.push({ stage, ...size });
    };
    const writes = async (stage: string) => {
      await setRls(db, true);
      const result = await measureWrites(
        session,
        db,
        stage === "B1" ? "B" : "A",
        stage,
        "on",
        protocol.writes,
        world,
        {
          update1: loaded.orgALeadIds.slice(0, protocol.writes),
          update5: loaded.orgALeadIds.slice(protocol.writes, protocol.writes * 2),
        },
        world.orgA,
        progress,
        stage.startsWith("A4"),
      );
      report.writes.push(...result.rows);
      await deleteInserted(db, stage === "B1" ? "B" : "A", result.inserted);
    };
    for (const stage of ["A3", "B1"]) {
      await checkEquivalent(stage, SLOT_SCENARIOS);
      for (const scenario of SLOT_SCENARIOS) {
        progress(`${stage} ${scenario}: RLS off/on`);
        await pair(stage, scenario);
      }
      await sizes(stage === "A3" ? "A2" : stage);
    }
    await writes("A2");
    await writes("B1");
    await publish();
    for (const stage of ["A4", "A4n"]) {
      progress(`${stage}: reload records with slots`);
      await db.query("drop table bench_a.records cascade");
      await db.query("truncate bench_a.events");
      await createATable(db, true);
      const reload = await generateAndLoad(db, options, { skipC: true, onlyA: true, slots: true });
      report.loads.push({ phase: `${stage} reload`, ms: reload.copyMs.A });
      await applyStatements(db, stageStatements("A0", world.moduleLeads));
      report.loads.push({
        phase: `${stage} indexes (20)`,
        ms: await applyStatements(db, slotIndexes(stage === "A4n")),
      });
      await vacuumAnalyze(db, ["bench_a.records"]);
      await installRls(db);
      const scenarios = stage === "A4n" ? (["S2", "S2-KEYSET"] as const) : SLOT_SCENARIOS;
      await checkEquivalent(stage, scenarios);
      const mcv = new Set<string>();
      for (const scenario of scenarios) {
        progress(`${stage} ${scenario}: RLS off/on`);
        const on = await pair(stage, scenario, [...mcv].join(",") || "none");
        if (stage === "A4" && on.estimateRatio > 10 && on.slotFilters.length) {
          const newSlots = on.slotFilters.filter((slot) => !mcv.has(slot));
          for (const slot of newSlots) {
            await db.query(
              `create statistics bench_a.a_mcv_${slot} (mcv) on module_id, ${slot} from bench_a.records`,
            );
            mcv.add(slot);
          }
          if (newSlots.length) {
            await db.query("analyze bench_a.records");
            report.notes.push(
              `${stage} ${scenario}: first-scan estimate/actual differs by ${on.estimateRatio.toFixed(1)}x; added MCV on module_id with ${newSlots.join(", ")}, ANALYZE, then repeated off/on. The before/after rows are retained.`,
            );
            await pair(stage, scenario, [...mcv].join(","));
          } else
            report.notes.push(
              `${stage} ${scenario}: estimate differs ${on.estimateRatio.toFixed(1)}x even with existing MCV ${[...mcv].join(", ")}; no further tuning.`,
            );
        }
        await publish();
      }
      await sizes(stage);
      const checks = await verifyRls(db, session, world, leadId);
      for (const check of checks) {
        if (!check.pass) throw new Error(`${stage} RLS: ${check.name}`);
        report.checks.push({ ...check, option: `${stage}/${check.option}` });
      }
      await writes(stage);
      await publish();
    }
    const final = (stage: string, scenario: string) =>
      report.evidence
        .filter((row) => row.stage === stage && row.scenario === scenario && row.rls === "on")
        .at(-1);
    const misses = ["S2-KEYSET", "S3", "S5", "S11", "S14", "S2 count"].flatMap((scenario) => {
      const a = final("A4", scenario),
        b = final("B1", scenario);
      return !a || !b
        ? [`${scenario}: missing`]
        : [
            ...(!a.indexCond ? [`${scenario}: no slot Index Cond`] : []),
            ...(a.medianMs > 2 * b.medianMs
              ? [`${scenario}: A4/B1 ${(a.medianMs / b.medianMs).toFixed(2)}x`]
              : []),
          ];
    });
    const insert = report.writes.find((row) => row.stage === "A4" && row.scenario === "S9 insert");
    if (!insert || insert.p95Ms >= 15) misses.push("A4 insert p95 >=15 ms");
    report.outcome = misses.length
      ? `Expectation NOT met: ${misses.join("; ")}. Storage decision belongs in ADR 0002; no solution is attempted.`
      : "Expectation met: the six specified A4 scenarios use a slot Index Cond, all on medians stay within 2x B1, and insert p95 is below 15 ms.";
    report.complete = true;
    await publish();
    progress(report.outcome);
    return report;
  } finally {
    await app?.end().catch(() => undefined);
    await admin?.end().catch(() => undefined);
    await server?.stop().catch(() => undefined);
    await rm(dir, { recursive: true, force: true });
  }
}

function table(headers: string[], rows: string[][]): string {
  return [
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map(
      (row) =>
        `| ${row.map((value) => value.replaceAll("|", "/").replaceAll("\n", " ")).join(" | ")} |`,
    ),
  ].join("\n");
}
const ms = (n: number) => n.toFixed(2);
export function renderSlotsMarkdown(report: SlotsReport): string {
  const latest = report.evidence.filter(
    (row) =>
      !report.evidence.some(
        (other) =>
          other !== row &&
          other.stage === row.stage &&
          other.scenario === row.scenario &&
          other.rls === row.rls &&
          report.evidence.indexOf(other) > report.evidence.indexOf(row),
      ),
  );
  const comparisons = SLOT_SCENARIOS.map((scenario) => {
    const fields: string[] = [scenario];
    for (const stage of ["A3", "A4", "B1"])
      for (const rls of ["off", "on"]) {
        const row = latest.find(
          (row) => row.stage === stage && row.scenario === scenario && row.rls === rls,
        );
        fields.push(row ? `${ms(row.medianMs)} / ${ms(row.p95Ms)}` : "pending");
      }
    fields.push(
      latest.find((row) => row.stage === "A4" && row.scenario === scenario && row.rls === "on")
        ?.indexCond
        ? "yes"
        : "no",
    );
    return fields;
  });
  const sizeSummary = ["A2", "A4", "A4n", "B1"].map((stage) => {
    const rows = report.sizes.filter((row) => row.stage === stage);
    const sum = (kind: string) =>
      rows.filter((row) => row.kind === kind).reduce((n, row) => n + row.bytes, 0);
    const slots = rows.filter((row) => row.name.startsWith("a_slot_"));
    return [
      stage,
      String(sum("table")),
      String(sum("index")),
      String(slots.reduce((n, row) => n + row.bytes, 0)),
      String(slots.length),
    ];
  });
  return `# Record storage: typed index slots under RLS\n\n${report.complete ? "Completed" : "PARTIAL — not a completed measurement"}. ${report.rows} measured-organization Leads; seed ${report.seed}; ${report.warmup} warmups, ${report.measuredRuns} measurements; ${report.writesPerKind} writes per kind. Same-run A3/A4/B1; A4n is the non-null partial-index variant. Only synthetic data.\n\n## Environment\n\n${table(
    ["setting", "value"],
    [
      ["postgres", report.version],
      ["shared_buffers", report.sharedBuffers],
      ["work_mem", report.workMem],
      ["jit", report.jit],
      ["cpus", String(report.cpus)],
      ["memory_gib", (report.memoryBytes / 1024 ** 3).toFixed(1)],
    ],
  )}\n\n## RLS off / on comparison\n\nClient median / p95 in ms. Final attempt and latest MCV state; original measurements are below.\n\n${table(["scenario", "A3 off", "A3 on", "A4 off", "A4 on", "B1 off", "B1 on", "A4 on slot Index Cond"], comparisons)}\n\n## Writes (RLS on)\n\n${table(
    ["stage", "operation", "ops", "median_ms", "p95_ms", "WAL_bytes/op", "GIN_flush_ms"],
    report.writes.map((row) => [
      row.stage,
      row.scenario,
      String(row.operations),
      ms(row.medianMs),
      ms(row.p95Ms),
      row.walBytesPerOp.toFixed(0),
      ms(row.ginFlushMs),
    ]),
  )}\n\n## Size summary\n\nTable bytes use pg_table_size (including TOAST); indexes use pg_relation_size. A2 includes GIN and expression indexes. B1 includes Leads and Contacts. Snapshots are taken before timed writes; events are excluded.\n\n${table(["stage", "table_bytes", "all_index_bytes", "slot_index_bytes", "slot_index_count"], sizeSummary)}\n\n## Operator leakproof flags\n\n${table(
    ["operator/function", "left_type", "right_type", "procedure", "proleakproof"],
    report.operators.map((row) => [
      row.operator,
      row.leftType,
      row.rightType,
      row.proc,
      row.leakproof ? "yes" : "no",
    ]),
  )}\n\n## Query evidence (all attempts)\n\n${table(
    [
      "stage",
      "scenario",
      "RLS",
      "attempt",
      "MCV slots",
      "median_ms",
      "p95_ms",
      "slot Index Cond",
      "est_rows",
      "actual_rows",
      "removed",
      "buffers",
      "reads",
      "plan",
      "slot conditions",
    ],
    report.evidence.map((row) => [
      row.stage,
      row.scenario,
      row.rls,
      String(row.attempt),
      row.stats,
      ms(row.medianMs),
      ms(row.p95Ms),
      row.indexCond ? "yes" : "no",
      String(row.estRows),
      String(row.actualRows),
      String(row.rowsRemoved),
      String(row.buffers),
      String(row.sharedRead),
      row.plan,
      row.conditions.join("; ") || "—",
    ]),
  )}\n\n## Relation sizes\n\n${table(
    ["stage", "schema", "relation", "kind", "bytes"],
    report.sizes.map((row) => [row.stage, row.schema, row.name, row.kind, String(row.bytes)]),
  )}\n\n## Equivalence and isolation\n\n${table(
    ["stage", "check", "pass", "detail"],
    report.checks.map((row) => [row.option, row.name, row.pass ? "yes" : "no", row.detail]),
  )}\n\n## Load\n\n${table(
    ["phase", "ms"],
    report.loads.map((row) => [row.phase, ms(row.ms)]),
  )}\n\n## Notes\n\n${report.notes.map((note) => `- ${note}`).join("\n")}\n\n## Outcome\n\n${report.outcome}\n`;
}
