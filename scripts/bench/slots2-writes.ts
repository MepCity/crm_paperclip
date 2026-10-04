import type pg from "pg";
import {
  composeSearch,
  LEAD_FIELDS,
  picklistValue,
  stableUuid,
  syntheticLead,
  type Universe,
} from "./dataset";
import { percentile } from "./report";
import type { Evidence } from "./slots2-measure";
import {
  assignment,
  fieldUuid,
  insertModel,
  MODEL_SCHEMA,
  type Model,
  recordEvent,
  updateModel,
  valueExpression,
} from "./slots2-storage";

async function currentLsn(db: pg.Client): Promise<string> {
  return String((await db.query("select pg_current_wal_insert_lsn()::text as lsn")).rows[0].lsn);
}
async function walBytes(db: pg.Client, start: string): Promise<number> {
  return Number(
    (
      await db.query(
        "select pg_wal_lsn_diff(pg_current_wal_insert_lsn(),$1::pg_lsn)::float8 as bytes",
        [start],
      )
    ).rows[0].bytes,
  );
}

export async function writeBatch(
  db: pg.Client,
  app: pg.Client,
  e: Evidence,
  model: Model,
  world: Universe,
  ids: string[],
  locked = false,
  kinds = ["insert", "update1", "update5"],
): Promise<void> {
  const schema = MODEL_SCHEMA[model];
  const count = e.protocol.writes;
  const inserted: string[] = [];
  for (const kind of kinds) {
    await db.query("checkpoint");
    const lsn = await currentLsn(db);
    const samples: number[] = [];
    for (let i = 0; i < count; i++) {
      const event = stableUuid(1, `${model}-${locked}-${kind}-${i}`);
      const record = syntheticLead(world, 20_000_000 + i);
      const id = kind === "insert" ? record.id : ids[(kind === "update5" ? count : 0) + i];
      if (!id) throw new Error("missing write ID");
      const started = performance.now();
      await app.query("begin");
      try {
        await app.query("select set_config('app.org_id',$1,true)", [world.orgA]);
        if (locked)
          await app.query(
            `select 1 from ${schema}.modules where organization_id=$1 and id=$2 for key share`,
            [world.orgA, world.moduleLeads],
          );
        if (kind === "insert") {
          await insertModel(app, model, record, world);
          inserted.push(id);
        } else
          await updateModel(
            app,
            model,
            id,
            world,
            kind === "update1"
              ? { lead_status: picklistValue("lead_status", 9, i) }
              : {
                  lead_status: picklistValue("lead_status", 9, i),
                  company: `Company ${String(i).padStart(6, "0")}`,
                  city: "benchcity",
                  annual_revenue: (1000 + i).toFixed(2),
                  cf_text_1: `bench ${i}`,
                },
          );
        await recordEvent(app, model, world.orgA, id, event, kind);
        await app.query("commit");
      } catch (error) {
        await app.query("rollback");
        throw error;
      }
      samples.push(performance.now() - started);
    }
    e.writes.push({
      model,
      scenario: `S9 ${kind}`,
      median: percentile(samples, 0.5),
      p95: percentile(samples, 0.95),
      wal: (await walBytes(db, lsn)) / count,
      operations: count,
      locked,
    });
  }
  const map = assignment(model.endsWith("20"));
  if (!model.startsWith("A5")) {
    const result = await db.query(
      `select count(*)::int as n from ${schema}.records where organization_id=$1 and module_id=$2 and
      (${Object.entries(map)
        .map(([key, slot]) => `${slot} is distinct from ${valueExpression(key, slot)}`)
        .join(" or ")})`,
      [world.orgA, world.moduleLeads],
    );
    e.checks.push({
      name: `${model} write consistency${locked ? " locked" : ""}`,
      pass: result.rows[0].n === 0,
      detail: `mismatches=${result.rows[0].n}`,
    });
  } else {
    for (const [key, slot] of Object.entries(map)) {
      const kind = slot.split("_")[1];
      const result = await db.query(
        `select count(*)::int as n from ${schema}.records r left join ${schema}.record_index i
        on i.organization_id=r.organization_id and i.record_id=r.id and i.field_id=$3
        where r.organization_id=$1 and r.module_id=$2 and i.v_${kind} is distinct from ${valueExpression(key, slot, "r.data")}`,
        [world.orgA, world.moduleLeads, fieldUuid(key)],
      );
      e.checks.push({
        name: `${model} write consistency ${key}`,
        pass: result.rows[0].n === 0,
        detail: `mismatches=${result.rows[0].n}`,
      });
    }
  }
  const events = await db.query(`select count(*)::int as n from ${schema}.events`);
  e.checks.push({
    name: `${model} event atomicity${locked ? " locked" : ""}`,
    pass: events.rows[0].n === count * kinds.length,
    detail: `events=${events.rows[0].n}`,
  });
  // Sizes include the post-write table/index state. Cleanup happens after the snapshot.
  const sizes = (
    await db.query(
      `select coalesce(sum(pg_table_size(c.oid)) filter(where c.relkind='r'),0)::float8 as tables,
    coalesce(sum(pg_relation_size(c.oid)) filter(where c.relkind='i'),0)::float8 as indexes
    from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname=$1 and c.relkind in('r','i')`,
      [schema],
    )
  ).rows[0];
  const sideRows = model.startsWith("A5")
    ? Number((await db.query(`select count(*)::int as n from ${schema}.record_index`)).rows[0].n)
    : undefined;
  e.sizes.push({
    model: `${model}${locked ? " locked" : ""}`,
    tables: sizes.tables,
    indexes: sizes.indexes,
    ...(sideRows === undefined ? {} : { sideRows }),
  });
  if (model.startsWith("A5"))
    await db.query(`delete from ${schema}.record_index where record_id=any($1::uuid[])`, [
      inserted,
    ]);
  await db.query(`delete from ${schema}.records where id=any($1::uuid[])`, [inserted]);
  await db.query(`truncate ${schema}.events`);
}
export async function backfill(
  db: pg.Client,
  writer: pg.Client,
  e: Evidence,
  world: Universe,
  progress: (s: string) => void,
): Promise<void> {
  const schema = "bench_slot";
  await db.query(
    `create table ${schema}.backfill_ids as select id,row_number() over(order by id)::int as seq
    from bench_a.records where organization_id=$1 and module_id=$2`,
    [world.orgA, world.moduleLeads],
  );
  await db.query(`create unique index backfill_seq on ${schema}.backfill_ids(seq)`);
  const count = Number(
    (await db.query(`select count(*)::int as n from ${schema}.backfill_ids`)).rows[0].n,
  );
  const ids = (await db.query(`select id from ${schema}.backfill_ids order by seq`)).rows.map((r) =>
    String(r.id),
  );
  await db.query("begin");
  await db.query(`select 1 from ${schema}.modules where organization_id=$1 and id=$2 for update`, [
    world.orgA,
    world.moduleLeads,
  ]);
  await db.query(
    `update ${schema}.modules set slot_state='assigned:cf_text_2:ix_text_8' where organization_id=$1 and id=$2`,
    [world.orgA, world.moduleLeads],
  );
  await db.query("commit");
  let running = true;
  const samples: number[] = [];
  let writerError: unknown;
  const concurrent = (async () => {
    let i = 0;
    while (running) {
      const scheduled = performance.now();
      const id = ids[(i * 7919) % ids.length];
      if (!id) throw new Error("missing backfill writer id");
      await writer.query("begin");
      try {
        await writer.query("select set_config('app.org_id',$1,true)", [world.orgA]);
        await writer.query(
          `select 1 from ${schema}.modules where organization_id=$1 and id=$2 for key share`,
          [world.orgA, world.moduleLeads],
        );
        const current = (
          await writer.query(
            `select name,data from ${schema}.records where organization_id=$1 and id=$2`,
            [world.orgA, id],
          )
        ).rows[0];
        if (!current) throw new Error("missing concurrent update row");
        const search = composeSearch(
          current.name,
          { ...current.data, cf_text_2: `concurrent-${i}` },
          LEAD_FIELDS,
        );
        await writer.query(
          `update ${schema}.records set data=jsonb_set(data,'{cf_text_2}',to_jsonb($1::text)),
          ix_text_8=$1,search=$4,updated_by=$5,version=version+1,updated_at=clock_timestamp() where organization_id=$2 and id=$3`,
          [`concurrent-${i}`, world.orgA, id, search, world.usersA[0]],
        );
        await recordEvent(
          writer,
          "A4b",
          world.orgA,
          id,
          stableUuid(1, `backfill-event-${i}`),
          "update1",
        );
        await writer.query("commit");
      } catch (error) {
        await writer.query("rollback");
        throw error;
      }
      samples.push(performance.now() - scheduled);
      i++;
      const delay = 20 - (performance.now() - scheduled);
      if (delay > 0) await new Promise((resolve) => setTimeout(resolve, delay));
    }
  })().catch((error) => {
    writerError = error;
  });
  await db.query("checkpoint");
  const lsn = await currentLsn(db);
  const started = performance.now();
  try {
    for (let low = 0; low < count; low += 5000) {
      progress(`backfill ${Math.min(low + 5000, count)}/${count}`);
      await db.query(
        `update ${schema}.records r set ix_text_8=r.data->>'cf_text_2'
        from ${schema}.backfill_ids b where r.organization_id=$1 and r.module_id=$2
        and r.id=b.id and b.seq>$3 and b.seq<=$4`,
        [world.orgA, world.moduleLeads, low, Math.min(low + 5000, count)],
      );
    }
  } finally {
    running = false;
    await concurrent;
  }
  if (writerError) throw writerError;
  e.backfill = {
    rows: count,
    elapsedMs: performance.now() - started,
    walBytes: await walBytes(db, lsn),
    writerP95: percentile(samples, 0.95),
    writerOperations: samples.length,
  };
  e.backfill.writerHz = samples.length / ((e.backfill.elapsedMs ?? 1) / 1000);
  const validate = async (label: string, expected: number) => {
    const start = performance.now();
    const result = await db.query(
      `select count(*)::int as n from ${schema}.records r join ${schema}.backfill_ids b on b.id=r.id
      where r.organization_id=$1 and r.module_id=$2 and r.ix_text_8 is distinct from (r.data->>'cf_text_2')`,
      [world.orgA, world.moduleLeads],
    );
    const n = Number(result.rows[0].n);
    e.backfill[`${label}Count`] = n;
    e.backfill[`${label}Ms`] = performance.now() - start;
    e.checks.push({
      name: `backfill ${label}`,
      pass: n === expected,
      detail: `count=${n}; expected=${expected}`,
    });
  };
  await validate("initial", 0);
  const victims = (
    await db.query(
      `select r.id from ${schema}.records r join ${schema}.backfill_ids b on b.id=r.id
    where r.organization_id=$1 and r.module_id=$2 and r.data->>'cf_text_2' is not null order by r.id limit 200`,
      [world.orgA, world.moduleLeads],
    )
  ).rows.map((r) => r.id);
  if (victims.length !== 200) throw new Error("need 200 populated backfill rows");
  await db.query(`update ${schema}.records set ix_text_8=null where id=any($1::uuid[])`, [
    victims.slice(0, 100),
  ]);
  await db.query(
    `update ${schema}.records set ix_text_8='incorrect-backfill' where id=any($1::uuid[])`,
    [victims.slice(100)],
  );
  await validate("corrupted", 200);
  await db.query(
    `update ${schema}.records r set ix_text_8=r.data->>'cf_text_2' where id=any($1::uuid[])`,
    [victims],
  );
  await validate("repaired", 0);
}
