import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { arch, cpus, loadavg, tmpdir, totalmem } from "node:os";
import { join } from "node:path";
import { ensureDatabase, startLocalPostgres } from "@crm/db/local-postgres";
import pg from "pg";
import { scaleCounts, universe } from "./dataset";
import { deepQuery, VARIANTS } from "./deep-pages-queries";
import { renderDeep } from "./deep-pages-report";
import {
  copySlots,
  secondSlotIndexes,
  secondTypedIndex,
  synchronizeTyped,
} from "./deep-pages-storage";
import type { ListParams, Query } from "./queries";
import { percentile } from "./report";
import { loadedParams } from "./slot-queries";
import { bestPairs, type Evidence, inspect, type Plan, transaction } from "./slots2-measure";
import { ORDERS, type Order } from "./slots2-queries";
import type { Args } from "./slots2-run";
import { createModel, dropModel, initializeSeed } from "./slots2-storage";
import { writeBatch } from "./slots2-writes";
import {
  applyStatements,
  configureClient,
  createTables,
  generateAndLoad,
  installRls,
  roleUrl,
  serverInfo,
  stageStatements,
} from "./storage";

export type TimedPlan = Omit<Plan, "Plans"> & {
  "Actual Total Time": number;
  "Actual Startup Time": number;
  Plans?: TimedPlan[];
};
export type DeepEvidence = Evidence & {
  nodes: { order: Order; off: TimedPlan[]; on: TimedPlan[] }[];
  boundaries: {
    filtered: boolean;
    empty: number;
    filled: number;
    offsets: Record<Order, number>;
  }[];
  samples: { model: string; scenario: string; round: number; rls: string; ms: number[] }[];
};
export function emptyEvidence(args: Args): DeepEvidence {
  return {
    protocol: {
      rows: args.rows ?? 200_000,
      writes: args.writes ?? 2000,
      warmup: args.warmup ?? 5,
      measure: args.measure ?? 30,
      seed: args.seed ?? 1,
    },
    environment: {},
    loadStart: loadavg(),
    loadEnd: [],
    reads: [],
    writes: [],
    checks: [],
    sizes: [],
    sql: {},
    notes: [],
    paired: [],
    backfill: {},
    outcomes: [],
    complete: false,
    nodes: [],
    boundaries: [],
    samples: [],
  };
}
export async function switchPolicy(db: pg.Client, model: string, enabled: boolean): Promise<void> {
  const table = model.startsWith("B")
    ? "bench_b.leads"
    : model === "S3"
      ? "bench_deep.records"
      : "bench_slot.records";
  await db.query(`alter table ${table} ${enabled ? "enable" : "disable"} row level security`);
}
export function inspectDeep(plan: Plan, cardinality: number) {
  const access = inspect(plan, cardinality);
  const nodes: Plan[] = [];
  const walk = (node: Plan) => {
    if (node["Subplan Name"]?.startsWith("InitPlan")) return;
    nodes.push(node);
    for (const child of node.Plans ?? []) walk(child);
  };
  walk(plan);
  const bounded = (node: Plan): boolean =>
    node["Node Type"] === "Limit" ||
    (node["Node Type"] === "CTE Scan" &&
      (node as Plan & { "CTE Name"?: string })["CTE Name"] === "page") ||
    ((node.Plans?.length ?? 0) > 0 && (node.Plans ?? []).every(bounded));
  access.fullSort = nodes.some(
    (node) =>
      node["Node Type"] === "Sort" &&
      (!(node.Plans ?? []).every(bounded) ||
        (node.Plans ?? []).some(
          (child) => (child["Actual Rows"] ?? 0) * (child["Actual Loops"] ?? 1) >= cardinality,
        )),
  );
  return access;
}
export async function measureCell(
  db: pg.Client,
  app: pg.Client,
  e: DeepEvidence,
  model: string,
  scenario: string,
  query: Query,
  p: ListParams,
  cardinality: number,
): Promise<void> {
  for (let round = 1; round <= 3; round++) {
    for (const enabled of [false, true]) {
      await switchPolicy(db, model, enabled);
      for (let i = 0; i < e.protocol.warmup; i++) await transaction(app, p.orgId, query);
      const plan = (await transaction(app, p.orgId, query, true)).rows[0]["QUERY PLAN"][0]
        .Plan as Plan;
      const ms: number[] = [];
      for (let i = 0; i < e.protocol.measure; i++) {
        const start = performance.now();
        await transaction(app, p.orgId, query);
        ms.push(performance.now() - start);
      }
      const access = inspectDeep(plan, cardinality);
      const ordered =
        /(?:Index (?:Only )?Scan (?:slot_ix_text_1\b|slot_ix_text_1_first\b|bl_x_company\b|bl_company_first\b))/.test(
          access.plan,
        ) && !access.fullSort;
      e.reads.push({
        ...access,
        ordered,
        section: 1,
        model,
        scenario,
        round,
        rls: enabled ? "on" : "off",
        median: percentile(ms, 0.5),
        p95: percentile(ms, 0.95),
        actual: cardinality,
        estimated: null,
      });
      e.samples.push({ model, scenario, round, rls: enabled ? "on" : "off", ms });
    }
  }
  await switchPolicy(db, model, true);
}
export async function runDeep(
  args: Args = {},
  progress: (s: string) => void = () => {},
): Promise<DeepEvidence> {
  const e = emptyEvidence(args);
  const baselineReport = await readFile(
    new URL("./results/record-storage-slots-2.md", import.meta.url),
    "utf8",
  );
  for (const line of baselineReport.split("\n")) {
    const match = line.match(
      /^\| A4b \/ (O[1-4] (?:plain|status) (?:first|offset5000|boundary)) \| \d+ \| [^|]+ \| [^/]+\/ ([\d.]+)/,
    );
    if (match) e.environment[`baseline ${match[1]}`] = Number(match[2]);
  }
  if (
    e.protocol.rows < 400 ||
    e.protocol.writes < 1 ||
    e.protocol.measure < 1 ||
    e.protocol.warmup < 0 ||
    e.protocol.writes * 2 > e.protocol.rows * 0.8
  )
    throw new Error("invalid protocol");
  const dir = await mkdtemp(
    join(process.env.PAPERCLIP_RUN_SCRATCH_DIR ?? tmpdir(), "crm-deep-pages-"),
  );
  let server: Awaited<ReturnType<typeof startLocalPostgres>> | undefined;
  const clients: pg.Client[] = [];
  const save = async () => {
    e.loadEnd = loadavg();
    if (args.json) await writeFile(args.json, JSON.stringify(e, null, 2));
    if (args.out) await writeFile(args.out, renderDeep(e));
  };
  try {
    server = await startLocalPostgres({ dataDir: dir });
    await ensureDatabase(server.urlFor("postgres"), "deep_pages");
    const url = server.urlFor("deep_pages");
    const db = new pg.Client({ connectionString: url });
    clients.push(db);
    await db.connect();
    await configureClient(db);
    const info = await serverInfo(db);
    e.environment = {
      ...e.environment,
      version: info.version.split(",")[0] ?? info.version,
      sharedBuffers: info.sharedBuffers,
      workMem: info.workMem,
      jit: info.jit,
      cpus: cpus().length,
      architecture: arch(),
      memoryGB: totalmem() / 1073741824,
    };
    const world = universe(e.protocol.seed);
    progress("load identical frozen dataset");
    await createTables(db);
    const loaded = await generateAndLoad(
      db,
      { seed: e.protocol.seed, scale: scaleCounts(e.protocol.rows) },
      { skipC: true },
    );
    for (const stage of ["A0", "A1", "A2", "A3", "B0", "B1"] as const)
      await applyStatements(db, stageStatements(stage, world.moduleLeads));
    await installRls(db);
    await db.query("create role bench_bypass login password 'bench_bypass' nosuperuser bypassrls");
    await initializeSeed(db, world);
    await createModel(db, "A4b", world);
    e.sql["S3 second indexes"] = (await copySlots(db)).join(";\n");
    await synchronizeTyped(db, world);
    const app = new pg.Client({ connectionString: roleUrl(url) });
    clients.push(app);
    await app.connect();
    await configureClient(app);
    const runtime = (
      await db.query("select rolsuper,rolbypassrls from pg_roles where rolname='bench_app'")
    ).rows[0];
    e.checks.push({
      name: "runtime role",
      pass: !runtime.rolsuper && !runtime.rolbypassrls,
      detail: "bench_app; neither superuser nor bypassrls",
    });
    const p = (await loadedParams(db, world, 1))[0];
    if (!p) throw new Error("missing params");
    for (const filtered of [false, true]) {
      const counts = (
        await db.query(
          `select count(*) filter(where ix_text_1 is null)::int as empty,count(*) filter(where ix_text_1 is not null)::int as filled from bench_slot.records where organization_id=$1 and module_id=$2 and deleted_at is null${filtered ? " and ix_text_3=$3" : ""}`,
          filtered ? [p.orgId, p.moduleId, p.leadStatus] : [p.orgId, p.moduleId],
        )
      ).rows[0];
      const offsets = Object.fromEntries(
        (Object.keys(ORDERS) as Order[]).map((o) => [
          o,
          Math.max(0, (ORDERS[o].nulls === "last" ? counts.filled : counts.empty) - 25),
        ]),
      ) as Record<Order, number>;
      e.boundaries.push({ filtered, ...counts, offsets });
    }
    e.notes.push(
      "Same MEP-103 baseline plus its 2,000-row precision cohort; B adds the exact same cohort. B annual_revenue widened to numeric(18,2) solely to hold that unqueried cohort. Typed B1 indexes retained, second company index added only for B-2. No planner tuning. All transaction timings include BEGIN, tenant setting, query and COMMIT; 51-row page.",
    );
    for (const variant of VARIANTS) {
      if (variant === "B-2") {
        const sql = secondTypedIndex(world.moduleLeads);
        e.sql["B-2 second index"] = sql;
        await db.query(sql);
        await db.query("vacuum analyze bench_b.leads");
      }
      for (const counts of e.boundaries)
        for (const order of Object.keys(ORDERS) as Order[])
          for (const [page, offset] of [
            ["first", 0],
            ["offset5000", 5000],
            ["boundary", counts.offsets[order]],
          ] as const) {
            const scenario = `${order} ${counts.filtered ? "status" : "plain"} ${page}`;
            const query = deepQuery(variant, order, offset, p, counts.filtered);
            const baseline = deepQuery("S1", order, offset, p, counts.filtered);
            e.sql[`${variant} ${scenario}`] = query.text;
            for (const enabled of [false, true]) {
              await switchPolicy(db, "S1", enabled);
              await switchPolicy(db, variant, enabled);
              const left = (await transaction(app, p.orgId, baseline)).rows.map((r) => r.id);
              const right = (await transaction(app, p.orgId, query)).rows.map((r) => r.id);
              e.checks.push({
                name: `${variant} ${scenario} ${enabled ? "on" : "off"}`,
                pass: JSON.stringify(left) === JSON.stringify(right),
                detail: `S1=${left.length}; variant=${right.length}; identity and order`,
              });
            }
            progress(`${variant} ${scenario}`);
            await measureCell(
              db,
              app,
              e,
              variant,
              scenario,
              query,
              p,
              counts.empty + counts.filled,
            );
            await save();
          }
    }
    for (const order of ["O1", "O2"] as const) {
      const query = deepQuery("S1", order, 5000, p, false);
      const pair: DeepEvidence["nodes"][number] = { order, off: [], on: [] };
      for (let i = 0; i < 5; i++)
        for (const enabled of [false, true]) {
          await switchPolicy(db, "S1", enabled);
          const q = { ...query, text: `explain(analyze,buffers,timing,format json) ${query.text}` };
          const plan = (await transaction(app, p.orgId, q)).rows[0]["QUERY PLAN"][0]
            .Plan as TimedPlan;
          pair[enabled ? "on" : "off"].push(plan);
        }
      e.nodes.push(pair);
    }
    await switchPolicy(db, "S1", true);
    progress("20-filled-slot writes with 20 and 36 slot indexes");
    for (const second of [false, true]) {
      await createModel(db, "A4b20", world);
      if (second)
        e.sql["36 write indexes"] = (await secondSlotIndexes(db, "bench_full")).join(";\n");
      const before = e.writes.length,
        sizeBefore = e.sizes.length;
      const statements = new Set<string>();
      const recordedApp = new Proxy(app, {
        get(target, key) {
          if (key === "query")
            return (...callArgs: unknown[]) => {
              if (typeof callArgs[0] === "string") statements.add(callArgs[0]);
              return Reflect.apply(target.query, target, callArgs);
            };
          return Reflect.get(target, key, target);
        },
      });
      await writeBatch(db, recordedApp, e, "A4b20", world, loaded.orgALeadIds);
      e.sql[`${second ? "S3" : "S1"} write statements`] = [...statements].join(";\n");
      for (const row of e.writes.slice(before)) row.model = second ? "S3 (36)" : "S1 (20)";
      for (const row of e.sizes.slice(sizeBefore)) row.model = second ? "S3 (36)" : "S1 (20)";
      await dropModel(db, "A4b20");
      await save();
    }
    e.complete = e.reads.length === 720 && e.checks.every((c) => c.pass);
    await save();
    progress(`complete=${e.complete}; cells=${bestPairs(e.reads).length}`);
    return e;
  } finally {
    for (const client of clients.reverse()) await client.end().catch(() => {});
    try {
      await server?.stop();
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  }
}
