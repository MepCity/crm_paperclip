import pg from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { syntheticLead, universe } from "./dataset";
import { reportQuery } from "./queries";
import { loadedParams } from "./slot-queries";
import { equivalent, exactness, isolation } from "./slots2-checks";
import { type Evidence, inspect, type Plan, rls, transaction } from "./slots2-measure";
import {
  CORE,
  coreQuery,
  matrixQuery,
  type Order,
  sideNullQuery,
  slotReportQuery,
  twoStep,
} from "./slots2-queries";
import { createModel, initializeSeed, insertModel, MODEL_SCHEMA } from "./slots2-storage";
import { backfill, writeBatch } from "./slots2-writes";
import {
  applyStatements,
  configureClient,
  createTables,
  generateAndLoad,
  installRls,
  roleUrl,
  stageStatements,
} from "./storage";

const world = universe(1);
let db: pg.Client, app: pg.Client, writer: pg.Client;
let ids: string[];
const evidence = (): Evidence => ({
  protocol: { rows: 800, writes: 4, warmup: 1, measure: 2, seed: 1 },
  environment: {},
  loadStart: [],
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
});
beforeAll(async () => {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("missing test database");
  db = new pg.Client({ connectionString: url });
  await db.connect();
  await configureClient(db);
  await createTables(db);
  ids = (
    await generateAndLoad(
      db,
      { seed: 1, scale: { leadsA: 800, contactsA: 200, leadsB: 200 } },
      { skipC: true },
    )
  ).orgALeadIds;
  for (const stage of ["A0", "A1", "A2", "A3", "B0", "B1"] as const)
    await applyStatements(db, stageStatements(stage, world.moduleLeads));
  await installRls(db);
  await db.query("create role bench_bypass login password 'bench_bypass' bypassrls");
  await initializeSeed(db, world);
  for (const model of ["A4b", "A4bn", "A4b20", "A5", "A520"] as const)
    await createModel(db, model, world);
  app = new pg.Client({ connectionString: roleUrl(url) });
  writer = new pg.Client({ connectionString: roleUrl(url) });
  await app.connect();
  await writer.connect();
  await configureClient(app);
  await configureClient(writer);
});
afterAll(async () => {
  await writer?.end();
  await app?.end();
  await db?.end();
});
const allPass = (e: Evidence) => expect(e.checks.filter((c) => !c.pass)).toEqual([]);
describe("second slot evidence database checks", () => {
  it("compares every exact threshold/operator against numeric documents including 16-digit cents", async () => {
    const e = evidence();
    await exactness(db, e, world);
    allPass(e);
    expect(e.checks.filter((c) => c.name.startsWith("exact "))).toHaveLength(48);
    expect(e.notes[0]).not.toContain("0/48");
  }, 60_000);
  it("compares nonempty core pages and late document reads for every loaded parameter set", async () => {
    const e = evidence(),
      params = await loadedParams(db, world, 3);
    const id = ids[0] ?? world.orgA;
    for (const scenario of CORE)
      for (const [i, p] of params.entries()) {
        const a = coreQuery("A4b", scenario, p, id),
          b = coreQuery("A5", scenario, p, id);
        await equivalent(db, e, `${scenario}:${i}`, a, b, true);
        if (["S3", "S14 (a)", "S2-OFFSET"].includes(scenario))
          await equivalent(
            db,
            e,
            `late:${scenario}:${i}`,
            a,
            twoStep("A4b", scenario as "S3" | "S14 (a)" | "S2-OFFSET", p, id),
            true,
          );
      }
    allPass(e);
    for (const scenario of ["S2", "S3", "S5", "S11", "S14 (b)"] as const) {
      const q = coreQuery(
        "A4b",
        scenario,
        params[0] ??
          (() => {
            throw new Error("missing params");
          })(),
        id,
      );
      expect((await db.query(q.text, q.values)).rows.length).toBeGreaterThan(0);
    }
  });
  it("uses the composite primary key with identical S8 off/on plans and buffers", async () => {
    const p = (await loadedParams(db, world, 1))[0];
    if (!p) throw new Error("missing input");
    const q = coreQuery("A4b", "S8", p, ids[0] ?? world.orgA);
    await rls(db, "A4b", false);
    const off = inspect(
      (await transaction(app, world.orgA, q, true)).rows[0]["QUERY PLAN"][0].Plan as Plan,
    );
    await rls(db, "A4b", true);
    const on = inspect(
      (await transaction(app, world.orgA, q, true)).rows[0]["QUERY PLAN"][0].Plan as Plan,
    );
    expect(on.plan).toContain("records_pkey");
    expect(off.plan).toBe(on.plan);
    expect(off.buffers).toBe(on.buffers);
  });
  it("keeps exact S10 totals at the same decimal scale as the original baseline", async () => {
    await db.query("update bench_slot.records set ix_time_2=created_at");
    const p = (await loadedParams(db, world, 1))[0];
    if (!p) throw new Error("missing input");
    const e = evidence();
    for (const owner of [false, true]) {
      const q = slotReportQuery(owner, p);
      q.text = q.text.replace("group by", "and id in(select id from bench_a.records) group by");
      await equivalent(db, e, "S10 aggregate", reportQuery("A", owner, p), q, true);
    }
    allPass(e);
    await db.query("update bench_slot.records set ix_time_2=null");
  });
  it("keeps all null directions, boundaries, filters and side-row absence equivalent", async () => {
    const e = evidence(),
      p = (await loadedParams(db, world, 1))[0];
    if (!p) throw new Error("missing input");
    for (const model of ["A4b", "A4bn"] as const)
      for (const filtered of [false, true]) {
        const counts = (
          await db.query(
            `select count(*) filter(where ix_text_1 is null)::int as empty,count(*) filter(where ix_text_1 is not null)::int as filled from ${MODEL_SCHEMA[model]}.records where organization_id=$1 and module_id=$2 and deleted_at is null${filtered ? " and ix_text_3=$3" : ""}`,
            filtered
              ? [world.orgA, world.moduleLeads, p.leadStatus]
              : [world.orgA, world.moduleLeads],
          )
        ).rows[0];
        for (const order of ["O1", "O2", "O3", "O4"] as Order[])
          for (const offset of [
            0,
            Math.max(0, (order === "O1" || order === "O3" ? counts.filled : counts.empty) - 25),
            5000,
          ]) {
            const single = matrixQuery(model, order, offset, p, filtered, false);
            if (order === "O3" || order === "O4")
              await equivalent(
                db,
                e,
                `${model}:${order}:${filtered}:${offset}`,
                single,
                matrixQuery(model, order, offset, p, filtered, true),
              );
            if (!filtered && (order === "O1" || order === "O3"))
              await equivalent(
                db,
                e,
                `side:${model}:${order}:${offset}`,
                single,
                sideNullQuery(order, p, offset),
              );
          }
      }
    for (const predicate of ["null", "not null"] as const)
      await equivalent(
        db,
        e,
        `side ${predicate}`,
        {
          text: `select id::text from bench_slot.records where organization_id=$1 and module_id=$2 and deleted_at is null and ix_text_1 is ${predicate} order by ix_text_1 asc nulls last,bench_slot.records.id asc limit 51`,
          values: [world.orgA, world.moduleLeads],
        },
        sideNullQuery("O1", p, 0, predicate),
      );
    allPass(e);
  });
  it("enforces RLS on documents and indexed values as the runtime role", async () => {
    const e = evidence();
    for (const model of ["A4b", "A5", "A4b20", "A520"] as const)
      await isolation(
        db,
        app,
        e,
        world,
        model,
        ids[0] ?? world.orgA,
        syntheticLead(world, 33_000_000),
      );
    allPass(e);
  });
  it("rejects third-decimal writes before storage and persists negative zero as zero", async () => {
    const r = syntheticLead(world, 34_000_000);
    r.dataJson = JSON.stringify({ ...JSON.parse(r.dataJson), annual_revenue: "1.001" });
    await app.query("begin");
    await app.query("select set_config('app.org_id',$1,true)", [world.orgA]);
    await expect(insertModel(app, "A4b", r, world)).rejects.toThrow("decimal places");
    expect(
      (await app.query("select id from bench_slot.records where id=$1", [r.id])).rows,
    ).toHaveLength(0);
    r.dataJson = JSON.stringify({ ...JSON.parse(r.dataJson), annual_revenue: "-0" });
    await insertModel(app, "A4b", r, world);
    expect(
      (await app.query("select ix_num_1 from bench_slot.records where id=$1", [r.id])).rows[0]
        .ix_num_1,
    ).toBe("0");
    await app.query("rollback");
  });
  it("maintains documents/slots/side values and events in all ten/twenty-field writes", async () => {
    const e = evidence();
    for (const model of ["A4b", "A5", "A4b20", "A520"] as const)
      await writeBatch(db, app, e, model, world, ids);
    allPass(e);
    expect(e.writes).toHaveLength(12);
    expect(e.writes.every((w) => w.wal > 0)).toBe(true);
  });
  it("backfills from current documents with concurrent writers and detects NULL corruption", async () => {
    const e = evidence();
    await backfill(db, writer, e, world, () => {});
    allPass(e);
    expect(e.backfill.rows).toBe(800);
    expect(e.backfill.writerOperations).toBeGreaterThan(0);
    expect([e.backfill.initialCount, e.backfill.corruptedCount, e.backfill.repairedCount]).toEqual([
      0, 200, 0,
    ]);
  });
});
