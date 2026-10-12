import type pg from "pg";
import { LEAD_FIELDS, type Universe } from "./dataset";
import { SLOT_COLUMNS } from "./slot-layout";
import { SYSTEM, secure } from "./slots2-storage";

export async function secondSlotIndexes(db: pg.Client, schema: string): Promise<string[]> {
  const sql = SLOT_COLUMNS.filter((c) => !c.name.startsWith("ix_ref")).map(
    (c) =>
      `create index slot_${c.name}_first on ${schema}.records (organization_id,module_id,${c.name} nulls first,id) where deleted_at is null`,
  );
  for (const text of sql) await db.query(text);
  return sql;
}
export async function copySlots(db: pg.Client): Promise<string[]> {
  await db.query("create schema bench_deep");
  await db.query(
    "create table bench_deep.records (like bench_slot.records including defaults including constraints)",
  );
  await db.query("alter table bench_deep.records add primary key(organization_id,id)");
  const indexes = (
    await db.query(
      "select indexdef from pg_indexes where schemaname='bench_slot' and tablename='records' and indexname <> 'records_pkey'",
    )
  ).rows;
  for (const index of indexes)
    await db.query(
      String(index.indexdef).replace("ON bench_slot.records", "ON bench_deep.records"),
    );
  await db.query("insert into bench_deep.records select * from bench_slot.records");
  await secure(db, "bench_deep", ["records"]);
  const sql = await secondSlotIndexes(db, "bench_deep");
  await db.query("vacuum analyze bench_deep.records");
  return sql;
}
export async function synchronizeTyped(db: pg.Client, world: Universe): Promise<void> {
  // MEP-103 adds a precision cohort beyond numeric(16,2). Preserve those exact
  // values in B; only this unqueried column's precision changes for the matrix.
  await db.query("alter table bench_b.leads alter column annual_revenue type numeric(18,2)");
  const columns = [...SYSTEM.filter((k) => k !== "data"), ...LEAD_FIELDS.map((f) => f.key)];
  const expressions = LEAD_FIELDS.map((f) => {
    const raw = `r.data->>'${f.key}'`;
    const type =
      f.type === "boolean"
        ? "boolean"
        : f.type === "integer"
          ? "integer"
          : f.type === "decimal"
            ? "numeric"
            : f.type === "date"
              ? "date"
              : f.type === "datetime"
                ? "timestamptz"
                : f.type === "lookup"
                  ? "uuid"
                  : "text";
    return `(${raw})::${type}`;
  });
  await db.query(
    `insert into bench_b.leads (${columns.join(",")}) select ${[...SYSTEM.filter((k) => k !== "data").map((k) => `r.${k}`), ...expressions].join(",")} from bench_seed.records r where r.module_id=$1 and not exists(select 1 from bench_b.leads b where b.id=r.id)`,
    [world.moduleLeads],
  );
  await db.query("vacuum analyze bench_b.leads");
}
export function secondTypedIndex(moduleId: string): string {
  if (!/^[a-f0-9-]{36}$/.test(moduleId)) throw new Error("invalid synthetic module id");
  return `create index bl_company_first on bench_b.leads (company nulls first,id) where module_id='${moduleId}'::uuid and deleted_at is null`;
}
