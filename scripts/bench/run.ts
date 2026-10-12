import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { cpus, tmpdir, totalmem } from "node:os";
import { join } from "node:path";
import { ensureDatabase, startLocalPostgres } from "@crm/db/local-postgres";
import { startWithSignalShutdown } from "@crm/db/signal-shutdown";
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
  type JsonEquality,
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
  type PlanNode,
  percentile,
  renderMarkdown,
  type Selectivity,
  type SizeSnapshot,
  summarizePlan,
  type TimingRow,
  type WriteRow,
} from "./report";
import {
  applyStatements,
  checkpoint,
  cleanGinPending,
  configureClient,
  createTables,
  currentLsn,
  deleteInserted,
  dropStatements,
  expressionIndexNames,
  filterOperators,
  generateAndLoad,
  ginIndexNames,
  insertRecord,
  installRls,
  measureAlter,
  nextEventId,
  relationSizes,
  roleUrl,
  type Stage,
  searchIndexNames,
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
  slots?: boolean;
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
  prefixQuery: string = SEARCH_TERMS.prefixQuery,
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
    prefixQuery,
    offset: 5000,
  };
}

function equalityFor(option: Option, stage: string): JsonEquality {
  if (option !== "A") return "containment";
  return stage === "A2" || stage === "A3" || stage === "rls-on" || stage === "rls-off"
    ? "expression"
    : "containment";
}

type ExplainDocument = {
  Plan: PlanNode;
  JIT?: { Timing?: { Total?: number } };
};

async function explainQuery(
  client: pg.Client,
  text: string,
  values: unknown[],
): Promise<ReturnType<typeof summarizePlan>> {
  const result = await client.query(`explain (analyze, buffers, format json) ${text}`, values);
  const raw = result.rows[0]?.["QUERY PLAN"] as ExplainDocument[] | undefined;
  const document = raw?.[0];
  if (!document?.Plan) {
    return {
      summary: "no plan",
      buffers: 0,
      sharedRead: 0,
      estRows: 0,
      actualRows: 0,
      rowsRemoved: 0,
    };
  }
  return summarizePlan(document.Plan, document.JIT?.Timing?.Total);
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
    estRows: plan.estRows,
    actualRows: plan.actualRows,
    rowsRemoved: plan.rowsRemoved,
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
  prefixQuery: string = SEARCH_TERMS.prefixQuery,
): unknown[][] {
  return Array.from({ length: count }, (_, index) => {
    const probe = makeParams(world, index, contactIds, null, searchLike, prefixQuery);
    const cursor = cursors.get(probe.leadStatus) ?? null;
    return build(makeParams(world, index, contactIds, cursor, searchLike, prefixQuery));
  });
}

