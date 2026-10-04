import type pg from "pg";
import {
  composeSearch,
  type GeneratedRecord,
  LEAD_FIELDS,
  stableUuid,
  type Universe,
} from "./dataset";
import { LEAD_SLOTS, SLOT_COLUMNS } from "./slot-layout";
import { edgeDecimals, scaledWrite } from "./slots2-numeric";

export type Model = "A4b" | "A4bn" | "A4b20" | "A4bmix" | "A5" | "A520";
export const MODEL_SCHEMA: Record<Model, string> = {
  A4b: "bench_slot",
  A4bmix: "bench_mix",
  A4bn: "bench_partial",
  A4b20: "bench_full",
  A5: "bench_side",
  A520: "bench_sidefull",
};
export const ALL_SLOTS = {
  ...LEAD_SLOTS,
  city: "ix_text_8",
  no_of_employees: "ix_num_2",
  cf_int_1: "ix_num_3",
  cf_decimal_1: "ix_num_4",
  report_created_at: "ix_time_2",
  cf_datetime_3: "ix_time_3",
  cf_datetime_4: "ix_time_4",
  cf_lookup_2: "ix_ref_2",
  bench_ref_3: "ix_ref_3",
  bench_ref_4: "ix_ref_4",
};
export const SYSTEM = [
  "id",
  "organization_id",
  "module_id",
  "owner_id",
  "created_by",
  "updated_by",
  "created_at",
  "updated_at",
  "deleted_at",
  "version",
  "name",
  "search",
  "data",
];
export const POLICY =
  "organization_id = (select nullif(current_setting('app.org_id', true), '')::uuid)";
