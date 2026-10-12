import pg from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { universe } from "./dataset";
import { deepQuery, VARIANTS } from "./deep-pages-queries";
import { switchPolicy } from "./deep-pages-run";
import { copySlots, secondTypedIndex, synchronizeTyped } from "./deep-pages-storage";
import { loadedParams } from "./slot-queries";
import { transaction } from "./slots2-measure";
import { ORDERS, type Order } from "./slots2-queries";
import { createModel, initializeSeed } from "./slots2-storage";
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
let db: pg.Client, app: pg.Client;
beforeAll(async () => {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("missing test database");
  db = new pg.Client({ connectionString: url });
  await db.connect();
  await configureClient(db);
  await createTables(db);
  await generateAndLoad(
    db,
    { seed: 1, scale: { leadsA: 800, contactsA: 200, leadsB: 200 } },
    { skipC: true },
  );
  for (const stage of ["A0", "B0", "B1"] as const)
    await applyStatements(db, stageStatements(stage, world.moduleLeads));
  await installRls(db);
  await db.query("create role bench_deep_bypass login password 'bench_deep_bypass' bypassrls");
  await initializeSeed(db, world);
  const storageDb = new Proxy(db, {
    get(target, key) {
      if (key === "query")
        return (...args: unknown[]) => {
          if (typeof args[0] === "string")
            args[0] = args[0].replaceAll("bench_bypass", "bench_deep_bypass");
          return Reflect.apply(target.query, target, args);
        };
      return Reflect.get(target, key, target);
    },
  });
  await createModel(storageDb, "A4b", world);
  await copySlots(storageDb);
  await synchronizeTyped(db, world);
  app = new pg.Client({ connectionString: roleUrl(url) });
  await app.connect();
  await configureClient(app);
});
afterAll(async () => {
  await app?.end();
  await db?.end();
});
describe("deep-page forms", () => {
  it("matches S1 identities/order for every form, direction, null placement and policy", async () => {
    const p = (await loadedParams(db, world, 1))[0];
    if (!p) throw new Error("missing params");
    let checks = 0;
    for (const variant of VARIANTS) {
      if (variant === "B-2") await db.query(secondTypedIndex(world.moduleLeads));
      for (const filtered of [false, true]) {
        const c = (
          await db.query(
            `select count(*) filter(where ix_text_1 is null)::int as empty,count(*) filter(where ix_text_1 is not null)::int as filled from bench_slot.records where organization_id=$1 and module_id=$2 and deleted_at is null${filtered ? " and ix_text_3=$3" : ""}`,
            filtered ? [p.orgId, p.moduleId, p.leadStatus] : [p.orgId, p.moduleId],
          )
        ).rows[0];
        expect(c.empty).toBeGreaterThan(0);
        expect(c.filled).toBeGreaterThan(0);
        for (const order of Object.keys(ORDERS) as Order[])
          for (const offset of [
            0,
            50,
            Math.max(0, (ORDERS[order].nulls === "last" ? c.filled : c.empty) - 25),
          ])
            for (const enabled of [false, true]) {
              await switchPolicy(db, "S1", enabled);
              await switchPolicy(db, variant, enabled);
              const a = (
                await transaction(app, p.orgId, deepQuery("S1", order, offset, p, filtered))
              ).rows.map((r) => r.id);
              const b = (
                await transaction(app, p.orgId, deepQuery(variant, order, offset, p, filtered))
              ).rows.map((r) => r.id);
              expect(b, `${variant}/${order}/${filtered}/${offset}/${enabled}`).toEqual(a);
              checks++;
            }
      }
    }
    expect(checks).toBe(240);
  }, 60000);
});
