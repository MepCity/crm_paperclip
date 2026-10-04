import {
  AS_OF_ISO,
  type FieldDef,
  fieldByKey,
  fieldId,
  LEAD_FIELDS,
  WINDOW_12_START_ISO,
  WINDOW_90_START_ISO,
} from "./dataset";

export type Option = "A" | "B" | "C";

/** A0/A1 keep jsonb containment. A2 equality matches the expression indexes. */
export type JsonEquality = "containment" | "expression";

export type Query = {
  text: string;
  values: unknown[];
};

export type ListRow = {
  id: string;
  lastName: string | null;
  company: string | null;
  email: string | null;
  phone: string | null;
  leadStatus: string | null;
  ownerId: string | null;
  createdAt: string;
  annualRevenue: string | null;
};

export type ReportRow = {
  leadSource: string | null;
  ownerId: string | null;
  count: number;
  revenue: string;
};

export type FullRecord = {
  id: string;
  organizationId: string;
  moduleId: string;
  ownerId: string | null;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  version: number;
  name: string;
  search: string;
  fields: Record<string, string | null>;
};

export type ListKind =
  | "s1"
  | "s2"
  | "s2-keyset"
  | "s2-offset"
  | "s3"
  | "s4"
  | "s5"
  | "s7-like"
  | "s7-prefix"
  | "s11";

export type ListParams = {
  orgId: string;
  moduleId: string;
  leadStatus: string;
  ownerId: string;
  revenueMin: string;
  industries: string[];
  rating: string;
  country: string;
  contactId: string;
  cursorCompany: string | null;
  cursorId: string | null;
  searchLike: string;
  prefixQuery: string;
  /** Used by the offset variant. Page-100 of the spec is 5000. */
  offset: number;
};

class Params {
  readonly values: unknown[] = [];

  add(value: unknown): string {
    this.values.push(value);
    return `$${this.values.length}`;
  }
}

const LIMIT = 50;

function textOrNull(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  return String(value);
}