export function assignment(full: boolean): Record<string, string> {
  return full ? ALL_SLOTS : LEAD_SLOTS;
}
export function fieldUuid(key: string): string {
  return stableUuid(1, `slot-field-${key}`);
}
export function valueExpression(key: string, slot: string, source = "data"): string {
  const raw = `${source}->>'${key}'`;
  if (slot.startsWith("ix_num")) return `((${raw})::numeric * 100)::bigint`;
  if (slot.startsWith("ix_time")) return `(${raw})::timestamptz`;
  if (slot.startsWith("ix_ref")) return `(${raw})::uuid`;
  return `(${raw}) collate "und-x-icu"`;
}
export function systemValues(r: GeneratedRecord, data: Record<string, unknown>): unknown[] {
  return [
    r.id,
    r.organizationId,
    r.moduleId,
    r.ownerId,
    r.createdBy,
    r.updatedBy,
    r.createdAt,
    r.updatedAt,
    r.deletedAt,
    r.version,
    r.name,
    r.search,
    JSON.stringify(data),
  ];
}
export function completeData(
  data: Record<string, unknown>,
  world: Universe,
  created: string,
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...data, report_created_at: created };
  for (const [key, slot] of Object.entries(ALL_SLOTS)) {
    if (out[key] === null || out[key] === undefined) {
      out[key] = slot.startsWith("ix_num")
        ? "0.00"
        : slot.startsWith("ix_time")
          ? created
          : slot.startsWith("ix_ref")
            ? world.moduleContacts
            : `filled-${key}`;
    }
  }
  for (const [key, slot] of Object.entries(ALL_SLOTS))
    if (slot.startsWith("ix_num")) out[key] = String(out[key]);
  return out;
}
export function recordData(
  r: GeneratedRecord,
  world: Universe,
  full: boolean,
): Record<string, unknown> {
  const data = JSON.parse(r.dataJson) as Record<string, unknown>;
  if (data.annual_revenue !== undefined) data.annual_revenue = String(data.annual_revenue);
  return full ? completeData(data, world, r.createdAt) : data;
}
export async function secure(db: pg.Client, schema: string, tables: string[]): Promise<void> {
  await db.query(`grant usage on schema ${schema} to bench_app, bench_bypass`);
  for (const name of tables) {
    await db.query(
      `grant select, insert, update, delete on ${schema}.${name} to bench_app, bench_bypass`,
    );
    await db.query(
      `create policy tenant on ${schema}.${name} using (${POLICY}) with check (${POLICY})`,
    );
    await db.query(`alter table ${schema}.${name} enable row level security`);
  }
}
export async function initializeSeed(db: pg.Client, world: Universe): Promise<void> {
  await db.query("create schema bench_seed");
  await db.query("create table bench_seed.records (like bench_a.records including defaults)");
  await db.query(`insert into bench_seed.records select * from bench_a.records`);
  await db.query(`update bench_seed.records set data = jsonb_set(data, '{annual_revenue}',
    to_jsonb((data->>'annual_revenue')::numeric::text)) where data ? 'annual_revenue'`);
  // The extra precision cohort is isolated from A3/B1 and keeps document values as strings.
  const template = (
    await db.query(
      `select * from bench_seed.records where organization_id=$1
    and module_id=$2 and deleted_at is null order by id limit 1`,
      [world.orgA, world.moduleLeads],
    )
  ).rows[0];
  if (!template) throw new Error("missing seed template");
  for (const [i, revenue] of edgeDecimals().entries()) {
    const row = {
      ...template,
      id: stableUuid(1, `precision-${i}`),
      data: { ...template.data, annual_revenue: revenue },
    };
    await db.query(
      `insert into bench_seed.records (${SYSTEM.join(",")}) values
      (${SYSTEM.map((_, j) => `$${j + 1}`).join(",")})`,
      SYSTEM.map((key) => (key === "data" ? JSON.stringify(row.data) : row[key])),
    );
  }
  await db.query("create index seed_identity on bench_seed.records (organization_id,id)");
}
export async function createModel(db: pg.Client, model: Model, world: Universe): Promise<void> {
  const schema = MODEL_SCHEMA[model];
  const side = model.startsWith("A5");
  const full = model.endsWith("20");
  await db.query(`create schema ${schema}`);
  await db.query(`create table ${schema}.records (like bench_seed.records including defaults)`);
  await db.query(`alter table ${schema}.records add primary key (organization_id,id)`);
  if (!side)
    for (const column of SLOT_COLUMNS)
      await db.query(
        `alter table ${schema}.records add column ${column.name} ${column.name.startsWith("ix_num") ? "bigint" : column.type}`,
      );
  const pairs = Object.entries(ALL_SLOTS).map(([key, slot]) => {
    const fallback = slot.startsWith("ix_num")
      ? "to_jsonb('0.00'::text)"
      : slot.startsWith("ix_time")
        ? "to_jsonb(to_char(r.created_at at time zone 'UTC', 'YYYY-MM-DD\"T\"HH24:MI:SS.MS\"Z\"'))"
        : slot.startsWith("ix_ref")
          ? "to_jsonb($2::text)"
          : `to_jsonb('filled-${key}'::text)`;
    return `'${key}',coalesce(r.data->'${key}',${fallback})`;
  });
  const document = full
    ? `case when r.organization_id=$1::uuid and r.module_id=$3::uuid
    then r.data || jsonb_build_object(${pairs.join(",")}) else r.data end`
    : "r.data";
  const slots = side
    ? []
    : SLOT_COLUMNS.map(({ name }) => {
        const key = Object.entries(assignment(full)).find(([, slot]) => slot === name)?.[0];
        return key ? valueExpression(key, name) : "null";
      });
  await db.query(
    `with prepared as(select ${SYSTEM.filter((k) => k !== "data")
      .map((k) => `r.${k}`)
      .join(",")},${document} as data from bench_seed.records r)
    insert into ${schema}.records (${[...SYSTEM, ...(side ? [] : SLOT_COLUMNS.map((c) => c.name))].join(",")})
    select ${[...SYSTEM, ...slots].join(",")} from prepared`,
    full ? [world.orgA, world.moduleContacts, world.moduleLeads] : [],
  );
  for (const [suffix, columns, predicate] of [
    ["created", "created_at desc,id desc", "where deleted_at is null"],
    ["updated", "updated_at desc,id desc", "where deleted_at is null"],
    ["owner", "owner_id", ""],
  ])
    await db.query(
      `create index ${suffix}_idx on ${schema}.records (organization_id,module_id,${columns}) ${predicate}`,
    );
  await db.query(
    `create table ${schema}.events (like bench_a.events including defaults including constraints)`,
  );
  await db.query(`alter table ${schema}.events add primary key(id)`);
  await db.query(
    `create table ${schema}.modules (organization_id uuid not null,id uuid not null,slot_state text not null default 'unassigned',primary key(organization_id,id))`,
  );
  await db.query(`insert into ${schema}.modules values($1,$2,'unassigned')`, [
    world.orgA,
    world.moduleLeads,
  ]);
  if (!side) {
    for (const { name } of SLOT_COLUMNS)
      await db.query(`create index slot_${name} on ${schema}.records
      (organization_id,module_id,${name},id) where deleted_at is null${model === "A4bn" ? ` and ${name} is not null` : ""}`);
  } else {
    await db.query(`create table ${schema}.record_index (
      organization_id uuid not null,module_id uuid not null,field_id uuid not null,record_id uuid not null,
      v_text text collate "und-x-icu",v_num bigint,v_time timestamptz,v_ref uuid,
      primary key(organization_id,record_id,field_id))`);
    await indexSide(db, model, Object.keys(assignment(full)));
    for (const kind of ["text", "num", "time", "ref"])
      await db.query(`create index value_${kind} on ${schema}.record_index
      (organization_id,module_id,field_id,v_${kind},record_id) where v_${kind} is not null`);
  }
  await secure(db, schema, ["records", "events", "modules", ...(side ? ["record_index"] : [])]);
  await db.query(`vacuum analyze ${schema}.records`);
  if (side) await db.query(`vacuum analyze ${schema}.record_index`);
}
/** A5 writes only the affected fields, inside the caller's transaction. */
export async function indexSide(
  db: pg.Client,
  model: Model,
  keys: string[],
  recordId?: string,
): Promise<void> {
  const schema = MODEL_SCHEMA[model];
  const map = assignment(model.endsWith("20"));
  const selected = keys.filter((key) => map[key]);
  const rows = selected.map((key) => {
    const slot = map[key];
    if (!slot) throw new Error("missing slot");
    const kind = slot.split("_")[1];
    return `('${fieldUuid(key)}'::uuid, ${["text", "num", "time", "ref"].map((type) => (type === kind ? valueExpression(key, slot, "r.data") : `null::${type === "num" ? "bigint" : type === "time" ? "timestamptz" : type === "ref" ? "uuid" : "text"}`)).join(",")})`;
  });
  if (!rows.length) return;
  await db.query(
    `insert into ${schema}.record_index select r.organization_id,r.module_id,v.field_id,r.id,
    v.v_text,v.v_num,v.v_time,v.v_ref from ${schema}.records r cross join lateral
    (values ${rows.join(",")}) v(field_id,v_text,v_num,v_time,v_ref)
    where (v.v_text is not null or v.v_num is not null or v.v_time is not null or v.v_ref is not null)
    ${recordId ? "and r.id=$1::uuid" : ""}
    on conflict(organization_id,record_id,field_id) do update set
    v_text=excluded.v_text,v_num=excluded.v_num,v_time=excluded.v_time,v_ref=excluded.v_ref`,
    recordId ? [recordId] : [],
  );
}
export async function insertModel(
  db: pg.Client,
  model: Model,
  r: GeneratedRecord,
  world: Universe,
): Promise<void> {
  const data = recordData(r, world, model.endsWith("20"));
  const columns = [...SYSTEM];
  const values = systemValues(r, data);
  if (!model.startsWith("A5"))
    for (const { name } of SLOT_COLUMNS) {
      columns.push(name);
      const key = Object.entries(assignment(model.endsWith("20"))).find(
        ([, slot]) => slot === name,
      )?.[0];
      const value = key ? data[key] : undefined;
      values.push(
        value === undefined || value === null
          ? null
          : name.startsWith("ix_num")
            ? scaledWrite(String(value))
            : value,
      );
    }
  await db.query(
    `insert into ${MODEL_SCHEMA[model]}.records (${columns.join(",")}) values(${values.map((_, i) => `$${i + 1}`).join(",")})`,
    values,
  );
  if (model.startsWith("A5"))
    await indexSide(db, model, Object.keys(assignment(model.endsWith("20"))), r.id);
}
export async function updateModel(
  db: pg.Client,
  model: Model,
  id: string,
  world: Universe,
  patch: Record<string, string>,
): Promise<void> {
  const schema = MODEL_SCHEMA[model];
  const current = (
    await db.query(`select name,data from ${schema}.records where organization_id=$1 and id=$2`, [
      world.orgA,
      id,
    ])
  ).rows[0];
  if (!current) throw new Error("missing update row");
  const search = composeSearch(current.name, { ...current.data, ...patch }, LEAD_FIELDS);
  const values: unknown[] = [JSON.stringify(patch), search, world.usersA[0], world.orgA, id];
  const sets: string[] = [];
  const map = assignment(model.endsWith("20"));
  if (!model.startsWith("A5"))
    for (const [key, value] of Object.entries(patch)) {
      const slot = map[key];
      if (slot) {
        values.push(slot.startsWith("ix_num") ? scaledWrite(value) : value);
        sets.push(`${slot}=$${values.length}`);
      }
    }
  await db.query(
    `update ${schema}.records set data=data || $1::jsonb,search=$2,version=version+1,
    updated_at=clock_timestamp(),updated_by=$3${sets.length ? `,${sets.join(",")}` : ""}
    where organization_id=$4 and id=$5`,
    values,
  );
  if (model.startsWith("A5")) await indexSide(db, model, Object.keys(patch), id);
}
export async function recordEvent(
  db: pg.Client,
  model: Model,
  org: string,
  id: string,
  event: string,
  kind: string,
): Promise<void> {
  await db.query(`insert into ${MODEL_SCHEMA[model]}.events values($1,$2,$3,$4,$5)`, [
    event,
    org,
    id,
    `record.${kind}`,
    JSON.stringify({
      source: "bench",
      fields:
        kind === "update1"
          ? ["lead_status"]
          : kind === "update5"
            ? ["lead_status", "company", "city", "annual_revenue", "cf_text_1"]
            : [],
    }),
  ]);
}
export async function dropModel(db: pg.Client, model: Model): Promise<void> {
  await db.query(`drop schema ${MODEL_SCHEMA[model]} cascade`);
}
