import { closeSync, openSync, writeSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type pg from "pg";
import {
  composeSearch,
  contactFields,
  type FieldDef,
  fieldByKey,
  fieldId,
  type GeneratedRecord,
  type GenerateOptions,
  generateDataset,
  INDEXED_LEAD_KEYS,
  LEAD_FIELDS,
  searchableLeadKeys,
  type Universe,
  uuidV7,
} from "./dataset";

import { SLOT_COLUMNS, slotValues } from "./slot-layout";

export type Stage = "A0" | "A1" | "A2" | "A3" | "B0" | "B1" | "C0";

const SYSTEM_COLUMNS = [
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
] as const;

function assertUuid(value: string): string {
  if (!/^[0-9a-f-]{36}$/.test(value)) throw new Error("refusing to interpolate a non-uuid");
  return value;
}

function assertKey(key: string): string {
  if (!/^[a-z0-9_]+$/.test(key)) throw new Error(`refusing to interpolate field ${key}`);
  return key;
}

function columnDdl(field: FieldDef): string {
  const key = assertKey(field.key);
  const required = field.required ? " not null" : "";
  switch (field.type) {
    case "boolean":
      return `${key} boolean${required}`;
    case "integer":
      return `${key} integer`;
    case "decimal":
      return `${key} numeric(16,2)`;
    case "date":
      return `${key} date`;
    case "datetime":
      return `${key} timestamptz`;
    case "lookup":
      return `${key} uuid`;
    default:
      return `${key} text collate "und-x-icu"${required}`;
  }
}

const SYSTEM_DDL = `
  id uuid primary key,
  organization_id uuid not null,
  module_id uuid not null,
  owner_id uuid,
  created_by uuid,
  updated_by uuid,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz,
  version integer not null default 1,
  name text not null,
  search text not null
`;

export async function configureClient(client: pg.Client): Promise<void> {
  await client.query("set timezone to 'UTC'");
  // Partial expression indexes compare module_id to a literal. Custom plans
  // inline bind parameters so those indexes stay usable across the timed runs.
  await client.query("set plan_cache_mode to force_custom_plan");
}

export async function createATable(client: pg.Client, slots = false): Promise<void> {
  const extra = slots
    ? `, ${SLOT_COLUMNS.map(({ name, type }) => `${name} ${type}`).join(", ")}`
    : "";
  await client.query(`create table bench_a.records (${SYSTEM_DDL}, data jsonb not null${extra})`);
}

export async function createTables(client: pg.Client): Promise<void> {
  await client.query("create extension if not exists pg_trgm");
  await client.query("create extension if not exists unaccent");
  await client.query("create extension if not exists btree_gin");
  await client.query("create schema bench_a");
  await client.query("create schema bench_b");
  await client.query("create schema bench_c");
  await createATable(client);
  await client.query(
    `create table bench_b.leads (${SYSTEM_DDL}, ${LEAD_FIELDS.map(columnDdl).join(", ")})`,
  );
  await client.query(
    `create table bench_b.contacts (${SYSTEM_DDL}, ${contactFields().map(columnDdl).join(", ")})`,
  );
  await client.query(`create table bench_c.records (${SYSTEM_DDL})`);
  await client.query(`
    create table bench_c.record_values (
      organization_id uuid not null,
      record_id uuid not null,
      field_id integer not null,
      value_text text collate "und-x-icu",
      value_num numeric,
      value_bool boolean,
      value_ts timestamptz,
      primary key (record_id, field_id)
    )
  `);
  for (const schema of ["bench_a", "bench_b", "bench_c"]) {
    await client.query(`
      create table ${schema}.events (
        id uuid primary key,
        organization_id uuid not null,
        record_id uuid not null,
        type text not null,
        payload jsonb not null
      )
    `);
  }
}

function systemIndexes(schema: string, table: string, prefix: string): string[] {
  return [
    `create index ${prefix}_created_idx on ${schema}.${table} (organization_id, module_id, created_at desc, id desc) where deleted_at is null`,
    `create index ${prefix}_updated_idx on ${schema}.${table} (organization_id, module_id, updated_at desc, id desc) where deleted_at is null`,
    `create index ${prefix}_owner_idx on ${schema}.${table} (organization_id, module_id, owner_id)`,
  ];
}

function aExpr(field: FieldDef): string {
  const key = assertKey(field.key);
  switch (field.type) {
    case "integer":
    case "decimal":
      return `((data->'${key}')::numeric)`;
    case "date":
    case "datetime":
      return `((data->>'${key}') collate "C")`;
    case "boolean":
      return `((data->>'${key}'))`;
    default:
      return `((data->>'${key}') collate "und-x-icu")`;
  }
}

function bExpr(field: FieldDef): string {
  const key = assertKey(field.key);
  switch (field.type) {
    case "integer":
    case "decimal":
    case "boolean":
    case "date":
    case "datetime":
    case "lookup":
      return key;
    default:
      return `(${key} collate "und-x-icu")`;
  }
}

export function stageStatements(stage: Stage, moduleLeads: string): string[] {
  const moduleId = assertUuid(moduleLeads);
  const partial = `where module_id = '${moduleId}'::uuid and deleted_at is null`;
  switch (stage) {
    case "A0":
      return systemIndexes("bench_a", "records", "a");
    case "A1":
      return ["create index a_data_gin on bench_a.records using gin (data jsonb_path_ops)"];
    case "A2":
      return INDEXED_LEAD_KEYS.map((key) => {
        const field = fieldByKey(key);
        return `create index a_x_${assertKey(key)} on bench_a.records (${aExpr(field)}, id) ${partial}`;
      });
    case "A3":
      // Partial expression indexes do not supply planner statistics. One
      // extended statistic per indexed expression does. Kinds stay unspecified:
      // PostgreSQL 18 rejects an explicit kind list on a single expression.
      return INDEXED_LEAD_KEYS.map((key) => {
        const field = fieldByKey(key);
        return `create statistics bench_a.a_s_${assertKey(key)} on (${aExpr(field)}) from bench_a.records`;
      });
    case "B0":
      return [
        ...systemIndexes("bench_b", "leads", "bl"),
        ...systemIndexes("bench_b", "contacts", "bc"),
      ];
    case "B1":
      return INDEXED_LEAD_KEYS.map((key) => {
        const field = fieldByKey(key);
        return `create index bl_x_${assertKey(key)} on bench_b.leads (${bExpr(field)}, id) ${partial}`;
      });
    case "C0":
      return [
        ...systemIndexes("bench_c", "records", "c"),
        "create index c_value_text_idx on bench_c.record_values (organization_id, field_id, value_text, record_id)",
        "create index c_value_num_idx on bench_c.record_values (organization_id, field_id, value_num, record_id)",
        "create index c_value_ts_idx on bench_c.record_values (organization_id, field_id, value_ts, record_id)",
      ];
    default:
      return [];
  }
}

export function searchIndexNames(kind: "trgm" | "tsv"): string[] {
  return ["bench_a.a_search", "bench_b.bl_search", "bench_b.bc_search", "bench_c.c_search"].map(
    (name) => `${name}_${kind}`,
  );
}

export function searchStatements(kind: "trgm" | "tsv"): string[] {
  const tables = [
    ["a_search", "bench_a.records"],
    ["bl_search", "bench_b.leads"],
    ["bc_search", "bench_b.contacts"],
    ["c_search", "bench_c.records"],
  ] as const;
  if (kind === "trgm") {
    return tables.map(
      ([name, table]) => `create index ${name}_trgm on ${table} using gin (search gin_trgm_ops)`,
    );
  }
  return tables.map(
    ([name, table]) =>
      `create index ${name}_tsv on ${table} using gin (to_tsvector('simple', search))`,
  );
}

export async function applyStatements(client: pg.Client, statements: string[]): Promise<number> {
  const started = performance.now();
  for (const statement of statements) await client.query(statement);
  return performance.now() - started;
}

export async function vacuumAnalyze(client: pg.Client, relations: string[]): Promise<void> {
  for (const relation of relations) await client.query(`vacuum analyze ${relation}`);
}

export async function dropStatements(client: pg.Client, names: string[]): Promise<void> {
  for (const name of names) await client.query(`drop index if exists ${name}`);
}

export function expressionIndexNames(option: "A" | "B"): string[] {
  return INDEXED_LEAD_KEYS.map((key) =>
    option === "A" ? `bench_a.a_x_${key}` : `bench_b.bl_x_${key}`,
  );
}

function copyCell(value: string | number | boolean | null): string {
  if (value === null) return "\\N";
  if (typeof value === "boolean") return value ? "t" : "f";
  if (typeof value === "number") return String(value);
  return value
    .replaceAll("\\", "\\\\")
    .replaceAll("\n", "\\n")
    .replaceAll("\r", "\\r")
    .replaceAll("\t", "\\t");
}

class CopyFile {
  private readonly fd: number;
  private buffer: string[] = [];
  private closed = false;

  constructor(
    readonly path: string,
    readonly table: string,
    readonly columns: readonly string[],
  ) {
    this.fd = openSync(path, "w");
  }

  add(values: Array<string | number | boolean | null>): void {
    this.buffer.push(`${values.map(copyCell).join("\t")}\n`);
    if (this.buffer.length >= 2000) this.flush();
  }

  private flush(): void {
    if (this.buffer.length === 0) return;
    writeSync(this.fd, this.buffer.join(""));
    this.buffer = [];
  }

  close(): void {
    if (this.closed) return;
    this.flush();
    closeSync(this.fd);
    this.closed = true;
  }
}

function systemValues(record: GeneratedRecord): Array<string | number | null> {
  return [
    record.id,
    record.organizationId,
    record.moduleId,
    record.ownerId,
    record.createdBy,
    record.updatedBy,
    record.createdAt,
    record.updatedAt,
    record.deletedAt,
    record.version,
    record.name,
    record.search,
  ];
}

function fieldColumns(
  record: GeneratedRecord,
  fields: readonly FieldDef[],
): Array<string | number | boolean | null> {
  return fields.map((field) => record.fields[field.key]?.column ?? null);
}

export type LoadTimes = {
  generateMs: number;
  copyMs: { A: number; B: number; C: number };
  orgALeadIds: string[];
  lookupContactIds: string[];
  universe: Universe;
};

export async function generateAndLoad(
  client: pg.Client,
  options: GenerateOptions,
  mode: { skipC?: boolean; slots?: boolean; onlyA?: boolean } = {},
): Promise<LoadTimes> {
  const dir = await mkdtemp(
    join(process.env.PAPERCLIP_RUN_SCRATCH_DIR ?? tmpdir(), "crm-bench-copy-"),
  );
  const files = {
    a: new CopyFile(join(dir, "a.txt"), "bench_a.records", [
      ...SYSTEM_COLUMNS,
      "data",
      ...(mode.slots ? SLOT_COLUMNS.map(({ name }) => name) : []),
    ]),
    bLeads: new CopyFile(join(dir, "b-leads.txt"), "bench_b.leads", [
      ...SYSTEM_COLUMNS,
      ...LEAD_FIELDS.map((field) => field.key),
    ]),
    bContacts: new CopyFile(join(dir, "b-contacts.txt"), "bench_b.contacts", [
      ...SYSTEM_COLUMNS,
      ...contactFields().map((field) => field.key),
    ]),
    cRecords: new CopyFile(join(dir, "c-records.txt"), "bench_c.records", [...SYSTEM_COLUMNS]),
    cValues: new CopyFile(join(dir, "c-values.txt"), "bench_c.record_values", [
      "organization_id",
      "record_id",
      "field_id",
      "value_text",
      "value_num",
      "value_bool",
      "value_ts",
    ]),
  };

  const started = performance.now();
  let generated: Awaited<ReturnType<typeof generateDataset>>;
  try {
    generated = generateDataset({
      ...options,
      retain: false,
      onRecord: (record, kind) => {
        files.a.add([
          ...systemValues(record),
          record.dataJson,
          ...(mode.slots ? slotValues(record, kind === "contact") : []),
        ]);
        if (mode.onlyA) return;
        if (!mode.skipC) files.cRecords.add(systemValues(record));
        if (kind === "contact")
          files.bContacts.add([...systemValues(record), ...fieldColumns(record, contactFields())]);
        else files.bLeads.add([...systemValues(record), ...fieldColumns(record, LEAD_FIELDS)]);
        for (const value of mode.skipC ? [] : Object.values(record.fields)) {
          const field = fieldByKey(value.key);
          const text = field.type === "date" || field.type === "datetime" ? null : value.text;
          files.cValues.add([
            record.organizationId,
            record.id,
            value.fieldId,
            text,
            value.num,
            value.bool,
            value.ts,
          ]);
        }
      },
    });
    for (const file of Object.values(files)) file.close();
    const generateMs = performance.now() - started;

    const copyOne = async (file: CopyFile): Promise<number> => {
      const copyStarted = performance.now();
      const literal = file.path.replaceAll("'", "''");
      await client.query(
        `copy ${file.table} (${file.columns.join(", ")}) from '${literal}' (format text)`,
      );
      return performance.now() - copyStarted;
    };

    const aMs = await copyOne(files.a);
    const bMs = mode.onlyA ? 0 : (await copyOne(files.bLeads)) + (await copyOne(files.bContacts));
    const cMs =
      mode.onlyA || mode.skipC
        ? 0
        : (await copyOne(files.cRecords)) + (await copyOne(files.cValues));
    const lookupContactIds = [...generated.lookupHits.entries()]
      .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
      .slice(0, 30)
      .map(([id]) => id);
    return {
      generateMs,
      copyMs: { A: aMs, B: bMs, C: cMs },
      orgALeadIds: generated.orgALeadIds,
      lookupContactIds,
      universe: generated.universe,
    };
  } finally {
    for (const file of Object.values(files)) file.close();
    await rm(dir, { recursive: true, force: true });
  }
}

export type SizeRow = {
  schema: string;
  name: string;
  kind: "table" | "index";
  bytes: number;
};

export async function relationSizes(client: pg.Client): Promise<SizeRow[]> {
  const result = await client.query<{ schema: string; name: string; kind: string; bytes: string }>(`
    select n.nspname as schema, c.relname as name, c.relkind::text as kind,
      case when c.relkind = 'i' then pg_relation_size(c.oid) else pg_table_size(c.oid) end as bytes
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname in ('bench_a', 'bench_b', 'bench_c') and c.relkind in ('r', 'i')
    order by 1, 2
  `);
  return result.rows.map((row) => ({
    schema: row.schema,
    name: row.name,
    kind: row.kind === "i" ? "index" : "table",
    bytes: Number(row.bytes),
  }));
}

export type ServerInfo = {
  version: string;
  sharedBuffers: string;
  workMem: string;
  jit: string;
};

export async function serverInfo(client: pg.Client): Promise<ServerInfo> {
  const result = await client.query<{
    version: string;
    shared_buffers: string;
    work_mem: string;
    jit: string;
  }>(`
    select version() as version,
      current_setting('shared_buffers') as shared_buffers,
      current_setting('work_mem') as work_mem,
      current_setting('jit') as jit
  `);
  const row = result.rows[0];
  if (!row) throw new Error("server settings query returned no row");
  return {
    version: row.version,
    sharedBuffers: row.shared_buffers,
    workMem: row.work_mem,
    jit: row.jit,
  };
}

async function insertEvent(
  client: pg.Client,
  schema: "bench_a" | "bench_b" | "bench_c",
  eventId: string,
  record: { organizationId: string; id: string },
  type: string,
  payload: unknown,
): Promise<void> {
  await client.query(
    `insert into ${schema}.events (id, organization_id, record_id, type, payload)
     values ($1::uuid, $2::uuid, $3::uuid, $4, $5::jsonb)`,
    [eventId, record.organizationId, record.id, type, JSON.stringify(payload)],
  );
}

function bPlaceholders(count: number): string {
  return Array.from({ length: count }, (_, index) => `$${index + 1}`).join(", ");
}

export async function insertRecord(
  client: pg.Client,
  option: "A" | "B" | "C",
  record: GeneratedRecord,
  eventId: string,
  slots = false,
): Promise<void> {
  if (option === "A") {
    await client.query(
      `insert into bench_a.records (${SYSTEM_COLUMNS.join(", ")}, data${slots ? `, ${SLOT_COLUMNS.map(({ name }) => name).join(", ")}` : ""})
       values (${bPlaceholders(SYSTEM_COLUMNS.length)}, $${SYSTEM_COLUMNS.length + 1}::jsonb${slots ? SLOT_COLUMNS.map((_, i) => `, $${SYSTEM_COLUMNS.length + 2 + i}`).join("") : ""})`,
      [...systemValues(record), record.dataJson, ...(slots ? slotValues(record) : [])],
    );
  } else if (option === "B") {
    const fields = LEAD_FIELDS;
    const columns = [...SYSTEM_COLUMNS, ...fields.map((field) => field.key)];
    await client.query(
      `insert into bench_b.leads (${columns.join(", ")}) values (${bPlaceholders(columns.length)})`,
      [...systemValues(record), ...fieldColumns(record, fields)],
    );
  } else {
    await client.query(
      `insert into bench_c.records (${SYSTEM_COLUMNS.join(", ")}) values (${bPlaceholders(SYSTEM_COLUMNS.length)})`,
      systemValues(record),
    );
    const values = Object.values(record.fields);
    if (values.length > 0) {
      await client.query(
        `insert into bench_c.record_values (organization_id, record_id, field_id, value_text, value_num, value_bool, value_ts)
         select * from unnest($1::uuid[], $2::uuid[], $3::int[], $4::text[], $5::numeric[], $6::boolean[], $7::timestamptz[])`,
        [
          values.map(() => record.organizationId),
          values.map(() => record.id),
          values.map((value) => value.fieldId),
          values.map((value) => {
            const field = fieldByKey(value.key);
            return field.type === "date" || field.type === "datetime" ? null : value.text;
          }),
          values.map((value) => value.num),
          values.map((value) => value.bool),
          values.map((value) => value.ts),
        ],
      );
    }
  }
  const schema = option === "A" ? "bench_a" : option === "B" ? "bench_b" : "bench_c";
  await insertEvent(client, schema, eventId, record, "record.insert", { source: "bench" });
}

async function searchableState(
  client: pg.Client,
  option: "A" | "B" | "C",
  recordId: string,
): Promise<{ name: string; texts: Record<string, string | null> }> {
  const keys = searchableLeadKeys();
  const texts: Record<string, string | null> = {};
  for (const key of keys) texts[key] = null;
  if (option === "A") {
    const result = await client.query<{ name: string; data: Record<string, unknown> | string }>(
      "select name, data from bench_a.records where id = $1::uuid",
      [recordId],
    );
    const row = result.rows[0];
    if (!row) throw new Error("missing record for search refresh");
    const data =
      typeof row.data === "string" ? (JSON.parse(row.data) as Record<string, unknown>) : row.data;
    for (const key of keys) {
      const raw = data[key];
      texts[key] = typeof raw === "string" ? raw : null;
    }
    return { name: row.name, texts };
  }
  if (option === "B") {
    const columns = keys.map((key) => assertKey(key)).join(", ");
    const result = await client.query<Record<string, string | null>>(
      `select name, ${columns} from bench_b.leads where id = $1::uuid`,
      [recordId],
    );
    const row = result.rows[0];
    if (!row) throw new Error("missing record for search refresh");
    for (const key of keys) {
      const raw = row[key];
      texts[key] = raw === null || raw === undefined ? null : String(raw);
    }
    return { name: String(row.name), texts };
  }
  const ids = keys.map((key) => fieldId(key));
  const result = await client.query<{
    name: string;
    field_id: number | null;
    value_text: string | null;
  }>(
    `select r.name, v.field_id, v.value_text
     from bench_c.records r
     left join bench_c.record_values v on v.record_id = r.id and v.field_id = any($2::int[])
     where r.id = $1::uuid`,
    [recordId, ids],
  );
  const first = result.rows[0];
  if (!first) throw new Error("missing record for search refresh");
  const byId = new Map(keys.map((key) => [fieldId(key), key]));
  for (const row of result.rows) {
    if (row.field_id === null) continue;
    const key = byId.get(Number(row.field_id));
    if (key) texts[key] = row.value_text;
  }
  return { name: first.name, texts };
}

async function refreshedSearch(
  client: pg.Client,
  option: "A" | "B" | "C",
  recordId: string,
  patch: Record<string, string>,
): Promise<string> {
  const current = await searchableState(client, option, recordId);
  return composeSearch(current.name, { ...current.texts, ...patch }, LEAD_FIELDS);
}

export async function updateStatus(
  client: pg.Client,
  option: "A" | "B" | "C",
  recordId: string,
  organizationId: string,
  status: string,
  actorId: string,
  eventId: string,
  slots = false,
): Promise<void> {
  const search = await refreshedSearch(client, option, recordId, { lead_status: status });
  if (option === "A") {
    await client.query(
      `update bench_a.records
       set data = jsonb_set(data, '{lead_status}', to_jsonb($1::text), true),${slots ? " ix_text_3 = $1::text," : ""}
           search = $2, version = version + 1, updated_at = clock_timestamp(), updated_by = $3::uuid
       where id = $4::uuid`,
      [status, search, actorId, recordId],
    );
  } else if (option === "B") {
    await client.query(
      `update bench_b.leads
       set lead_status = $1, search = $2, version = version + 1,
           updated_at = clock_timestamp(), updated_by = $3::uuid
       where id = $4::uuid`,
      [status, search, actorId, recordId],
    );
  } else {
    await client.query(
      `insert into bench_c.record_values (organization_id, record_id, field_id, value_text)
       values ($1::uuid, $2::uuid, $3, $4)
       on conflict (record_id, field_id) do update set value_text = excluded.value_text`,
      [organizationId, recordId, fieldId("lead_status"), status],
    );
    await client.query(
      `update bench_c.records
       set search = $1, version = version + 1, updated_at = clock_timestamp(), updated_by = $2::uuid
       where id = $3::uuid`,
      [search, actorId, recordId],
    );
  }
  const schema = option === "A" ? "bench_a" : option === "B" ? "bench_b" : "bench_c";
  await insertEvent(client, schema, eventId, { organizationId, id: recordId }, "record.update", {
    fields: ["lead_status"],
  });
}

export type FivePatch = {
  leadStatus: string;
  company: string;
  city: string;
  annualRevenue: string;
  cfText: string;
};

export async function updateFive(
  client: pg.Client,
  option: "A" | "B" | "C",
  recordId: string,
  organizationId: string,
  patch: FivePatch,
  actorId: string,
  eventId: string,
  slots = false,
): Promise<void> {
  const search = await refreshedSearch(client, option, recordId, {
    lead_status: patch.leadStatus,
    company: patch.company,
    city: patch.city,
    cf_text_1: patch.cfText,
  });
  if (option === "A") {
    await client.query(
      `update bench_a.records set
         data = data || jsonb_build_object(
           'lead_status', $1::text,
           'company', $2::text,
           'city', $3::text,
           'annual_revenue', $4::numeric,
           'cf_text_1', $5::text
         ),
         ${slots ? "ix_text_3 = $1::text, ix_text_1 = $2::text, ix_num_1 = $4::double precision," : ""}
         search = $6, version = version + 1, updated_at = clock_timestamp(), updated_by = $7::uuid
       where id = $8::uuid`,
      [
        patch.leadStatus,
        patch.company,
        patch.city,
        patch.annualRevenue,
        patch.cfText,
        search,
        actorId,
        recordId,
      ],
    );
  } else if (option === "B") {
    await client.query(
      `update bench_b.leads set
         lead_status = $1, company = $2, city = $3, annual_revenue = $4::numeric, cf_text_1 = $5,
         search = $6, version = version + 1, updated_at = clock_timestamp(), updated_by = $7::uuid
       where id = $8::uuid`,
      [
        patch.leadStatus,
        patch.company,
        patch.city,
        patch.annualRevenue,
        patch.cfText,
        search,
        actorId,
        recordId,
      ],
    );
  } else {
    await client.query(
      `insert into bench_c.record_values (organization_id, record_id, field_id, value_text, value_num)
       select * from unnest($1::uuid[], $2::uuid[], $3::int[], $4::text[], $5::numeric[])
       on conflict (record_id, field_id) do update
         set value_text = excluded.value_text, value_num = excluded.value_num`,
      [
        Array.from({ length: 5 }, () => organizationId),
        Array.from({ length: 5 }, () => recordId),
        ["lead_status", "company", "city", "annual_revenue", "cf_text_1"].map((key) =>
          fieldId(key),
        ),
        [patch.leadStatus, patch.company, patch.city, null, patch.cfText],
        [null, null, null, patch.annualRevenue, null],
      ],
    );
    await client.query(
      `update bench_c.records
       set search = $1, version = version + 1, updated_at = clock_timestamp(), updated_by = $2::uuid
       where id = $3::uuid`,
      [search, actorId, recordId],
    );
  }
  const schema = option === "A" ? "bench_a" : option === "B" ? "bench_b" : "bench_c";
  await insertEvent(
    client,
    schema,
    eventId,
    { organizationId, id: recordId },
    "record.update_many",
    {
      fields: ["lead_status", "company", "city", "annual_revenue", "cf_text_1"],
    },
  );
}

export async function deleteInserted(
  client: pg.Client,
  option: "A" | "B" | "C",
  ids: string[],
): Promise<void> {
  if (ids.length === 0) return;
  const schema = option === "A" ? "bench_a" : option === "B" ? "bench_b" : "bench_c";
  const table = option === "B" ? "bench_b.leads" : `${schema}.records`;
  await client.query(`delete from ${schema}.events where record_id = any($1::uuid[])`, [ids]);
  if (option === "C") {
    await client.query(`delete from bench_c.record_values where record_id = any($1::uuid[])`, [
      ids,
    ]);
  }
  await client.query(`delete from ${table} where id = any($1::uuid[])`, [ids]);
}

export async function checkpoint(client: pg.Client): Promise<void> {
  await client.query("checkpoint");
}

/** GIN indexes on the table a write batch modifies. */
export async function ginIndexNames(client: pg.Client, option: "A" | "B" | "C"): Promise<string[]> {
  const schema = option === "A" ? "bench_a" : option === "B" ? "bench_b" : "bench_c";
  const tables = option === "B" ? ["leads"] : ["records"];
  const result = await client.query<{ name: string }>(
    `select n.nspname || '.' || c.relname as name
     from pg_class c
     join pg_namespace n on n.oid = c.relnamespace
     join pg_am am on am.oid = c.relam
     join pg_index i on i.indexrelid = c.oid
     join pg_class t on t.oid = i.indrelid
     join pg_namespace tn on tn.oid = t.relnamespace
     where am.amname = 'gin' and tn.nspname = $1 and t.relname = any($2::text[])
     order by 1`,
    [schema, tables],
  );
  return result.rows.map((row) => row.name);
}

/** Empties fastupdate pending lists. Returns the call duration in milliseconds. */
export async function cleanGinPending(
  client: pg.Client,
  indexes: readonly string[],
): Promise<number> {
  if (indexes.length === 0) return 0;
  const started = performance.now();
  for (const name of indexes) {
    await client.query("select gin_clean_pending_list($1::regclass)", [name]);
  }
  return performance.now() - started;
}

export type OperatorLeak = {
  operator: string;
  leftType: string;
  rightType: string;
  proc: string;
  leakproof: boolean;
};

/** Operators used by the scenario filters, with their leakproof flag. */
export async function filterOperators(client: pg.Client): Promise<OperatorLeak[]> {
  const result = await client.query<{
    operator: string;
    left_type: string;
    right_type: string;
    proc: string;
    leakproof: boolean;
  }>(`
    select o.oprname as operator,
      pg_catalog.format_type(o.oprleft, null) as left_type,
      pg_catalog.format_type(o.oprright, null) as right_type,
      p.proname as proc,
      p.proleakproof as leakproof
    from pg_operator o
    join pg_proc p on p.oid = o.oprcode
    join pg_type l on l.oid = o.oprleft
    join pg_type r on r.oid = o.oprright
    where o.oprnamespace = 'pg_catalog'::regnamespace
      and (l.typname, o.oprname, r.typname) in (
        ('text', '=', 'text'),
        ('text', '>=', 'text'),
        ('text', '<', 'text'),
        ('text', '>', 'text'),
        ('text', '~~*', 'text'),
        ('bool', '=', 'bool'),
        ('numeric', '>=', 'numeric'),
        ('float8', '=', 'float8'), ('float8', '<', 'float8'), ('float8', '>=', 'float8'),
        ('date', '=', 'date'), ('date', '<', 'date'),
        ('int8', '=', 'int8'), ('int8', '<', 'int8'),
        ('timestamptz', '>=', 'timestamptz'),
        ('timestamptz', '<', 'timestamptz'),
        ('uuid', '=', 'uuid'),
        ('uuid', '>', 'uuid'),
        ('jsonb', '@>', 'jsonb'),
        ('jsonb', '->', 'text'),
        ('jsonb', '->>', 'text'),
        ('tsvector', '@@', 'tsquery')
      )
    order by 2, 1, 3
  `);
  const lower = await client.query<{ proc: string; leakproof: boolean }>(
    "select proname as proc, proleakproof as leakproof from pg_proc where oid = 'pg_catalog.lower(text)'::regprocedure",
  );
  return [
    ...result.rows.map((row) => ({
      operator: row.operator,
      leftType: row.left_type,
      rightType: row.right_type,
      proc: row.proc,
      leakproof: row.leakproof,
    })),
    ...lower.rows.map((row) => ({
      operator: "lower(text)",
      leftType: "text",
      rightType: "—",
      proc: row.proc,
      leakproof: row.leakproof,
    })),
  ];
}

export async function walBytes(client: pg.Client, startLsn: string): Promise<number> {
  const result = await client.query<{ bytes: string }>(
    "select pg_wal_lsn_diff(pg_current_wal_lsn(), $1::pg_lsn)::float8 as bytes",
    [startLsn],
  );
  return Number(result.rows[0]?.bytes ?? 0);
}

export async function currentLsn(client: pg.Client): Promise<string> {
  const result = await client.query<{ lsn: string }>("select pg_current_wal_lsn()::text as lsn");
  const lsn = result.rows[0]?.lsn;
  if (!lsn) throw new Error("missing wal lsn");
  return lsn;
}

export function nextEventId(seq: number): string {
  return uuidV7(Date.now(), seq);
}

export type AlterTimes = {
  addNullMs: number;
  addDefaultMs: number;
  indexConcurrentMs: number;
};

export async function measureAlter(client: pg.Client): Promise<AlterTimes> {
  const time = async (sql: string): Promise<number> => {
    const started = performance.now();
    await client.query(sql);
    return performance.now() - started;
  };
  return {
    addNullMs: await time("alter table bench_b.leads add column bench_added_empty text"),
    addDefaultMs: await time(
      "alter table bench_b.leads add column bench_added_default text default 'unset'",
    ),
    indexConcurrentMs: await time(
      "create index concurrently b_added_idx on bench_b.leads (bench_added_empty)",
    ),
  };
}

const RLS_PREDICATE = `organization_id = (select nullif(current_setting('app.org_id', true), '')::uuid)`;

export async function installRls(client: pg.Client): Promise<void> {
  await client.query(`
    do $$ begin
      perform pg_advisory_xact_lock(18004096);
      if not exists (select 1 from pg_roles where rolname = 'bench_app') then
        create role bench_app login password 'bench_app' nosuperuser nocreatedb nocreaterole;
      end if;
    end $$
  `);
  const database = await client.query<{ name: string }>("select current_database() as name");
  const name = database.rows[0]?.name;
  if (!name) throw new Error("missing database name");
  await client.query(`grant connect on database ${client.escapeIdentifier(name)} to bench_app`);
  await client.query("grant usage on schema bench_a, bench_b to bench_app");
  await client.query(`
    grant select, insert, update, delete on
      bench_a.records, bench_a.events, bench_b.leads, bench_b.events
    to bench_app
  `);
  await client.query("grant execute on function pg_current_wal_lsn() to bench_app");
  await client.query("grant execute on function pg_wal_lsn_diff(pg_lsn, pg_lsn) to bench_app");
  const tables = ["bench_a.records", "bench_a.events", "bench_b.leads", "bench_b.events"];
  for (const table of tables) {
    const policy = `${table.replace(".", "_")}_org`;
    await client.query(`drop policy if exists ${policy} on ${table}`);
    await client.query(
      `create policy ${policy} on ${table} using (${RLS_PREDICATE}) with check (${RLS_PREDICATE})`,
    );
  }
}

export async function setRls(client: pg.Client, enabled: boolean): Promise<void> {
  const verb = enabled ? "enable" : "disable";
  for (const table of ["bench_a.records", "bench_a.events", "bench_b.leads", "bench_b.events"]) {
    await client.query(`alter table ${table} ${verb} row level security`);
  }
}

export function roleUrl(adminUrl: string): string {
  const url = new URL(adminUrl);
  url.username = "bench_app";
  url.password = "bench_app";
  return url.toString();
}

export type RlsCheck = {
  option: "A" | "B";
  name: string;
  pass: boolean;
  detail: string;
};

export async function verifyRls(
  admin: pg.Client,
  app: pg.Client,
  world: Universe,
  leadId: string,
): Promise<RlsCheck[]> {
  await setRls(admin, true);
  const checks: RlsCheck[] = [];
  const tables = [
    { option: "A" as const, table: "bench_a.records", extra: "" },
    { option: "B" as const, table: "bench_b.leads", extra: ", last_name" },
  ];
  for (const item of tables) {
    await app.query("begin");
    const unset = await app.query<{ n: number }>(`select count(*)::int as n from ${item.table}`);
    await app.query("commit");
    const unsetCount = unset.rows[0]?.n ?? -1;
    checks.push({
      option: item.option,
      name: "unset setting returns no rows",
      pass: unsetCount === 0,
      detail: `count=${unsetCount}`,
    });

    await app.query("begin");
    await app.query("select set_config('app.org_id', $1, true)", [world.orgB]);
    const read = await app.query(`select id from ${item.table} where id = $1::uuid`, [leadId]);
    await app.query("commit");
    checks.push({
      option: item.option,
      name: "org B cannot read an org A row",
      pass: read.rowCount === 0,
      detail: `rows=${read.rowCount ?? 0}`,
    });

    const before = await admin.query<{ name: string }>(
      `select name from ${item.table} where id = $1::uuid`,
      [leadId],
    );
    const original = before.rows[0]?.name ?? "";
    await app.query("begin");
    await app.query("select set_config('app.org_id', $1, true)", [world.orgB]);
    const updated = await app.query(
      `update ${item.table} set name = 'blocked-update' where id = $1::uuid`,
      [leadId],
    );
    await app.query("commit");
    const after = await admin.query<{ name: string }>(
      `select name from ${item.table} where id = $1::uuid`,
      [leadId],
    );
    checks.push({
      option: item.option,
      name: "org B cannot update an org A row",
      pass: (updated.rowCount ?? 0) === 0 && after.rows[0]?.name === original,
      detail: `updated=${updated.rowCount ?? 0}`,
    });

    const blockedId = uuidV7(Date.UTC(2026, 0, 2), 900_000 + (item.option === "A" ? 1 : 2));
    try {
      await app.query("begin");
      await app.query("select set_config('app.org_id', $1, true)", [world.orgB]);
      if (item.option === "A") {
        await app.query(
          `insert into bench_a.records (id, organization_id, module_id, created_at, updated_at, version, name, data, search)
           values ($1::uuid, $2::uuid, $3::uuid, now(), now(), 1, 'Blocked', '{}'::jsonb, 'blocked')`,
          [blockedId, world.orgA, world.moduleLeads],
        );
      } else {
        await app.query(
          `insert into bench_b.leads (id, organization_id, module_id, created_at, updated_at, version, name, search, last_name)
           values ($1::uuid, $2::uuid, $3::uuid, now(), now(), 1, 'Blocked', 'blocked', 'Blocked')`,
          [blockedId, world.orgA, world.moduleLeads],
        );
      }
      await app.query("commit");
      checks.push({
        option: item.option,
        name: "org B cannot insert an org A row",
        pass: false,
        detail: "insert succeeded",
      });
    } catch (error) {
      await app.query("rollback");
      const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
      checks.push({
        option: item.option,
        name: "org B cannot insert an org A row",
        pass: code === "42501",
        detail: code === "42501" ? "with check rejected the insert" : `sqlstate=${code}`,
      });
    }
  }
  return checks;
}
