import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { arch, cpus, loadavg, tmpdir, totalmem } from "node:os";
import { join } from "node:path";
import { ensureDatabase, startLocalPostgres } from "@crm/db/local-postgres";
import pg from "pg";
import { scaleCounts, stableUuid, syntheticLead, universe } from "./dataset";
import type { ListParams } from "./queries";
import { reportQuery } from "./queries";
import { loadedParams } from "./slot-queries";
import { equivalent, exactness, isolation } from "./slots2-checks";
import {
  type Evidence,
  inspect,
  measureRead,
  type Plan,
  type ReadSpec,
  rls,
  transaction,
  unbounded,
} from "./slots2-measure";
import {
  CORE,
  coreQuery,
  matrixQuery,
  ORDERS,
  type Order,
  sideNullQuery,
  slotReportQuery,
  twoStep,
} from "./slots2-queries";
import { outcomes, render } from "./slots2-report";
import { createModel, dropModel, initializeSeed, MODEL_SCHEMA } from "./slots2-storage";
import { backfill, writeBatch } from "./slots2-writes";
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

export type Args = {
  rows?: number;
  writes?: number;
  warmup?: number;
  measure?: number;
  seed?: number;
  out?: string;
  json?: string;
};
export async function runSlots2(
  args: Args = {},
  progress: (s: string) => void = () => {},
): Promise<Evidence> {
  const protocol = {
    rows: args.rows ?? 200_000,
    writes: args.writes ?? 2000,
    warmup: args.warmup ?? 5,
    measure: args.measure ?? 30,
    seed: args.seed ?? 1,
  };
  if (
    protocol.rows < 400 ||
    protocol.writes < 1 ||
    protocol.measure < 1 ||
    protocol.warmup < 0 ||
    protocol.writes * 2 > protocol.rows * 0.8
  )
    throw new Error("invalid benchmark protocol");
  const e: Evidence = {
    protocol,
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
  };
  const root = process.env.PAPERCLIP_RUN_SCRATCH_DIR ?? tmpdir();
  const dir = await mkdtemp(join(root, "crm-slots2-"));
  let server: Awaited<ReturnType<typeof startLocalPostgres>> | undefined;
  const clients: pg.Client[] = [];
  const save = async () => {
    e.loadEnd = loadavg();
    if (args.out) await writeFile(args.out, render(e));
    if (args.json) await writeFile(args.json, JSON.stringify(e, null, 2));
  };
  try {
    server = await startLocalPostgres({ dataDir: dir });
    await ensureDatabase(server.urlFor("postgres"), "slots2");
    const db = new pg.Client({ connectionString: server.urlFor("slots2") });
    clients.push(db);
    await db.connect();
    await configureClient(db);
    const info = await serverInfo(db);
    e.environment = {
      version: info.version.split(",")[0] ?? info.version,
      sharedBuffers: info.sharedBuffers,
      workMem: info.workMem,
      jit: info.jit,
      cpus: cpus().length,
      architecture: arch(),
      memoryGB: totalmem() / 1073741824,
    };
    const world = universe(protocol.seed);
    progress("load frozen A3/B1 synthetic dataset (C skipped)");
    await createTables(db);
    const loaded = await generateAndLoad(
      db,
      { seed: protocol.seed, scale: scaleCounts(protocol.rows) },
      { skipC: true },
    );
    for (const stage of ["A0", "A1", "A2", "A3", "B0", "B1"] as const)
      await applyStatements(db, stageStatements(stage, world.moduleLeads));
    await db.query("vacuum analyze bench_a.records");
    await db.query("vacuum analyze bench_b.leads");
    const inputs = await loadedParams(db, world, Math.max(30, protocol.measure));
    await installRls(db);
    await db.query("create role bench_bypass login password 'bench_bypass' nosuperuser bypassrls");
    await db.query("grant usage on schema bench_a,bench_b to bench_bypass");
    await db.query("grant select on all tables in schema bench_a,bench_b to bench_bypass");
    const connect = async (bypass = false) => {
      const url = new URL(roleUrl(server?.urlFor("slots2") ?? ""));
      if (bypass) {
        url.username = "bench_bypass";
        url.password = "bench_bypass";
      }
      const client = new pg.Client({ connectionString: url.toString() });
      clients.push(client);
      await client.connect();
      await configureClient(client);
      return client;
    };
    const app = await connect(),
      bypass = await connect(),
      writer = await connect();
    const runtime = (
      await db.query("select rolsuper,rolbypassrls from pg_roles where rolname='bench_app'")
    ).rows[0];
    e.checks.push({
      name: "runtime role neither superuser nor bypass",
      pass: !runtime.rolsuper && !runtime.rolbypassrls,
      detail: "bench_app; same role and tenant predicate as MEP-96",
    });
    await initializeSeed(db, world);
    progress("build A4b and A5 from identical seed");
    await createModel(db, "A4b", world);
    await createModel(db, "A5", world);
    e.notes.push(
      "The main organization has 200,000 baseline Leads at full scale plus a separate 2,000-row precision cohort. Contacts and second-organization Leads each retain the baseline 25% scale. The backfill targets exactly the original 200,000 rows, including soft-deleted records. A3/B1 data and SQL are unchanged; their report comparison excludes the precision cohort.",
    );
    const firstId = loaded.orgALeadIds[0];
    if (!firstId) throw new Error("missing lead id");
    for (const model of ["A4b", "A5"] as const)
      await isolation(db, app, e, world, model, firstId, syntheticLead(world, 30_000_000));
    progress("exact numeric operators/thresholds");
    await exactness(db, e, world);
    const min = (
      await db.query(
        `select ((ix_num_1::numeric)/100)::text as minimum from bench_slot.records
      where organization_id=$1 and module_id=$2 and deleted_at is null and ix_num_1 is not null
      order by ix_num_1 desc offset (select floor(count(*)*.1)::int from bench_slot.records where organization_id=$1 and module_id=$2 and deleted_at is null) limit 1`,
        [world.orgA, world.moduleLeads],
      )
    ).rows[0]?.minimum;
    const forScenario = (p: ListParams, scenario: string) =>
      scenario.startsWith("S14") ? { ...p, revenueMin: String(min) } : p;
    const specs = new Map<string, ReadSpec>();
    const measure = async (spec: ReadSpec) => {
      specs.set(`${spec.model}:${spec.scenario}`, spec);
      await measureRead(db, app, e, spec, progress);
      await save();
    };
    for (const scenario of CORE) {
      const queries = inputs.map((p, i) =>
        coreQuery(
          "A4b",
          scenario,
          forScenario(p, scenario),
          loaded.orgALeadIds[i % loaded.orgALeadIds.length] ?? firstId,
        ),
      );
      e.sql[`A4b ${scenario}`] = queries[0]?.text ?? "";
      for (const [i, p] of inputs.entries()) {
        const a = queries[i];
        if (!a) throw new Error("missing core query");
        const b = coreQuery(
          "A5",
          scenario,
          forScenario(p, scenario),
          loaded.orgALeadIds[i % loaded.orgALeadIds.length] ?? firstId,
        );
        await equivalent(db, e, `${scenario} A5/A4b parameters ${i}`, a, b, scenario !== "S8");
        if (["S3", "S14 (a)", "S2-OFFSET"].includes(scenario))
          await equivalent(
            db,
            e,
            `${scenario} late document parameters ${i}`,
            a,
            twoStep(
              "A4b",
              scenario as "S3" | "S14 (a)" | "S2-OFFSET",
              forScenario(p, scenario),
              firstId,
            ),
            true,
          );
      }
      await measure({
        section: scenario === "S8" ? 7 : ["S3", "S14 (a)", "S14 (b)"].includes(scenario) ? 1 : 6,
        model: "A4b",
        scenario,
        queries,
        org: world.orgA,
        filtered: true,
      });
      if (["S3", "S14 (a)", "S2-OFFSET"].includes(scenario)) {
        const queries = inputs.map((p) =>
          twoStep(
            "A4b",
            scenario as "S3" | "S14 (a)" | "S2-OFFSET",
            forScenario(p, scenario),
            firstId,
          ),
        );
        e.sql[`${scenario} two step`] = queries[0]?.text ?? "";
        await measure({
          section: 1,
          model: "A4b",
          scenario: `${scenario} two step`,
          queries,
          org: world.orgA,
          filtered: true,
          count: unbounded(
            coreQuery(
              "A4b",
              scenario,
              forScenario(
                inputs[0] ??
                  (() => {
                    throw new Error("missing input");
                  })(),
                scenario,
              ),
              firstId,
            ),
          ),
        });
      }
    }
    for (const scenario of [
      "S2",
      "S2-KEYSET",
      "S2-OFFSET",
      "S3",
      "S5",
      "S11",
      "S14 (b)",
      "S2 count",
    ] as const) {
      const queries = inputs.map((p) =>
        coreQuery("A5", scenario, forScenario(p, scenario), firstId),
      );
      e.sql[`A5 ${scenario}`] = queries[0]?.text ?? "";
      await measure({
        section: 6,
        model: "A5",
        scenario,
        queries,
        org: world.orgA,
        filtered: true,
      });
    }
    // The company slot already has a measured 10–50% NULL fraction.
    const p = inputs[0];
    if (!p) throw new Error("missing loaded parameters");
    const nulls = (
      await db.query(
        `select count(*)::int as total,count(*) filter(where ix_text_1 is null)::int as empty from bench_slot.records where organization_id=$1 and module_id=$2 and deleted_at is null`,
        [world.orgA, world.moduleLeads],
      )
    ).rows[0];
    e.notes.push(
      `Sort field: company / ix_text_1. NULL share ${((100 * nulls.empty) / nulls.total).toFixed(3)}% (${nulls.empty}/${nulls.total} live rows, including precision cohort).`,
    );
    e.checks.push({
      name: "matrix NULL share 10–50%",
      pass: nulls.empty / nulls.total >= 0.1 && nulls.empty / nulls.total <= 0.5,
      detail: `empty=${nulls.empty}; total=${nulls.total}`,
    });
    for (const model of ["A4b", "A4bn"] as const) {
      if (model === "A4bn") {
        progress("build non-null partial index variant");
        await createModel(db, model, world);
      }
      for (const filtered of [false, true]) {
        const counts = (
          await db.query(
            `select count(*) filter(where ix_text_1 is null)::int as empty,count(*) filter(where ix_text_1 is not null)::int as filled
          from ${MODEL_SCHEMA[model]}.records where organization_id=$1 and module_id=$2 and deleted_at is null${filtered ? " and ix_text_3=$3" : ""}`,
            filtered
              ? [world.orgA, world.moduleLeads, p.leadStatus]
              : [world.orgA, world.moduleLeads],
          )
        ).rows[0];
        for (const order of Object.keys(ORDERS) as Order[]) {
          const boundary = ORDERS[order].nulls === "last" ? counts.filled : counts.empty;
          for (const [page, offset] of [
            ["first", 0],
            ["boundary", Math.max(0, boundary - 25)],
            ["offset5000", 5000],
          ] as const) {
            const single = matrixQuery(model, order, offset, p, filtered, false);
            const split = order === "O3" || order === "O4";
            const query = matrixQuery(model, order, offset, p, filtered, split);
            if (split)
              await equivalent(
                db,
                e,
                `${model} ${order} ${filtered} ${page} two arms`,
                single,
                query,
              );
            const scenario = `${order} ${filtered ? "status" : "plain"} ${page}`;
            await measure({
              section: 2,
              model,
              scenario,
              queries: [query],
              org: world.orgA,
              pureSort: !filtered,
              filtered: true,
            });
            if (split)
              await measure({
                section: 2,
                model,
                scenario: `${scenario} single alternate`,
                queries: [single],
                org: world.orgA,
                pureSort: !filtered,
                filtered: true,
              });
            if (model === "A4b" && split && page === "first" && !filtered)
              e.sql[`${order} two arms`] = query.text;
            if (model === "A4b" && (order === "O1" || order === "O3") && !filtered)
              await equivalent(
                db,
                e,
                `A5 absence ${order} ${page}`,
                single,
                sideNullQuery(order, p, offset),
              );
          }
        }
      }
      if (model === "A4bn") await dropModel(db, model);
    }
    for (const predicate of ["null", "not null"] as const)
      await equivalent(
        db,
        e,
        `A5 absence is ${predicate}`,
        {
          text: `select id::text from bench_slot.records where organization_id=$1 and module_id=$2 and deleted_at is null and ix_text_1 is ${predicate} order by ix_text_1 asc nulls last,id asc limit 51`,
          values: [world.orgA, world.moduleLeads],
        },
        sideNullQuery("O1", p, 0, predicate),
      );
    progress("skewed slot distribution");
    await db.query(
      `with ranked as (select id,row_number() over(order by id)::int as n from bench_slot.records where organization_id=$1 and module_id=$2 and deleted_at is null)
      update bench_slot.records r set ix_text_8=case when ranked.n<= $3::int then 'hot' when ranked.n<= $4::int then 'cold' else 'other' end
      from ranked where r.organization_id=$1 and r.id=ranked.id`,
      [
        world.orgA,
        world.moduleLeads,
        Math.floor(nulls.total * 0.9),
        Math.floor(nulls.total * 0.901),
      ],
    );
    await db.query("analyze bench_slot.records");
    for (const value of ["hot", "cold"]) {
      const values = [world.orgA, world.moduleLeads, value];
      const text =
        "from bench_slot.records where organization_id=$1 and module_id=$2 and deleted_at is null and ix_text_8=$3";
      for (const count of [false, true])
        await measure({
          section: 3,
          model: "A4b",
          scenario: `skew ${value} ${count ? "count" : "first"}`,
          queries: [
            {
              text: count
                ? `select count(*)::int as n ${text}`
                : `select ${"id::text"} ${text} order by ix_text_1 asc nulls last,bench_slot.records.id asc limit 50`,
              values,
            },
          ],
          org: world.orgA,
          filtered: true,
        });
    }
    await db.query("update bench_slot.records set ix_text_8=null");
    progress("mixed communities and MCV trigger");
    await createModel(db, "A4bmix", world);
    const third = stableUuid(1, "third-module");
    await db.query(
      `insert into bench_mix.records (${["id", "organization_id", "module_id", "owner_id", "created_by", "updated_by", "created_at", "updated_at", "deleted_at", "version", "name", "search", "data"].join(",")})
      select md5(id::text||'third')::uuid,organization_id,$3::uuid,owner_id,created_by,updated_by,created_at,updated_at,deleted_at,version,name,search,data from bench_seed.records
      where organization_id=$1 and module_id=$2 order by id limit $4`,
      [world.orgA, world.moduleContacts, third, Math.max(400, Math.round(protocol.rows * 0.1))],
    );
    await db.query(
      `with ranked as(select organization_id,id,module_id,row_number() over(partition by organization_id,module_id order by id) as n from bench_mix.records)
      update bench_mix.records r set ix_text_1=case when r.organization_id=$1 and r.module_id=$2 then 'lead-'||r.id::text
      when r.module_id=$3 then 'contact-'||(ranked.n%5)::text when r.module_id=$4 then 'third-'||(ranked.n%100)::text
      else case when ranked.n%10<8 then 'second-common' else 'second-rare' end end
      from ranked where r.organization_id=ranked.organization_id and r.id=ranked.id`,
      [world.orgA, world.moduleLeads, world.moduleContacts, third],
    );
    await db.query("vacuum analyze bench_mix.records");
    const communities = [
      { label: "org1 leads unique", org: world.orgA, module: world.moduleLeads },
      { label: "org1 contacts five", org: world.orgA, module: world.moduleContacts },
      { label: "org2 leads skewed", org: world.orgB, module: world.moduleLeads },
      { label: "org1 third hundred", org: world.orgA, module: third },
    ];
    const mixed: ReadSpec[] = [];
    for (const c of communities) {
      const value = (
        await db.query(
          "select ix_text_1 from bench_mix.records where organization_id=$1 and module_id=$2 and deleted_at is null order by id limit 1",
          [c.org, c.module],
        )
      ).rows[0].ix_text_1;
      const query = {
        text: "select id::text from bench_mix.records where organization_id=$1 and module_id=$2 and deleted_at is null and ix_text_1=$3 order by ix_text_2 asc nulls last,bench_mix.records.id asc limit 50",
        values: [c.org, c.module, value],
      };
      const spec = {
        section: 4,
        model: "A4bmix",
        scenario: c.label,
        queries: [query],
        org: c.org,
        filtered: true,
      };
      mixed.push(spec);
      await measure(spec);
    }
    const diverged = e.reads
      .filter((r) => r.section === 4 && r.rls === "on")
      .some(
        (r) =>
          r.actual !== null &&
          r.estimated !== null &&
          Math.max(r.actual / Math.max(r.estimated, 1), r.estimated / Math.max(r.actual, 1)) > 10,
      );
    if (diverged) {
      await db.query(
        "create statistics mix_mcv(mcv) on module_id,ix_text_1 from bench_mix.records",
      );
      await db.query("analyze bench_mix.records");
      for (const spec of mixed) await measure({ ...spec, scenario: `${spec.scenario} MCV` });
    }
    e.notes.push(
      `Mixed communities: lead company is nearly unique, Contacts have five values, the second organization is skewed 80/20, third module has 100 values. MCV trigger (>10x predicate estimate/count)=${diverged}. No other planner tuning.`,
    );
    await dropModel(db, "A4bmix");
    progress("S10 slot reports versus frozen A3/B1");
    await db.query("update bench_slot.records set ix_time_2=created_at");
    await db.query("vacuum analyze bench_slot.records");
    for (const owner of [false, true]) {
      const scenario = owner ? "S10 owner" : "S10 source";
      for (const model of ["A3", "B1", "A4b"]) {
        const query =
          model === "A4b"
            ? slotReportQuery(owner, p)
            : reportQuery(model === "A3" ? "A" : "B", owner, p);
        e.sql[`${model} ${scenario}`] = query.text;
        await measure({ section: 7, model, scenario, queries: [query], org: world.orgA });
      }
      // Exclude only the extra precision cohort for the cross-model exact aggregate check.
      const slot = slotReportQuery(owner, p);
      slot.text = slot.text.replace(
        "group by",
        "and id in(select id from bench_a.records) group by",
      );
      await equivalent(
        db,
        e,
        `${scenario} exact aggregate vs A3`,
        reportQuery("A", owner, p),
        slot,
        true,
      );
    }
    await db.query("update bench_slot.records set ix_time_2=null");
    await db.query("vacuum analyze bench_slot.records");
    progress("30 paired RLS measurements");
    for (const scenario of ["S2-KEYSET", "S3", "S5", "S11", "S14 (b)"]) {
      const spec = specs.get(`A4b:${scenario}`);
      if (!spec) throw new Error("missing paired spec");
      const q = spec.queries[0];
      if (!q) throw new Error("missing paired query");
      await rls(db, "A4b", false);
      const off = inspect(
        (await transaction(app, world.orgA, q, true)).rows[0]["QUERY PLAN"][0].Plan as Plan,
      );
      await rls(db, "A4b", true);
      const bypassPlan = inspect(
        (await transaction(bypass, world.orgA, q, true)).rows[0]["QUERY PLAN"][0].Plan as Plan,
      );
      const ratios: number[] = [];
      for (let i = 0; i < 5; i++) {
        await transaction(bypass, world.orgA, spec.queries[i % spec.queries.length] ?? q);
        await transaction(app, world.orgA, spec.queries[i % spec.queries.length] ?? q);
      }
      for (let i = 0; i < 30; i++) {
        const query = spec.queries[i % spec.queries.length] ?? q;
        let start = performance.now();
        await transaction(bypass, world.orgA, query);
        const offMs = performance.now() - start;
        start = performance.now();
        await transaction(app, world.orgA, query);
        ratios.push((performance.now() - start) / offMs);
      }
      ratios.sort((a, b) => a - b);
      const middle = ratios.slice(14, 16);
      e.paired.push({
        scenario,
        ratio: middle.reduce((a, b) => a + b, 0) / 2,
        planSame: off.plan === bypassPlan.plan && off.buffers === bypassPlan.buffers,
      });
    }
    progress("reload identical 10-field A4b/A5 before writes (remove diagnostic-update history)");
    await dropModel(db, "A4b");
    await dropModel(db, "A5");
    await createModel(db, "A4b", world);
    await createModel(db, "A5", world);
    progress("single-run writes: identical 10-field A4b/A5");
    await writeBatch(db, app, e, "A4b", world, loaded.orgALeadIds);
    await writeBatch(db, app, e, "A5", world, loaded.orgALeadIds);
    await dropModel(db, "A5");
    await dropModel(db, "A4b");
    await createModel(db, "A4b", world);
    progress("module lock writes");
    await writeBatch(db, app, e, "A4b", world, loaded.orgALeadIds, true, ["insert", "update1"]);
    await dropModel(db, "A4b");
    await createModel(db, "A4b", world);
    for (const model of ["A4b20", "A520"] as const) {
      progress(`build/write ${model} (20 assigned and populated fields)`);
      await createModel(db, model, world);
      await isolation(db, app, e, world, model, firstId, syntheticLead(world, 30_000_001));
      if (model === "A4b20") {
        const n = (
          await db.query(
            `select count(*)::int as n from bench_full.records where organization_id=$1 and module_id=$2 and
          (${Object.values((await import("./slots2-storage")).ALL_SLOTS)
            .map((slot) => `${slot} is null`)
            .join(" or ")})`,
            [world.orgA, world.moduleLeads],
          )
        ).rows[0].n;
        e.checks.push({
          name: "20 slots populated",
          pass: n === 0,
          detail: `incomplete Leads=${n}`,
        });
      }
      await writeBatch(db, app, e, model, world, loaded.orgALeadIds);
      await dropModel(db, model);
      await save();
    }
    progress("backfill with 50-Hz concurrent writer");
    await backfill(db, writer, e, world, progress);
    const ops = (
      await db.query(`select o.oprname as operator,p.proname,p.proleakproof from pg_operator o join pg_proc p on p.oid=o.oprcode
      where o.oprleft='bigint'::regtype and o.oprright='bigint'::regtype and o.oprname in('=','<','<=','>','>=') order by o.oprname`)
    ).rows;
    e.notes.push(
      `bigint leakproof catalog (MEP-96 flags verified and completed): ${ops.map((r) => `${r.operator} / ${r.proname} / ${r.proleakproof}`).join("; ")}.`,
    );
    outcomes(e);
    e.complete = true;
    await save();
    return e;
  } finally {
    for (const client of clients.reverse()) await client.end().catch(() => undefined);
    await server?.stop();
    await rm(dir, { recursive: true, force: true });
  }
}
