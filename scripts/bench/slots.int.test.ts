import pg from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { syntheticLead, universe } from "./dataset";
import { assertSame } from "./exec";
import { LEAD_SLOTS, SLOT_COLUMNS, slotIndexes } from "./slot-layout";
import { loadedParams, paramsForScenario, SLOT_SCENARIOS, scenarioQuery } from "./slot-queries";
import { inspectSlots, type SlotPlan } from "./slots";
import {
  applyStatements,
  configureClient,
  createATable,
  createTables,
  generateAndLoad,
  insertRecord,
  installRls,
  nextEventId,
  roleUrl,
  setRls,
  stageStatements,
  updateFive,
  updateStatus,
  verifyRls,
} from "./storage";

let db: pg.Client;
let app: pg.Client;
let ids: string[];
const world = universe(11);
beforeAll(async () => {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("missing test database");
  db = new pg.Client({ connectionString: url });
  await db.connect();
  await configureClient(db);
  await createTables(db);
  await db.query("drop table bench_a.records");
  await createATable(db, true);
  const loaded = await generateAndLoad(
    db,
    { seed: 11, scale: { leadsA: 800, contactsA: 200, leadsB: 200 } },
    { skipC: true, slots: true },
  );
  ids = loaded.orgALeadIds;
  await applyStatements(db, stageStatements("A0", world.moduleLeads));
  await applyStatements(db, stageStatements("B0", world.moduleLeads));
  await installRls(db);
  app = new pg.Client({ connectionString: roleUrl(url) });
  await app.connect();
  await configureClient(app);
});
afterAll(async () => {
  await app?.end();
  await db?.end();
});

describe("typed slots on records", () => {
  it("returns identical ordered identities for A3/A4 with RLS off/on and non-null indexes", async () => {
    const inputs = await loadedParams(db, world, 3);
    for (const nonNull of [false, true]) {
      await applyStatements(db, slotIndexes(nonNull));
      await db.query("vacuum analyze bench_a.records");
      const catalog = await db.query(
        "select indexname, indexdef from pg_indexes where schemaname = 'bench_a' and indexname like 'a_slot_%'",
      );
      expect(catalog.rows).toHaveLength(20);
      for (const enabled of [false, true]) {
        await setRls(db, enabled);
        await app.query("begin");
        try {
          await app.query("select set_config('app.org_id', $1, true)", [world.orgA]);
          for (const scenario of SLOT_SCENARIOS)
            for (const input of inputs) {
              const p = paramsForScenario(input, scenario);
              const a3 = scenarioQuery("A3", scenario, p, ids[0] ?? "");
              const a4 = scenarioQuery("A4", scenario, p, ids[0] ?? "");
              const r3 = await app.query(a3.text, a3.values),
                r4 = await app.query(a4.text, a4.values);
              assertSame(`${scenario} nonNull=${nonNull} RLS=${enabled}`, r3.rows, r4.rows);
              if (["S2", "S2-KEYSET", "S3", "S4", "S5", "S11", "S14"].includes(scenario))
                expect(r4.rows.length, scenario).toBeGreaterThan(0);
            }
          // Null company tails must remain equivalent with indexes omitting NULLs.
          const p = inputs[0];
          if (!p) throw new Error("missing input");
          const nullCursor = await app.query(
            "select id::text from bench_a.records where module_id = $1::uuid and deleted_at is null and ix_text_1 is null and ix_text_3 = $2 order by id limit 1",
            [world.moduleLeads, p.leadStatus],
          );
          if (nullCursor.rows[0]) {
            const next = { ...p, cursorCompany: null, cursorId: String(nullCursor.rows[0].id) };
            const a3 = scenarioQuery("A3", "S2-KEYSET", next, ""),
              a4 = scenarioQuery("A4", "S2-KEYSET", next, "");
            assertSame(
              "null tail",
              (await app.query(a3.text, a3.values)).rows,
              (await app.query(a4.text, a4.values)).rows,
            );
          }
        } finally {
          await app.query("rollback");
        }
      }
      for (const { name } of SLOT_COLUMNS) await db.query(`drop index bench_a.a_slot_${name}`);
    }
  }, 120_000);

  it("keeps real typed filter conditions usable by an unprivileged RLS role", async () => {
    await applyStatements(db, slotIndexes(false));
    await db.query("vacuum analyze bench_a.records");
    await setRls(db, true);
    const input = (await loadedParams(db, world, 1))[0];
    if (!input) throw new Error("missing input");
    await app.query("begin");
    try {
      await app.query("select set_config('app.org_id', $1, true)", [world.orgA]);
      await app.query("set local enable_seqscan = off");
      for (const [slot, type, value] of [
        ["ix_text_3", "text", input.leadStatus],
        ["ix_num_1", "double precision", input.revenueMin],
        ["ix_time_1", "timestamptz", "2026-01-01T00:00:00.000Z"],
        ["ix_ref_1", "uuid", input.contactId],
      ]) {
        const result = await app.query(
          `explain (analyze, buffers, format json) select id from bench_a.records
          where organization_id = $1::uuid and module_id = $2::uuid and deleted_at is null and ${slot} = $3::${type}`,
          [world.orgA, world.moduleLeads, value],
        );
        const plan = result.rows[0]?.["QUERY PLAN"][0]?.Plan as SlotPlan;
        expect(inspectSlots(plan).indexCond, String(slot)).toBe(true);
      }
    } finally {
      await app.query("rollback");
    }
    const checks = await verifyRls(db, app, world, ids[0] ?? "");
    expect(checks.every((check) => check.pass)).toBe(true);
  }, 60_000);

  it("updates document and slots in one write statement and mixes contact slot assignments", async () => {
    await setRls(db, true);
    const record = syntheticLead(world, 40_000_000);
    await app.query("begin");
    try {
      await app.query("select set_config('app.org_id', $1, true)", [world.orgA]);
      await insertRecord(app, "A", record, nextEventId(41_000_000), true);
      await updateStatus(
        app,
        "A",
        record.id,
        world.orgA,
        "lead_status_1",
        record.updatedBy,
        nextEventId(41_000_001),
        true,
      );
      await updateFive(
        app,
        "A",
        record.id,
        world.orgA,
        {
          leadStatus: "lead_status_2",
          company: "Synthetic updated company",
          city: "Synthetic city",
          annualRevenue: "987654.32",
          cfText: "Synthetic note",
        },
        record.updatedBy,
        nextEventId(41_000_002),
        true,
      );
      const r = await app.query("select * from bench_a.records where id = $1::uuid", [record.id]);
      const row = r.rows[0];
      for (const [key, slot] of Object.entries(LEAD_SLOTS)) {
        const expected = row.data[key] ?? null;
        const actual = row[slot] instanceof Date ? row[slot].toISOString() : row[slot];
        expect(actual, key).toEqual(expected);
      }
      expect(row.ix_text_8).toBeNull();
      expect(row.ix_num_2).toBeNull();
      expect(row.data.email_opt_out).toBeTypeOf("boolean");
      const contacts = await app.query(
        "select data, ix_text_1, ix_text_2, ix_text_3, ix_text_4 from bench_a.records where module_id = $1::uuid limit 20",
        [world.moduleContacts],
      );
      expect(contacts.rows.length).toBeGreaterThan(0);
      for (const c of contacts.rows) {
        expect(c.ix_text_1).toBe(c.data.last_name ?? null);
        expect(c.ix_text_2).toBe(c.data.company ?? null);
        expect(c.ix_text_3).toBe(c.data.email ?? null);
        expect(c.ix_text_4).toBeNull();
      }
    } finally {
      await app.query("rollback");
    }
  }, 60_000);
});
