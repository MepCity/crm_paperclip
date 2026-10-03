import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { cpus, tmpdir, totalmem } from "node:os";
import { join } from "node:path";
import { ensureDatabase, startLocalPostgres } from "@crm/db/local-postgres";
import pg from "pg";
import {
  picklistValue,
  SEARCH_TERMS,
  scaleCounts,
  syntheticLead,
  type Universe,
  universe,
} from "./dataset";
import { assertSame, executeCount, executeFull, executeList, executeReport } from "./exec";
import {
  countQuery,
  cursorQuery,
  fullQuery,
  type ListKind,
  type ListParams,
  listQuery,
  type Option,
  reportQuery,
} from "./queries";
import {
  type BenchReport,
  collectNotes,
  type LoadRow,
  percentile,
  renderMarkdown,
  type SizeSnapshot,
  type TimingRow,
  type WriteRow,
} from "./report";
import {
  applyStatements,
  configureClient,
  createTables,
  currentLsn,
  deleteInserted,
  dropStatements,
  expressionIndexNames,
  generateAndLoad,
  insertRecord,
  installRls,
  measureAlter,
  nextEventId,
  relationSizes,
  roleUrl,
  type Stage,
  searchStatements,
  serverInfo,
  setRls,
  stageStatements,
  updateFive,
  updateStatus,
  vacuumAnalyze,
  verifyRls,
  walBytes,
} from "./storage";

const OPTIONS = ["A", "B", "C"] as const;
let eventSeq = 8_000_000;
const READ_KINDS = ["s1", "s2", "s2-keyset", "s2-offset", "s3", "s4", "s5", "s11"] as const;

export type BenchArgs = {
  rows?: number;
  seed?: number;
  warmup?: number;
  measure?: number;
  writes?: number;
  outPath?: string;
  jsonPath?: string;
};

type Progress = (message: string) => void;

type Cursor = { company: string | null; id: string };

export function resolveProtocol(args: BenchArgs): {
  rows: number;
  seed: number;
  warmup: number;
  measure: number;
  writes: number;
  full: boolean;
} {
  const rows = args.rows ?? 200_000;
  const full = rows >= 200_000;
  return {
    rows,
    seed: args.seed ?? 1,
    warmup: args.warmup ?? (full ? 5 : 1),
    measure: args.measure ?? (full ? 30 : 3),
    writes: args.writes ?? (full ? 2000 : 8),
    full,
  };
}

function searchLikes(): string[] {
  return [
    `%${SEARCH_TERMS.common3}%`,
    `%${SEARCH_TERMS.rare3}%`,
    `%${SEARCH_TERMS.common8}%`,
    `%${SEARCH_TERMS.rare8}%`,
  ];
}

function makeParams(
  world: Universe,
  index: number,
  contactIds: string[],
  cursor: Cursor | null,
  searchLike: string,
): ListParams {
  const owner = world.usersA[index % world.usersA.length];
  const contact = contactIds[index % Math.max(contactIds.length, 1)] ?? world.orgA;
  if (!owner) throw new Error("missing owner");
  return {
    orgId: world.orgA,
    moduleId: world.moduleLeads,
    leadStatus: picklistValue("lead_status", 9, index),
    ownerId: owner,
    revenueMin: "2500000.00",
    industries: [0, 1, 2].map((offset) => picklistValue("industry", 19, index + offset)),
    rating: picklistValue("rating", 6, index),
    country: picklistValue("country", 248, index),
    contactId: contact,
    cursorCompany: cursor?.company ?? null,
    cursorId: cursor?.id ?? "ffffffff-ffff-ffff-ffff-ffffffffffff",
    searchLike,
    prefixQuery: SEARCH_TERMS.prefixQuery,
    offset: 5000,
  };
}

type PlanNode = {
  "Node Type": string;
  "Index Name"?: string;
  "Relation Name"?: string;
  Plans?: PlanNode[];
  "Shared Hit Blocks"?: number;
  "Shared Read Blocks"?: number;
};