function iso(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

function isoOrNull(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  return iso(value);
}

/** Formats a numeric of at most a few million with two decimal places. */
export function moneyText(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const text = String(value);
  const negative = text.startsWith("-");
  const raw = negative ? text.slice(1) : text;
  const [whole, frac = ""] = raw.split(".");
  const formatted = `${whole}.${frac.padEnd(2, "0").slice(0, 2)}`;
  return negative ? `-${formatted}` : formatted;
}

export function mapListRow(row: Record<string, unknown>): ListRow {
  return {
    id: String(row.id),
    lastName: textOrNull(row.last_name),
    company: textOrNull(row.company),
    email: textOrNull(row.email),
    phone: textOrNull(row.phone),
    leadStatus: textOrNull(row.lead_status),
    ownerId: textOrNull(row.owner_id),
    createdAt: iso(row.created_at),
    annualRevenue: moneyText(row.annual_revenue),
  };
}

function baseWhere(option: Option, params: Params, input: ListParams): string {
  const org = params.add(input.orgId);
  const moduleId = params.add(input.moduleId);
  if (option === "C") {
    return `r.organization_id = ${org}::uuid and r.module_id = ${moduleId}::uuid and r.deleted_at is null`;
  }
  return `organization_id = ${org}::uuid and module_id = ${moduleId}::uuid and deleted_at is null`;
}

function orderBy(option: Option, kind: ListKind): string {
  const company =
    option === "A"
      ? `(data->>'company') collate "und-x-icu"`
      : option === "B"
        ? `company`
        : `co.value_text`;
  const revenue =
    option === "A"
      ? `(data->'annual_revenue')::numeric`
      : option === "B"
        ? `annual_revenue`
        : `rev.value_num`;
  const lastName =
    option === "A"
      ? `(data->>'last_name') collate "und-x-icu"`
      : option === "B"
        ? `last_name`
        : `ln.value_text`;
  const created = option === "C" ? "r.created_at" : "created_at";
  const updated = option === "C" ? "r.updated_at" : "updated_at";
  const id = option === "C" ? "r.id" : "id";
  switch (kind) {
    case "s2":
    case "s2-keyset":
    case "s2-offset":
      return `order by ${company} asc nulls last, ${id} asc`;
    case "s3":
      return `order by ${revenue} desc nulls last, ${id} desc`;
    case "s4":
      return `order by ${lastName} asc nulls last, ${id} asc`;
    case "s5":
    case "s7-like":
    case "s7-prefix":
      return `order by ${updated} desc, ${id} desc`;
    default:
      return `order by ${created} desc, ${id} desc`;
  }
}

function companyExpr(option: Option): string {
  if (option === "A") return `((data->>'company') collate "und-x-icu")`;
  if (option === "B") return `(company collate "und-x-icu")`;
  return `(co.value_text collate "und-x-icu")`;
}

function tableId(option: Option): string {
  if (option === "A") return "bench_a.records.id";
  if (option === "B") return "bench_b.leads.id";
  return "r.id";
}

function filters(
  option: Option,
  kind: ListKind,
  params: Params,
  input: ListParams,
  equality: JsonEquality,
): string {
  const parts: string[] = [];
  if (kind === "s2" || kind === "s2-offset") {
    parts.push(statusFilter(option, params, input.leadStatus, equality));
  }
  if (kind === "s3") parts.push(s3Filter(option, params, input));
  if (kind === "s4") parts.push(optOutFilter(option, params, equality));
  if (kind === "s5") parts.push(s5Filter(option, params, input, equality));
  if (kind === "s7-like") {
    const like = params.add(input.searchLike);
    const column = option === "C" ? "r.search" : "search";
    parts.push(`${column} ilike ${like}`);
  }
  if (kind === "s7-prefix") {
    const query = params.add(input.prefixQuery);
    const column = option === "C" ? "r.search" : "search";
    parts.push(`to_tsvector('simple', ${column}) @@ to_tsquery('simple', ${query})`);
  }
  if (kind === "s11") parts.push(lookupFilter(option, params, input.contactId, equality));
  return parts.length > 0 ? ` and ${parts.join(" and ")}` : "";
}

function textEquals(key: string, slot: string): string {
  return `((data->>'${key}') collate "und-x-icu") = ${slot}`;
}

function statusFilter(
  option: Option,
  params: Params,
  status: string,
  equality: JsonEquality,
): string {
  if (option === "A") {
    if (equality === "expression") return textEquals("lead_status", params.add(status));
    return `data @> ${params.add(JSON.stringify({ lead_status: status }))}::jsonb`;
  }
  if (option === "B") return `lead_status = ${params.add(status)}`;
  return `st.value_text = ${params.add(status)}`;
}

function optOutFilter(option: Option, params: Params, equality: JsonEquality): string {
  if (option === "A") {
    if (equality === "expression") {
      return `((data->>'email_opt_out')) = ${params.add("false")}`;
    }
    return `data @> ${params.add(JSON.stringify({ email_opt_out: false }))}::jsonb`;
  }
  if (option === "B") return `email_opt_out = ${params.add(false)}::boolean`;
  return `eo.value_bool = ${params.add(false)}::boolean`;
}

function s3Filter(option: Option, params: Params, input: ListParams): string {
  const owner = params.add(input.ownerId);
  const start = params.add(WINDOW_90_START_ISO);
  const end = params.add(AS_OF_ISO);
  const revenue = params.add(input.revenueMin);
  if (option === "A") {
    return `owner_id = ${owner}::uuid
      and (data->>'cf_datetime_1') collate "C" >= ${start}
      and (data->>'cf_datetime_1') collate "C" < ${end}
      and (data->'annual_revenue')::numeric >= ${revenue}::numeric`;
  }
  if (option === "B") {
    return `owner_id = ${owner}::uuid
      and cf_datetime_1 >= ${start}::timestamptz
      and cf_datetime_1 < ${end}::timestamptz
      and annual_revenue >= ${revenue}::numeric`;
  }
  return `r.owner_id = ${owner}::uuid
    and dt.value_ts >= ${start}::timestamptz
    and dt.value_ts < ${end}::timestamptz
    and rev.value_num >= ${revenue}::numeric`;
}

function s5Filter(
  option: Option,
  params: Params,
  input: ListParams,
  equality: JsonEquality,
): string {
  if (option === "A") {
    if (equality === "expression") {
      const industries = params.add(input.industries);
      const rating = params.add(input.rating);
      const country = params.add(input.country);
      return `((${textEquals("industry", `any(${industries}::text[])`)} or ${textEquals("rating", rating)}) and ${textEquals("country", country)})`;
    }
    const industries = input.industries.map((value) =>
      params.add(JSON.stringify({ industry: value })),
    );
    const rating = params.add(JSON.stringify({ rating: input.rating }));
    const country = params.add(JSON.stringify({ country: input.country }));
    const industrySql = industries.map((slot) => `data @> ${slot}::jsonb`).join(" or ");
    return `((${industrySql} or data @> ${rating}::jsonb) and data @> ${country}::jsonb)`;
  }
  if (option === "B") {
    const industries = params.add(input.industries);
    const rating = params.add(input.rating);
    const country = params.add(input.country);
    return `((industry = any(${industries}::text[]) or rating = ${rating}) and country = ${country})`;
  }
  const industries = params.add(input.industries);
  const rating = params.add(input.rating);
  const country = params.add(input.country);
  return `((
      exists (
        select 1 from bench_c.record_values v
        where v.organization_id = r.organization_id and v.record_id = r.id
          and v.field_id = ${fieldId("industry")} and v.value_text = any(${industries}::text[])
      )
      or exists (
        select 1 from bench_c.record_values v
        where v.organization_id = r.organization_id and v.record_id = r.id
          and v.field_id = ${fieldId("rating")} and v.value_text = ${rating}
      )
    ) and exists (
      select 1 from bench_c.record_values v
      where v.organization_id = r.organization_id and v.record_id = r.id
        and v.field_id = ${fieldId("country")} and v.value_text = ${country}
    ))`;
}

function lookupFilter(
  option: Option,
  params: Params,
  contactId: string,
  equality: JsonEquality,
): string {
  if (option === "A") {
    if (equality === "expression") return textEquals("cf_lookup_1", params.add(contactId));
    return `data @> ${params.add(JSON.stringify({ cf_lookup_1: contactId }))}::jsonb`;
  }
  if (option === "B") return `cf_lookup_1 = ${params.add(contactId)}::uuid`;
  const slot = params.add(contactId);
  return `exists (
    select 1 from bench_c.record_values v
    where v.organization_id = r.organization_id and v.record_id = r.id
      and v.field_id = ${fieldId("cf_lookup_1")} and v.value_text = ${slot}
  )`;
}

function cJoins(kind: ListKind): string {
  const join = (alias: string, key: string) =>
    `left join bench_c.record_values ${alias} on ${alias}.record_id = r.id and ${alias}.field_id = ${fieldId(key)}`;
  const parts = [
    join("ln", "last_name"),
    join("co", "company"),
    join("em", "email"),
    join("ph", "phone"),
    join("st", "lead_status"),
    join("rev", "annual_revenue"),
  ];
  if (kind === "s3") parts.push(join("dt", "cf_datetime_1"));
  if (kind === "s4") parts.push(join("eo", "email_opt_out"));
  return parts.join("\n");
}

function selectList(option: Option, kind: ListKind): string {
  if (option === "A") {
    return `select id::text as id,
      data->>'last_name' as last_name,
      data->>'company' as company,
      data->>'email' as email,
      data->>'phone' as phone,
      data->>'lead_status' as lead_status,
      owner_id::text as owner_id,
      created_at,
      (data->'annual_revenue')::numeric(16,2) as annual_revenue
    from bench_a.records`;
  }
  if (option === "B") {
    return `select id::text as id, last_name, company, email, phone, lead_status,
      owner_id::text as owner_id, created_at, annual_revenue
    from bench_b.leads`;
  }
  return `select r.id::text as id,
      ln.value_text as last_name,
      co.value_text as company,
      em.value_text as email,
      ph.value_text as phone,
      st.value_text as lead_status,
      r.owner_id::text as owner_id,
      r.created_at,
      rev.value_num as annual_revenue
    from bench_c.records r
    ${cJoins(kind)}`;
}

function keysetQuery(option: Option, input: ListParams, equality: JsonEquality): Query {
  const params = new Params();
  const where = `${baseWhere(option, params, input)} and ${statusFilter(option, params, input.leadStatus, equality)}`;
  const select = selectList(option, "s2");
  const company = companyExpr(option);
  const id = tableId(option);
  if (input.cursorCompany === null) {
    const idSlot = params.add(input.cursorId);
    return {
      text: `${select} where ${where} and ${company} is null and ${id} > ${idSlot}::uuid order by ${id} asc limit ${LIMIT}`,
      values: params.values,
    };
  }
  const companySlot = params.add(input.cursorCompany);
  const idSlot = params.add(input.cursorId);
  const after = `(${company}, ${id}) > (${companySlot}::text collate "und-x-icu", ${idSlot}::uuid)`;
  const head = `${select} where ${where} and ${after} order by ${company} asc, ${id} asc limit ${LIMIT}`;
  const tail = `${select} where ${where} and ${company} is null order by ${id} asc limit ${LIMIT}`;
  return {
    text: `select id, last_name, company, email, phone, lead_status, owner_id, created_at, annual_revenue
      from ((${head}) union all (${tail})) page
      order by company collate "und-x-icu" asc nulls last, id asc
      limit ${LIMIT}`,
    values: params.values,
  };
}

export function listQuery(
  option: Option,
  kind: ListKind,
  input: ListParams,
  equality: JsonEquality = "containment",
): Query {
  if (kind === "s2-keyset") return keysetQuery(option, input, equality);
  const params = new Params();
  const where = baseWhere(option, params, input);
  const extra = filters(option, kind, params, input, equality);
  const order = orderBy(option, kind);
  const offset = kind === "s2-offset" ? ` offset ${params.add(input.offset)}::int` : "";
  return {
    text: `${selectList(option, kind)} where ${where}${extra} ${order} limit ${LIMIT}${offset}`,
    values: params.values,
  };
}

/** Company/id cursor at offset 4949 for the S2 keyset (page 100). */
export function cursorQuery(
  option: Option,
  input: ListParams,
  equality: JsonEquality = "containment",
): Query {
  const params = new Params();
  const where = baseWhere(option, params, input);
  const status = statusFilter(option, params, input.leadStatus, equality);
  const company =
    option === "A"
      ? `(data->>'company') collate "und-x-icu"`
      : option === "B"
        ? `company`
        : `co.value_text`;
  const id = option === "C" ? "r.id::text" : "id::text";
  const from =
    option === "C"
      ? `bench_c.records r ${cJoins("s2")}`
      : option === "A"
        ? "bench_a.records"
        : "bench_b.leads";
  return {
    text: `select ${company} as company, ${id} as id from ${from} where ${where} and ${status} ${orderBy(option, "s2")} offset 4949 limit 1`,
    values: params.values,
  };
}

function countBody(
  option: Option,
  kind: "s2" | "s4",
  input: ListParams,
  equality: JsonEquality,
): Query {
  const params = new Params();
  const where = baseWhere(option, params, input);
  const extra = filters(option, kind, params, input, equality);
  const from =
    option === "A"
      ? "bench_a.records"
      : option === "B"
        ? "bench_b.leads"
        : `bench_c.records r ${cJoins(kind)}`;
  return { text: `select 1 from ${from} where ${where}${extra}`, values: params.values };
}

export function countQuery(
  option: Option,
  kind: "s2" | "s4",
  input: ListParams,
  capped: boolean,
  equality: JsonEquality = "containment",
): Query {
  const body = countBody(option, kind, input, equality);
  if (!capped) {
    return { text: `select count(*)::int as n from (${body.text}) s`, values: body.values };
  }
  return {
    text: `select count(*)::int as n from (${body.text} limit 10001) s`,
    values: body.values,
  };
}

function sourceExpr(option: Option): string {
  if (option === "A") return `(data->>'lead_source') collate "und-x-icu"`;
  if (option === "B") return `lead_source`;
  return `src.value_text`;
}

function revenueExpr(option: Option): string {
  if (option === "A") return `(data->'annual_revenue')::numeric`;
  if (option === "B") return `annual_revenue`;
  return `rev.value_num`;
}

export function reportQuery(option: Option, byOwner: boolean, input: ListParams): Query {
  const params = new Params();
  const where = baseWhere(option, params, input);
  const from = params.add(WINDOW_12_START_ISO);
  const to = params.add(AS_OF_ISO);
  const created = option === "C" ? "r.created_at" : "created_at";
  const owner = option === "C" ? "r.owner_id::text" : "owner_id::text";
  const source = sourceExpr(option);
  const revenue = revenueExpr(option);
  const fromSql =
    option === "A"
      ? "bench_a.records"
      : option === "B"
        ? "bench_b.leads"
        : `bench_c.records r
          left join bench_c.record_values src on src.record_id = r.id and src.field_id = ${fieldId("lead_source")}
          left join bench_c.record_values rev on rev.record_id = r.id and rev.field_id = ${fieldId("annual_revenue")}`;
  const ownerSelect = byOwner ? `${owner} as owner_id` : "null::text as owner_id";
  const group = byOwner ? `${source}, ${option === "C" ? "r.owner_id" : "owner_id"}` : source;
  const order = byOwner
    ? `${source} asc nulls last, ${option === "C" ? "r.owner_id" : "owner_id"} asc nulls last`
    : `${source} asc nulls last`;
  return {
    text: `select ${source} as lead_source, ${ownerSelect}, count(*)::int as n,
        coalesce(sum(${revenue}), 0)::numeric(16,2) as revenue
      from ${fromSql}
      where ${where} and ${created} >= ${from}::timestamptz and ${created} < ${to}::timestamptz
      group by ${group}
      order by ${order}`,
    values: params.values,
  };
}

export function mapReportRow(row: Record<string, unknown>): ReportRow {
  return {
    leadSource: textOrNull(row.lead_source),
    ownerId: textOrNull(row.owner_id),
    count: Number(row.n),
    revenue: moneyText(row.revenue) ?? "0.00",
  };
}

export function fullQuery(option: Option, id: string): Query {
  if (option === "A") {
    return {
      text: `select id::text, organization_id::text, module_id::text, owner_id::text,
          created_by::text, updated_by::text, created_at, updated_at, deleted_at,
          version, name, search, data
        from bench_a.records where id = $1::uuid`,
      values: [id],
    };
  }
  if (option === "B") {
    const cols = LEAD_FIELDS.map((field) =>
      field.type === "date" ? `${field.key}::text as ${field.key}` : field.key,
    ).join(", ");
    return {
      text: `select id::text, organization_id::text, module_id::text, owner_id::text,
          created_by::text, updated_by::text, created_at, updated_at, deleted_at,
          version, name, search, ${cols}
        from bench_b.leads where id = $1::uuid`,
      values: [id],
    };
  }
  return {
    text: `select r.id::text, r.organization_id::text, r.module_id::text, r.owner_id::text,
        r.created_by::text, r.updated_by::text, r.created_at, r.updated_at, r.deleted_at,
        r.version, r.name, r.search,
        v.field_id, v.value_text, v.value_num, v.value_bool, v.value_ts
      from bench_c.records r
      left join bench_c.record_values v on v.record_id = r.id
      where r.id = $1::uuid`,
    values: [id],
  };
}

function canonicalValue(field: FieldDef, raw: unknown): string | null {
  if (raw === null || raw === undefined) return null;
  switch (field.type) {
    case "boolean":
      return raw === true || raw === "true" || raw === "t" ? "true" : "false";
    case "integer":
      return String(Math.trunc(Number(raw)));
    case "decimal":
      return moneyText(raw);
    case "datetime":
      return iso(raw);
    case "date":
      return raw instanceof Date ? raw.toISOString().slice(0, 10) : String(raw).slice(0, 10);
    default:
      return String(raw);
  }
}

function headerFrom(row: Record<string, unknown>): Omit<FullRecord, "fields"> {
  return {
    id: String(row.id),
    organizationId: String(row.organization_id),
    moduleId: String(row.module_id),
    ownerId: textOrNull(row.owner_id),
    createdBy: textOrNull(row.created_by),
    updatedBy: textOrNull(row.updated_by),
    createdAt: iso(row.created_at),
    updatedAt: iso(row.updated_at),
    deletedAt: isoOrNull(row.deleted_at),
    version: Number(row.version),
    name: String(row.name),
    search: String(row.search),
  };
}

export function mapFullA(row: Record<string, unknown>): FullRecord {
  const data = (row.data ?? {}) as Record<string, unknown>;
  const fields: Record<string, string | null> = {};
  for (const field of LEAD_FIELDS) fields[field.key] = canonicalValue(field, data[field.key]);
  return { ...headerFrom(row), fields };
}

export function mapFullB(row: Record<string, unknown>): FullRecord {
  const fields: Record<string, string | null> = {};
  for (const field of LEAD_FIELDS) fields[field.key] = canonicalValue(field, row[field.key]);
  return { ...headerFrom(row), fields };
}

export function mapFullC(rows: Record<string, unknown>[]): FullRecord {
  const header = rows[0];
  if (!header) throw new Error("missing record");
  const byId = new Map(LEAD_FIELDS.map((field) => [fieldId(field.key), field]));
  const fields: Record<string, string | null> = {};
  for (const field of LEAD_FIELDS) fields[field.key] = null;
  for (const row of rows) {
    if (row.field_id === null || row.field_id === undefined) continue;
    const field = byId.get(Number(row.field_id));
    if (!field) continue;
    const raw =
      field.type === "boolean"
        ? row.value_bool
        : field.type === "integer" || field.type === "decimal"
          ? row.value_num
          : field.type === "datetime" || field.type === "date"
            ? row.value_ts
            : row.value_text;
    fields[field.key] = canonicalValue(field, raw);
  }
  return { ...headerFrom(header), fields };
}

export function defaultListParams(input: {
  orgId: string;
  moduleId: string;
  leadStatus: string;
  ownerId: string;
  contactId: string;
  searchLike?: string;
}): ListParams {
  return {
    orgId: input.orgId,
    moduleId: input.moduleId,
    leadStatus: input.leadStatus,
    ownerId: input.ownerId,
    revenueMin: "2500000.00",
    industries: ["industry_00", "industry_01", "industry_02"].map((key) => key),
    rating: "rating_0",
    country: "country_000",
    contactId: input.contactId,
    cursorCompany: null,
    cursorId: null,
    searchLike: input.searchLike ?? "%xqz%",
    prefixQuery: "alpha:*",
    offset: 5000,
  };
}

export { fieldByKey };