function keysetMeasurement(
  option: Option,
  world: Universe,
  contactIds: string[],
  cursors: Map<string, Cursor>,
  count: number,
  equality: JsonEquality,
): { text: string; values: unknown[][] } {
  const entries = [...cursors.entries()];
  const present = entries.filter((entry) => entry[1].company !== null);
  const chosen = present.length > 0 ? present : entries;
  const first = chosen[0];
  if (!first) throw new Error("missing keyset cursor");
  const paramsFor = (status: string, cursor: Cursor, index: number): ListParams => {
    const base = makeParams(world, index, contactIds, cursor, "%xqz%");
    return { ...base, leadStatus: status };
  };
  const sample = paramsFor(first[0], first[1], 0);
  const query = listQuery(option, "s2-keyset", sample, equality);
  const values = Array.from({ length: count }, (_, index) => {
    const entry = chosen[index % chosen.length];
    if (!entry) throw new Error("missing keyset cursor");
    return listQuery(option, "s2-keyset", paramsFor(entry[0], entry[1], index), equality).values;
  });
  return { text: query.text, values };
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
  for (const kind of ["s2", "s4", "s5", "s11", "s2-keyset"] as const) {
    const expressed = await executeList(client, "A", kind, params, "expression");
    assertSame(`${kind} expression`, expressed, await executeList(client, "B", kind, params));
  }
  for (const like of searchLikes()) {
    const search = { ...params, searchLike: like };
    const found = [
      await executeList(client, "A", "s7-like", search),
      await executeList(client, "B", "s7-like", search),
      await executeList(client, "C", "s7-like", search),
    ];
    assertSame(`s7-like ${like} A/B`, found[0], found[1]);
    assertSame(`s7-like ${like} A/C`, found[0], found[2]);
  }
  for (const prefix of [SEARCH_TERMS.prefixQuery, SEARCH_TERMS.prefixSelective]) {
    const search = { ...params, prefixQuery: prefix };
    const found = [
      await executeList(client, "A", "s7-prefix", search),
      await executeList(client, "B", "s7-prefix", search),
      await executeList(client, "C", "s7-prefix", search),
    ];
    assertSame(`s7-prefix ${prefix} A/B`, found[0], found[1]);
    assertSame(`s7-prefix ${prefix} A/C`, found[0], found[2]);
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
  const equality = equalityFor(option, stage);
  const remember = async (scenario: string, text: string, valueSets: unknown[][]) => {
    progress(`${stage} ${option} ${scenario}`);
    rows.push(
      await measureStatement(client, scenario, option, stage, text, valueSets, warmup, measure),
    );
  };

  for (const kind of READ_KINDS) {
    if (kind === "s2-keyset") {
      const keyset = keysetMeasurement(option, world, contactIds, cursors, measure, equality);
      await remember("S2-KEYSET", keyset.text, keyset.values);
      continue;
    }
    const query = listQuery(
      option,
      kind,
      makeParams(world, 0, contactIds, null, "%xqz%"),
      equality,
    );
    const values = setsFor(
      world,
      contactIds,
      cursors,
      measure,
      (params) => listQuery(option, kind, params, equality).values,
    );
    await remember(kind.toUpperCase(), query.text, values);
  }

  for (const kind of ["s2", "s4"] as const) {
    for (const capped of [false, true]) {
      const sample = makeParams(world, 0, contactIds, null, "%xqz%");
      const query = countQuery(option, kind, sample, capped, equality);
      const values = setsFor(
        world,
        contactIds,
        cursors,
        measure,
        (params) => countQuery(option, kind, params, capped, equality).values,
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
  kinds: Array<{ id: string; kind: ListKind; like?: string; prefix?: string }>,
): Promise<TimingRow[]> {
  const rows: TimingRow[] = [];
  for (const option of OPTIONS) {
    const optionCursors = cursors.get(option);
    if (!optionCursors) throw new Error(`missing cursors for ${option}`);
    for (const item of kinds) {
      const like = item.like ?? `%${SEARCH_TERMS.common3}%`;
      const prefix = item.prefix ?? SEARCH_TERMS.prefixQuery;
      const sample = makeParams(world, 0, contactIds, null, like, prefix);
      const query = listQuery(option, item.kind, sample);
      const values = setsFor(
        world,
        contactIds,
        optionCursors,
        measure,
        (params) => listQuery(option, item.kind, params).values,
        like,
        prefix,
      );
      progress(`${stage} ${option} ${item.id}`);
      rows.push(
        await measureStatement(client, item.id, option, stage, query.text, values, warmup, measure),
      );
    }
  }
  return rows;
}

export async function measureWrites(
  session: pg.Client,
  meter: pg.Client,
  option: Option,
  stage: string,
  rls: string,
  operations: number,
  world: Universe,
  ids: { update1: string[]; update5: string[] },
  orgForRls: string | null,
  progress: Progress,
  slots = false,
): Promise<{ rows: WriteRow[]; inserted: string[] }> {
  const actor = world.usersA[0];
  if (!actor) throw new Error("missing actor");
  if (ids.update1.length < operations || ids.update5.length < operations) {
    throw new Error(`not enough lead ids for ${stage} ${option} ${rls}`);
  }
  const inserted: string[] = [];
  const rows: WriteRow[] = [];
  const kinds = ["insert", "update1", "update5"] as const;
  for (const kind of kinds) {
    progress(`${stage} ${option} S9 ${kind} rls=${rls}`);
    await checkpoint(meter);
    const ginIndexes = await ginIndexNames(meter, option);
    await cleanGinPending(meter, ginIndexes);
    const startLsn = await currentLsn(meter);
    const samples: number[] = [];
    for (let index = 0; index < operations; index++) {
      const started = performance.now();
      await session.query("begin");
      try {
        if (orgForRls)
          await session.query("select set_config('app.org_id', $1, true)", [orgForRls]);
        const eventId = nextEventId(eventSeq);
        eventSeq += 1;
        if (kind === "insert") {
          const record = syntheticLead(world, 20_000_000 + eventSeq);
          await insertRecord(session, option, record, eventId, slots);
          inserted.push(record.id);
        } else if (kind === "update1") {
          const recordId = ids.update1[index];
          if (!recordId) throw new Error("missing lead id");
          await updateStatus(
            session,
            option,
            recordId,
            world.orgA,
            picklistValue("lead_status", 9, index),
            actor,
            eventId,
            slots,
          );
        } else {
          const recordId = ids.update5[index];
          if (!recordId) throw new Error("missing lead id");
          await updateFive(
            session,
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
            eventId,
            slots,
          );
        }
        await session.query("commit");
      } catch (error) {
        await session.query("rollback");
        throw error;
      }
      samples.push(performance.now() - started);
    }
    const ginFlushMs = await cleanGinPending(meter, ginIndexes);
    const wal = await walBytes(meter, startLsn);
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
      ginFlushMs,
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
  const selectivity: Selectivity = { leadStatusShare: 0, emailOptOutFalseShare: 0 };
  let leadCursor = 0;
  let leadIdsSlice = (_start: number, _count: number): string[] => [];
  const takeWriteIds = (count: number): { update1: string[]; update5: string[] } => {
    const update1 = leadIdsSlice(leadCursor, count);
    const update5 = leadIdsSlice(leadCursor + count, count);
    leadCursor += count * 2;
    return { update1, update5 };
  };
  try {
    server = await startWithSignalShutdown(() => startLocalPostgres({ dataDir }));
    client = new pg.Client({ connectionString: server.urlFor("bench") });
    await ensureDatabase(server.urlFor("postgres"), "bench");
    await client.connect();
    await configureClient(client);
    const info = await serverInfo(client);
    const operators = await filterOperators(client);
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
        selectivity,
        operators,
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
    leadIdsSlice = (start, count) => {
      const slice = leadIds.slice(start, start + count);
      if (slice.length < count) {
        throw new Error(`need ${count} lead ids at ${start}, have ${leadIds.length}`);
      }
      return slice;
    };
    const selectivityRow = await client.query<{
      live: string;
      status_avg: string;
      opt_false: string;
    }>(
      `with live as (
         select lead_status, email_opt_out
         from bench_b.leads
         where organization_id = $1::uuid and module_id = $2::uuid and deleted_at is null
       )
       select (select count(*) from live) as live,
         (select count(*) from live where email_opt_out = false) as opt_false,
         (select avg(n)::float8 from (
            select count(*) as n from live where lead_status is not null group by lead_status
          ) s) as status_avg`,
      [world.orgA, world.moduleLeads],
    );
    const live = Number(selectivityRow.rows[0]?.live ?? 0);
    if (live > 0) {
      selectivity.leadStatusShare = Number(selectivityRow.rows[0]?.status_avg ?? 0) / live;
      selectivity.emailOptOutFalseShare = Number(selectivityRow.rows[0]?.opt_false ?? 0) / live;
    }
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
    for (const stage of ["A1", "A2", "A3"] as const) {
      const ms = await applyStatements(client, stageStatements(stage, world.moduleLeads));
      loads.push({ phase: stage === "A3" ? "stats A3" : `index ${stage}`, ms });
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
    for (const size of await relationSizes(client)) {
      if (size.name.endsWith("_trgm")) sizes.push({ stage: "trgm", ...size });
    }
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
    for (const size of await relationSizes(client)) {
      if (size.name.endsWith("_tsv")) sizes.push({ stage: "tsv", ...size });
    }
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
        [
          { id: "S7b selective", kind: "s7-prefix", prefix: SEARCH_TERMS.prefixSelective },
          { id: "S7b common", kind: "s7-prefix", prefix: SEARCH_TERMS.prefixQuery },
        ],
      )),
    );
    await publish();

    progress("checking A/B/C equivalence before row level security");
    await assertEquivalent(client, world, contactIds, firstLead, cursorA);
    progress("row level security");
    await installRls(client);
    app = new pg.Client({ connectionString: roleUrl(server.urlFor("bench")) });
    await app.connect();
    await configureClient(app);
    const rlsScenarios: Array<{
      id: string;
      kind: ListKind | "s2-count";
      like?: string;
      prefix?: string;
    }> = [
      { id: "S1", kind: "s1" },
      { id: "S2", kind: "s2" },
      { id: "S2-KEYSET", kind: "s2-keyset" },
      { id: "S2-OFFSET", kind: "s2-offset" },
      { id: "S3", kind: "s3" },
      { id: "S4", kind: "s4" },
      { id: "S5", kind: "s5" },
      { id: "S11", kind: "s11" },
      { id: "S2 count", kind: "s2-count" },
      ...likeKinds,
      { id: "S7b selective", kind: "s7-prefix", prefix: SEARCH_TERMS.prefixSelective },
      { id: "S7b common", kind: "s7-prefix", prefix: SEARCH_TERMS.prefixQuery },
    ];
    for (const enabled of [false, true]) {
      await setRls(client, enabled);
      const stage = enabled ? "rls-on" : "rls-off";
      for (const option of ["A", "B"] as const) {
        const optionCursors = cursors.get(option);
        if (!optionCursors) throw new Error(`missing cursors for ${option}`);
        const equality = equalityFor(option, stage);
        for (const item of rlsScenarios) {
          const like = item.like ?? "%xqz%";
          const prefix = item.prefix ?? SEARCH_TERMS.prefixQuery;
          const measured = (() => {
            if (item.kind === "s2-keyset") {
              return keysetMeasurement(
                option,
                world,
                contactIds,
                optionCursors,
                protocol.measure,
                equality,
              );
            }
            if (item.kind === "s2-count") {
              return {
                text: countQuery(
                  option,
                  "s2",
                  makeParams(world, 0, contactIds, null, like, prefix),
                  false,
                  equality,
                ).text,
                values: setsFor(
                  world,
                  contactIds,
                  optionCursors,
                  protocol.measure,
                  (params) => countQuery(option, "s2", params, false, equality).values,
                  like,
                  prefix,
                ),
              };
            }
            const kind = item.kind;
            return {
              text: listQuery(
                option,
                kind,
                makeParams(world, 0, contactIds, null, like, prefix),
                equality,
              ).text,
              values: setsFor(
                world,
                contactIds,
                optionCursors,
                protocol.measure,
                (params) => listQuery(option, kind, params, equality).values,
                like,
                prefix,
              ),
            };
          })();
          const query = { text: measured.text };
          const values = measured.values;
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
            estRows: plan.estRows,
            actualRows: plan.actualRows,
            rowsRemoved: plan.rowsRemoved,
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
          estRows: plan.estRows,
          actualRows: plan.actualRows,
          rowsRemoved: plan.rowsRemoved,
        });
      }
    }

    await publish();
    await setRls(client, false);
    await dropStatements(client, [...searchIndexNames("trgm"), ...searchIndexNames("tsv")]);
    if (!client) throw new Error("missing database connection");
    const meter = client;
    const runWrite = async (
      session: pg.Client,
      option: Option,
      stage: string,
      rls: string,
      orgForRls: string | null,
    ) => {
      const batch = await measureWrites(
        session,
        meter,
        option,
        stage,
        rls,
        protocol.writes,
        world,
        takeWriteIds(protocol.writes),
        orgForRls,
        progress,
      );
      writes.push(...batch.rows);
      await deleteInserted(meter, option, batch.inserted);
    };
    await dropStatements(client, ["bench_a.a_data_gin", ...expressionIndexNames("A")]);
    await runWrite(client, "A", "A0", "n/a", null);
    const a1Ms = await applyStatements(client, stageStatements("A1", world.moduleLeads));
    loads.push({ phase: "rebuild A1", ms: a1Ms });
    await runWrite(client, "A", "A1", "n/a", null);
    const a2Ms = await applyStatements(client, stageStatements("A2", world.moduleLeads));
    loads.push({ phase: "rebuild A2", ms: a2Ms });
    await runWrite(client, "A", "A2", "n/a", null);

    await dropStatements(client, expressionIndexNames("B"));
    await runWrite(client, "B", "B0", "n/a", null);
    const b1Rebuild = await applyStatements(client, stageStatements("B1", world.moduleLeads));
    loads.push({ phase: "rebuild B1", ms: b1Rebuild });
    await runWrite(client, "B", "B1", "n/a", null);
    await runWrite(client, "C", "C0", "n/a", null);

    if (!app) throw new Error("missing application connection");
    const application = app;
    for (const enabled of [false, true]) {
      await setRls(client, enabled);
      const label = enabled ? "on" : "off";
      for (const option of ["A", "B"] as const) {
        const stage = option === "A" ? "A2" : "B1";
        await runWrite(application, option, stage, label, world.orgA);
      }
    }
    await setRls(client, false);
    const trgmWrites = await applyStatements(client, searchStatements("trgm"));
    loads.push({ phase: "rebuild trgm", ms: trgmWrites });
    await runWrite(client, "A", "A2+trgm", "n/a", null);
    await runWrite(client, "B", "B1+trgm", "n/a", null);
    await dropStatements(client, searchIndexNames("trgm"));
    const tsvWrites = await applyStatements(client, searchStatements("tsv"));
    loads.push({ phase: "rebuild tsv", ms: tsvWrites });
    await runWrite(client, "A", "A2+tsv", "n/a", null);
    await runWrite(client, "B", "B1+tsv", "n/a", null);
    await dropStatements(client, searchIndexNames("tsv"));

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
      selectivity,
      operators,
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