function summarizePlan(plan: PlanNode): { summary: string; buffers: number; sharedRead: number } {
  const scans: string[] = [];
  let buffers = 0;
  let sharedRead = 0;
  const walk = (node: PlanNode): void => {
    buffers += (node["Shared Hit Blocks"] ?? 0) + (node["Shared Read Blocks"] ?? 0);
    sharedRead += node["Shared Read Blocks"] ?? 0;
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
  return { summary: scans.join("; ") || plan["Node Type"], buffers, sharedRead };
}

async function explainQuery(
  client: pg.Client,
  text: string,
  values: unknown[],
): Promise<{ summary: string; buffers: number; sharedRead: number }> {
  const result = await client.query(`explain (analyze, buffers, format json) ${text}`, values);
  const raw = result.rows[0]?.["QUERY PLAN"] as Array<{ Plan: PlanNode }> | undefined;
  const plan = raw?.[0]?.Plan;
  if (!plan) return { summary: "no plan", buffers: 0, sharedRead: 0 };
  return summarizePlan(plan);
}

async function timeQuery(
  client: pg.Client,
  text: string,
  valueSets: unknown[][],
  warmup: number,
  measure: number,
): Promise<{ medianMs: number; p95Ms: number }> {
  const samples: number[] = [];
  const total = warmup + measure;
  for (let index = 0; index < total; index++) {
    const values = valueSets[index % valueSets.length];
    if (!values) throw new Error("missing parameters");
    const started = performance.now();
    await client.query(text, values);
    if (index >= warmup) samples.push(performance.now() - started);
  }
  return { medianMs: percentile(samples, 0.5), p95Ms: percentile(samples, 0.95) };
}

async function measureStatement(
  client: pg.Client,
  scenario: string,
  option: string,
  stage: string,
  text: string,
  valueSets: unknown[][],
  warmup: number,
  measure: number,
): Promise<TimingRow> {
  const first = valueSets[0];
  if (!first) throw new Error(`${scenario} has no parameters`);
  const plan = await explainQuery(client, text, first);
  const timing = await timeQuery(client, text, valueSets, warmup, measure);
  return {
    scenario,
    option,
    stage,
    medianMs: timing.medianMs,
    p95Ms: timing.p95Ms,
    plan: plan.summary,
    buffers: plan.buffers,
    sharedRead: plan.sharedRead,
  };
}

async function loadCursors(
  client: pg.Client,
  option: Option,
  world: Universe,
  contactIds: string[],
): Promise<Map<string, Cursor>> {
  const cursors = new Map<string, Cursor>();
  for (let index = 0; index < 9; index++) {
    const params = makeParams(world, index, contactIds, null, searchLikes()[0] ?? "%xqz%");
    const query = cursorQuery(option, params);
    const result = await client.query<{ company: string | null; id: string }>(
      query.text,
      query.values,
    );
    const row = result.rows[0];
    cursors.set(
      params.leadStatus,
      row
        ? { company: row.company, id: String(row.id) }
        : {
            company: null,
            id: "ffffffff-ffff-ffff-ffff-ffffffffffff",
          },
    );
  }
  return cursors;
}

function setsFor(
  world: Universe,
  contactIds: string[],
  cursors: Map<string, Cursor>,
  count: number,
  build: (params: ListParams) => unknown[],
  searchLike = searchLikes()[0] ?? "%xqz%",
): unknown[][] {
  return Array.from({ length: count }, (_, index) => {
    const probe = makeParams(world, index, contactIds, null, searchLike);
    const cursor = cursors.get(probe.leadStatus) ?? null;
    return build(makeParams(world, index, contactIds, cursor, searchLike));
  });
}

async function assertEquivalent(
  client: pg.Client,
  world: Universe,
  contactIds: string[],
  leadId: string,
  cursors: Map<string, Cursor>,
): Promise<void> {
  const params = makeParams(
    world,
    0,
    contactIds,
    cursors.get(picklistValue("lead_status", 9, 0)) ?? null,
    "%xqz%",
  );
  const kinds: ListKind[] = [
    "s1",
    "s2",
    "s2-keyset",
    "s2-offset",
    "s3",
    "s4",
    "s5",
    "s7-like",
    "s7-prefix",
    "s11",
  ];
  for (const kind of kinds) {
    const rows = [
      await executeList(client, "A", kind, params),
      await executeList(client, "B", kind, params),
      await executeList(client, "C", kind, params),
    ];
    assertSame(`${kind} A/B`, rows[0], rows[1]);
    assertSame(`${kind} A/C`, rows[0], rows[2]);
  }
  for (const kind of ["s2", "s4"] as const) {
    for (const capped of [false, true]) {
      const counts = [
        await executeCount(client, "A", kind, params, capped),
        await executeCount(client, "B", kind, params, capped),
        await executeCount(client, "C", kind, params, capped),
      ];
      assertSame(`${kind} count capped=${capped} A/B`, counts[0], counts[1]);
      assertSame(`${kind} count capped=${capped} A/C`, counts[0], counts[2]);
    }
  }
  for (const byOwner of [false, true]) {
    const reports = [
      await executeReport(client, "A", byOwner, params),
      await executeReport(client, "B", byOwner, params),
      await executeReport(client, "C", byOwner, params),
    ];
    assertSame(`report owner=${byOwner} A/B`, reports[0], reports[1]);
    assertSame(`report owner=${byOwner} A/C`, reports[0], reports[2]);
  }
  const full = [
    await executeFull(client, "A", leadId),
    await executeFull(client, "B", leadId),
    await executeFull(client, "C", leadId),
  ];
  assertSame("S8 A/B", full[0], full[1]);
  assertSame("S8 A/C", full[0], full[2]);
}

async function measureReadsForStage(
  client: pg.Client,
  option: Option,
  stage: string,
  world: Universe,
  contactIds: string[],
  leadIds: string[],
  cursors: Map<string, Cursor>,
  warmup: number,
  measure: number,
  progress: Progress,
): Promise<TimingRow[]> {
  const rows: TimingRow[] = [];
  const remember = async (scenario: string, text: string, valueSets: unknown[][]) => {
    progress(`${stage} ${option} ${scenario}`);
    rows.push(
      await measureStatement(client, scenario, option, stage, text, valueSets, warmup, measure),
    );
  };

  for (const kind of READ_KINDS) {
    const query = listQuery(option, kind, makeParams(world, 0, contactIds, null, "%xqz%"));
    const values = setsFor(
      world,
      contactIds,
      cursors,
      measure,
      (params) => listQuery(option, kind, params).values,
    );
    await remember(kind.toUpperCase(), query.text, values);
  }

  for (const kind of ["s2", "s4"] as const) {
    for (const capped of [false, true]) {
      const sample = makeParams(world, 0, contactIds, null, "%xqz%");
      const query = countQuery(option, kind, sample, capped);
      const values = setsFor(
        world,
        contactIds,
        cursors,
        measure,
        (params) => countQuery(option, kind, params, capped).values,
      );
      await remember(`${kind.toUpperCase()} ${capped ? "capped" : "count"}`, query.text, values);
    }
  }

  const fullText = fullQuery(option, leadIds[0] ?? "").text;
  const fullValues = Array.from({ length: measure }, (_, index) => [
    leadIds[index % leadIds.length],
  ]);
  await remember("S8", fullText, fullValues);

  for (const byOwner of [false, true]) {
    const sample = makeParams(world, 0, contactIds, null, "%xqz%");
    const query = reportQuery(option, byOwner, sample);
    const values = setsFor(
      world,
      contactIds,
      cursors,
      measure,
      (params) => reportQuery(option, byOwner, params).values,
    );
    await remember(byOwner ? "S10 owner" : "S10 source", query.text, values);
  }
  return rows;
}

async function measureSearch(
  client: pg.Client,
  stage: string,
  world: Universe,
  contactIds: string[],
  cursors: Map<Option, Map<string, Cursor>>,
  warmup: number,
  measure: number,
  progress: Progress,
  kinds: Array<{ id: string; kind: ListKind; like?: string }>,
): Promise<TimingRow[]> {
  const rows: TimingRow[] = [];
  for (const option of OPTIONS) {
    const optionCursors = cursors.get(option);
    if (!optionCursors) throw new Error(`missing cursors for ${option}`);
    for (const item of kinds) {
      const like = item.like ?? `%${SEARCH_TERMS.common3}%`;
      const sample = makeParams(world, 0, contactIds, null, like);
      const query = listQuery(option, item.kind, sample);
      const values = setsFor(
        world,
        contactIds,
        optionCursors,
        measure,
        (params) => listQuery(option, item.kind, params).values,
        like,
      );
      progress(`${stage} ${option} ${item.id}`);
      rows.push(
        await measureStatement(client, item.id, option, stage, query.text, values, warmup, measure),
      );
    }
  }
  return rows;
}

async function measureWrites(
  client: pg.Client,
  option: Option,
  stage: string,
  rls: string,
  operations: number,
  world: Universe,
  leadIds: string[],
  orgForRls: string | null,
  progress: Progress,
): Promise<{ rows: WriteRow[]; inserted: string[] }> {
  const actor = world.usersA[0];
  if (!actor) throw new Error("missing actor");
  const inserted: string[] = [];
  const rows: WriteRow[] = [];
  const kinds = ["insert", "update1", "update5"] as const;
  for (const kind of kinds) {
    progress(`${stage} ${option} S9 ${kind} rls=${rls}`);
    const samples: number[] = [];
    let wal = 0;
    for (let index = 0; index < operations; index++) {
      const lsn = await currentLsn(client);
      const started = performance.now();
      await client.query("begin");
      try {
        if (orgForRls) await client.query("select set_config('app.org_id', $1, true)", [orgForRls]);
        const eventId = nextEventId(eventSeq);
        eventSeq += 1;
        if (kind === "insert") {
          const record = syntheticLead(world, 20_000_000 + eventSeq);
          await insertRecord(client, option, record, eventId);
          inserted.push(record.id);
        } else if (kind === "update1") {
          const recordId = leadIds[index % leadIds.length];
          if (!recordId) throw new Error("missing lead id");
          await updateStatus(
            client,
            option,
            recordId,
            world.orgA,
            picklistValue("lead_status", 9, index),
            actor,
            "bench update",
            eventId,
          );
        } else {
          const recordId = leadIds[index % leadIds.length];
          if (!recordId) throw new Error("missing lead id");
          await updateFive(
            client,
            option,
            recordId,
            world.orgA,
            {
              leadStatus: picklistValue("lead_status", 9, index),
              company: `Company ${String(index).padStart(6, "0")}`,
              city: "benchcity",
              annualRevenue: (1000 + index).toFixed(2),
              cfText: `bench ${index}`,
            },
            actor,
            "bench update five",
            eventId,
          );
        }
        await client.query("commit");
      } catch (error) {
        await client.query("rollback");
        throw error;
      }
      samples.push(performance.now() - started);
      wal += await walBytes(client, lsn);
    }
    const totalMs = samples.reduce((sum, sample) => sum + sample, 0);
    rows.push({
      scenario: `S9 ${kind}`,
      option,
      stage,
      rls,
      operations,
      totalMs,
      medianMs: percentile(samples, 0.5),
      p95Ms: percentile(samples, 0.95),
      walBytesPerOp: operations === 0 ? 0 : wal / operations,
    });
  }
  return { rows, inserted };
}

function relationsFor(stage: Stage): string[] {
  if (stage.startsWith("A")) return ["bench_a.records"];
  if (stage.startsWith("B")) return ["bench_b.leads", "bench_b.contacts"];
  return ["bench_c.records", "bench_c.record_values"];
}

export async function runBench(
  args: BenchArgs,
  progress: Progress = () => undefined,
): Promise<BenchReport> {
  const protocol = resolveProtocol(args);
  const world = universe(protocol.seed);
  const dataDir = await mkdtemp(join(tmpdir(), "crm-bench-"));
  let server: Awaited<ReturnType<typeof startLocalPostgres>> | undefined;
  let client: pg.Client | undefined;
  let app: pg.Client | undefined;
  const timings: TimingRow[] = [];
  const writes: WriteRow[] = [];
  const sizes: SizeSnapshot[] = [];
  const loads: LoadRow[] = [];
  try {
    server = await startLocalPostgres({ dataDir });
    client = new pg.Client({ connectionString: server.urlFor("bench") });
    await ensureDatabase(server.urlFor("postgres"), "bench");
    await client.connect();
    await configureClient(client);
    const info = await serverInfo(client);
    const publish = async (
      checks: BenchReport["checks"] = [],
      alter: BenchReport["alter"] = null,
    ): Promise<void> => {
      if (!args.outPath && !args.jsonPath) return;
      const partial: BenchReport = {
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
        timings,
        writes,
        sizes,
        loads,
        checks,
        alter,
        notes: [],
      };
      partial.notes = collectNotes(partial);
      if (args.outPath) await writeFile(args.outPath, renderMarkdown(partial));
      if (args.jsonPath) await writeFile(args.jsonPath, JSON.stringify(partial));
    };
    progress("creating tables");
    await createTables(client);
    progress(`loading ${protocol.rows} leads`);
    const loaded = await generateAndLoad(client, {
      seed: protocol.seed,
      scale: scaleCounts(protocol.rows),
    });
    loads.push({ phase: "generate", ms: loaded.generateMs });
    loads.push({ phase: "copy A", ms: loaded.copyMs.A });
    loads.push({ phase: "copy B", ms: loaded.copyMs.B });
    loads.push({ phase: "copy C", ms: loaded.copyMs.C });
    const leadIds = loaded.orgALeadIds;
    const firstLead = leadIds[0];
    if (!firstLead) throw new Error("dataset produced no org A leads");
    const contactIds = loaded.lookupContactIds.length > 0 ? loaded.lookupContactIds : [world.orgA];

    progress("base indexes");
    for (const stage of ["A0", "B0", "C0"] as const) {
      const ms = await applyStatements(client, stageStatements(stage, world.moduleLeads));
      loads.push({ phase: `index ${stage}`, ms });
    }
    await vacuumAnalyze(client, [
      "bench_a.records",
      "bench_b.leads",
      "bench_b.contacts",
      "bench_c.records",
      "bench_c.record_values",
    ]);
    const cursors = new Map<Option, Map<string, Cursor>>();
    for (const option of OPTIONS) {
      progress(`cursors ${option}`);
      cursors.set(option, await loadCursors(client, option, world, contactIds));
    }
    progress("checking A/B/C equivalence");
    const cursorA = cursors.get("A");
    if (!cursorA) throw new Error("missing cursors");
    await assertEquivalent(client, world, contactIds, firstLead, cursorA);

    const db = client;
    const measureStage = async (stage: Stage, option: Option) => {
      await vacuumAnalyze(db, relationsFor(stage));
      const optionCursors = cursors.get(option);
      if (!optionCursors) throw new Error(`missing cursors for ${option}`);
      timings.push(
        ...(await measureReadsForStage(
          db,
          option,
          stage,
          world,
          contactIds,
          leadIds,
          optionCursors,
          protocol.warmup,
          protocol.measure,
          progress,
        )),
      );
      for (const size of await relationSizes(db)) {
        if (size.schema === `bench_${option.toLowerCase()}`) {
          sizes.push({ stage, ...size });
        }
      }
    };

    await measureStage("A0", "A");
    for (const stage of ["A1", "A2"] as const) {
      const ms = await applyStatements(client, stageStatements(stage, world.moduleLeads));
      loads.push({ phase: `index ${stage}`, ms });
      await measureStage(stage, "A");
    }
    await measureStage("B0", "B");
    const b1 = await applyStatements(client, stageStatements("B1", world.moduleLeads));
    loads.push({ phase: "index B1", ms: b1 });
    await measureStage("B1", "B");
    await measureStage("C0", "C");
    await publish();

    const likeKinds = searchLikes().map((like, index) => ({
      id: `S7a ${["common3", "rare3", "common8", "rare8"][index] ?? "term"}`,
      kind: "s7-like" as const,
      like,
    }));
    timings.push(
      ...(await measureSearch(
        client,
        "no-search-index",
        world,
        contactIds,
        cursors,
        protocol.warmup,
        protocol.measure,
        progress,
        likeKinds.map((item) => ({ ...item, id: item.id.replace("S7a", "S7c") })),
      )),
    );
    const trgm = await applyStatements(client, searchStatements("trgm"));
    loads.push({ phase: "index trgm", ms: trgm });
    await vacuumAnalyze(client, ["bench_a.records", "bench_b.leads", "bench_c.records"]);
    timings.push(
      ...(await measureSearch(
        client,
        "trgm",
        world,
        contactIds,
        cursors,
        protocol.warmup,
        protocol.measure,
        progress,
        likeKinds,
      )),
    );
    const tsv = await applyStatements(client, searchStatements("tsv"));
    loads.push({ phase: "index tsv", ms: tsv });
    await vacuumAnalyze(client, ["bench_a.records", "bench_b.leads", "bench_c.records"]);
    timings.push(
      ...(await measureSearch(
        client,
        "tsv",
        world,
        contactIds,
        cursors,
        protocol.warmup,
        protocol.measure,
        progress,
        [{ id: "S7b prefix", kind: "s7-prefix" }],
      )),
    );
    await publish();

    progress("row level security");
    await installRls(client);
    app = new pg.Client({ connectionString: roleUrl(server.urlFor("bench")) });
    await app.connect();
    await configureClient(app);
    const rlsScenarios: Array<{ id: string; kind: ListKind; like?: string }> = [
      { id: "S1", kind: "s1" },
      { id: "S2", kind: "s2" },
      { id: "S2-KEYSET", kind: "s2-keyset" },
      { id: "S2-OFFSET", kind: "s2-offset" },
      ...likeKinds,
    ];
    for (const enabled of [false, true]) {
      await setRls(client, enabled);
      const stage = enabled ? "rls-on" : "rls-off";
      for (const option of ["A", "B"] as const) {
        const optionCursors = cursors.get(option);
        if (!optionCursors) throw new Error(`missing cursors for ${option}`);
        for (const item of rlsScenarios) {
          const like = item.like ?? "%xqz%";
          const sample = makeParams(world, 0, contactIds, null, like);
          const query = listQuery(option, item.kind, sample);
          const values = setsFor(
            world,
            contactIds,
            optionCursors,
            protocol.measure,
            (params) => listQuery(option, item.kind, params).values,
            like,
          );
          progress(`${stage} ${option} ${item.id}`);
          const first = values[0];
          if (!first) throw new Error("missing parameters");
          await app.query("begin");
          await app.query("select set_config('app.org_id', $1, true)", [world.orgA]);
          const plan = await explainQuery(app, query.text, first);
          await app.query("commit");
          const samples: number[] = [];
          const total = protocol.warmup + protocol.measure;
          for (let index = 0; index < total; index++) {
            const parameters = values[index % values.length];
            const started = performance.now();
            await app.query("begin");
            await app.query("select set_config('app.org_id', $1, true)", [world.orgA]);
            await app.query(query.text, parameters);
            await app.query("commit");
            if (index >= protocol.warmup) samples.push(performance.now() - started);
          }
          timings.push({
            scenario: item.id,
            option,
            stage,
            medianMs: percentile(samples, 0.5),
            p95Ms: percentile(samples, 0.95),
            plan: plan.summary,
            buffers: plan.buffers,
            sharedRead: plan.sharedRead,
          });
        }
        const fullText = fullQuery(option, firstLead).text;
        const fullValues = Array.from({ length: protocol.measure }, (_, index) => [
          leadIds[index % leadIds.length],
        ]);
        progress(`${stage} ${option} S8`);
        await app.query("begin");
        await app.query("select set_config('app.org_id', $1, true)", [world.orgA]);
        const plan = await explainQuery(app, fullText, fullValues[0] ?? [firstLead]);
        await app.query("commit");
        const samples: number[] = [];
        const total = protocol.warmup + protocol.measure;
        for (let index = 0; index < total; index++) {
          const started = performance.now();
          await app.query("begin");
          await app.query("select set_config('app.org_id', $1, true)", [world.orgA]);
          await app.query(fullText, fullValues[index % fullValues.length]);
          await app.query("commit");
          if (index >= protocol.warmup) samples.push(performance.now() - started);
        }
        timings.push({
          scenario: "S8",
          option,
          stage,
          medianMs: percentile(samples, 0.5),
          p95Ms: percentile(samples, 0.95),
          plan: plan.summary,
          buffers: plan.buffers,
          sharedRead: plan.sharedRead,
        });
      }
    }

    await publish();
    await setRls(client, false);
    await dropStatements(client, ["bench_a.a_data_gin", ...expressionIndexNames("A")]);
    const a0Writes = await measureWrites(
      client,
      "A",
      "A0",
      "n/a",
      protocol.writes,
      world,
      leadIds,
      null,
      progress,
    );
    writes.push(...a0Writes.rows);
    await deleteInserted(client, "A", a0Writes.inserted);
    const a1Ms = await applyStatements(client, stageStatements("A1", world.moduleLeads));
    loads.push({ phase: "rebuild A1", ms: a1Ms });
    const a1Writes = await measureWrites(
      client,
      "A",
      "A1",
      "n/a",
      protocol.writes,
      world,
      leadIds,
      null,
      progress,
    );
    writes.push(...a1Writes.rows);
    await deleteInserted(client, "A", a1Writes.inserted);
    const a2Ms = await applyStatements(client, stageStatements("A2", world.moduleLeads));
    loads.push({ phase: "rebuild A2", ms: a2Ms });
    const a2Writes = await measureWrites(
      client,
      "A",
      "A2",
      "n/a",
      protocol.writes,
      world,
      leadIds,
      null,
      progress,
    );
    writes.push(...a2Writes.rows);
    await deleteInserted(client, "A", a2Writes.inserted);

    await dropStatements(client, expressionIndexNames("B"));
    const b0Writes = await measureWrites(
      client,
      "B",
      "B0",
      "n/a",
      protocol.writes,
      world,
      leadIds,
      null,
      progress,
    );
    writes.push(...b0Writes.rows);
    await deleteInserted(client, "B", b0Writes.inserted);
    const b1Rebuild = await applyStatements(client, stageStatements("B1", world.moduleLeads));
    loads.push({ phase: "rebuild B1", ms: b1Rebuild });
    const b1Writes = await measureWrites(
      client,
      "B",
      "B1",
      "n/a",
      protocol.writes,
      world,
      leadIds,
      null,
      progress,
    );
    writes.push(...b1Writes.rows);
    await deleteInserted(client, "B", b1Writes.inserted);

    const cWrites = await measureWrites(
      client,
      "C",
      "C0",
      "n/a",
      protocol.writes,
      world,
      leadIds,
      null,
      progress,
    );
    writes.push(...cWrites.rows);
    await deleteInserted(client, "C", cWrites.inserted);

    for (const enabled of [false, true]) {
      await setRls(client, enabled);
      const label = enabled ? "on" : "off";
      for (const option of ["A", "B"] as const) {
        const stage = option === "A" ? "A2" : "B1";
        const batch = await measureWrites(
          app,
          option,
          stage,
          label,
          protocol.writes,
          world,
          leadIds,
          world.orgA,
          progress,
        );
        writes.push(...batch.rows);
        await deleteInserted(client, option, batch.inserted);
      }
    }

    const checks = await verifyRls(client, app, world, firstLead);
    progress("alter table");
    const alter = await measureAlter(client);
    const leadCount = await client.query<{ n: number }>(
      "select count(*)::int as n from bench_b.leads",
    );
    const report: BenchReport = {
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
      timings,
      writes,
      sizes,
      loads,
      checks,
      alter: {
        ...alter,
        rows: leadCount.rows[0]?.n ?? 0,
      },
      notes: [],
    };
    report.notes = collectNotes(report);
    if (args.outPath) await writeFile(args.outPath, renderMarkdown(report));
    if (args.jsonPath) await writeFile(args.jsonPath, JSON.stringify(report, null, 2));
    progress("done");
    return report;
  } finally {
    await app?.end().catch(() => undefined);
    await client?.end().catch(() => undefined);
    await server?.stop().catch(() => undefined);
    await rm(dataDir, { recursive: true, force: true });
  }
}

export function markdownFor(report: BenchReport): string {
  return renderMarkdown(report);
}
