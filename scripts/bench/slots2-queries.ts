import { AS_OF_ISO, WINDOW_12_START_ISO, WINDOW_90_START_ISO } from "./dataset";
import type { ListParams, Query } from "./queries";
import { type SlotScenario, scenarioQuery } from "./slot-queries";
import { compiledThreshold } from "./slots2-numeric";
import { fieldUuid, MODEL_SCHEMA, type Model } from "./slots2-storage";

export const CORE = [
  "S2",
  "S2-KEYSET",
  "S2-OFFSET",
  "S3",
  "S5",
  "S11",
  "S14 (a)",
  "S14 (b)",
  "S2 count",
  "S8",
] as const;
export type Core = (typeof CORE)[number];
export function display(alias = "r"): string {
  return `${alias}.id::text as id,${alias}.data->>'last_name' as last_name,
    ${alias}.data->>'company' as company,${alias}.data->>'email' as email,
    ${alias}.data->>'phone' as phone,${alias}.data->>'lead_status' as lead_status,
    ${alias}.owner_id::text as owner_id,${alias}.created_at,
    (${alias}.data->>'annual_revenue')::numeric as annual_revenue`;
}
export function coreQuery(model: Model, scenario: Core, p: ListParams, id: string): Query {
  if (model.startsWith("A5")) return sideQuery(model, scenario, p, id);
  const old = scenario.startsWith("S14") ? "S14" : (scenario as SlotScenario);
  const q = scenarioQuery("A4", old, p, id);
  let text = q.text
    .replaceAll("bench_a.records", `${MODEL_SCHEMA[model]}.records`)
    .replaceAll("(data->'annual_revenue')::numeric(16,2)", "(data->>'annual_revenue')::numeric")
    .replaceAll("(data->'annual_revenue')::numeric", "(data->>'annual_revenue')::numeric");
  const values = [...q.values];
  if (scenario === "S8") {
    values.push(p.orgId);
    text += " and organization_id=$2::uuid";
  }
  text = text.replace(/ix_num_1 >= \$(\d+)::double precision/g, (_, n: string) => {
    const index = Number(n) - 1;
    values[index] = compiledThreshold(">=", String(values[index])).value;
    return `ix_num_1 >= $${n}::bigint`;
  });
  if (scenario === "S14 (b)")
    text = text.replace(/ix_num_1 desc nulls last, ([\w.]+) asc/, "ix_num_1 desc, $1 desc");
  return { text, values };
}
export function twoStep(
  model: Model,
  scenario: "S3" | "S14 (a)" | "S2-OFFSET",
  p: ListParams,
  id: string,
): Query {
  const q = coreQuery(model, scenario, p, id);
  const schema = MODEL_SCHEMA[model];
  const slot = scenario === "S2-OFFSET" ? "ix_text_1" : "ix_num_1";
  const direction = scenario === "S2-OFFSET" ? "asc" : "desc";
  const idDirection = scenario === "S14 (a)" ? "asc" : direction;
  const from = q.text.indexOf(`from ${schema}.records`);
  if (from < 0) throw new Error("two step needs a simple core query");
  return {
    values: q.values,
    text: `with page as materialized (
    select ${schema}.records.id,${slot} as sort_key ${q.text.slice(from)}
  ) select ${display()} from page p cross join lateral (
    select * from ${schema}.records where organization_id=$1::uuid and id=p.id offset 0
  ) r order by p.sort_key ${direction} nulls last,p.id ${idDirection}`,
  };
}
export const ORDERS = {
  O1: { direction: "asc", nulls: "last" },
  O2: { direction: "desc", nulls: "first" },
  O3: { direction: "desc", nulls: "last" },
  O4: { direction: "asc", nulls: "first" },
} as const;
export type Order = keyof typeof ORDERS;
export function matrixQuery(
  model: Model,
  order: Order,
  offset: number,
  p: ListParams,
  filtered: boolean,
  split: boolean,
  only?: "filled" | "empty",
): Query {
  const { direction, nulls } = ORDERS[order];
  const values: unknown[] = [p.orgId, p.moduleId, offset];
  const schema = MODEL_SCHEMA[model];
  const table = `${schema}.records`;
  let where = "r.organization_id=$1::uuid and r.module_id=$2::uuid and r.deleted_at is null";
  if (filtered) {
    values.push(p.leadStatus);
    where += " and r.ix_text_3=$4::text";
  }
  const filledFirst = nulls === "last";
  const filled = `select r.*,${filledFirst ? 0 : 1} as part from ${table} r where ${where}
    and r.ix_text_1 is not null order by r.ix_text_1 ${direction},r.id ${direction} limit ($3::int+51)`;
  const empty = `select r.*,${filledFirst ? 1 : 0} as part from ${table} r where ${where}
    and r.ix_text_1 is null order by r.id ${direction} limit ($3::int+51)`;
  if (only) return { text: only === "filled" ? filled : empty, values };
  return {
    values,
    text: split
      ? `select * from ((${filled}) union all (${empty})) q
    order by q.part,q.ix_text_1 ${direction} nulls ${nulls},q.id ${direction} limit 51 offset $3::int`
      : `select r.* from ${table} r where ${where} order by r.ix_text_1 ${direction} nulls ${nulls},r.id ${direction} limit 51 offset $3::int`,
  };
}

function sideQuery(model: Model, scenario: Core, p: ListParams, id: string): Query {
  const schema = MODEL_SCHEMA[model];
  const values: unknown[] = [p.orgId, p.moduleId];
  const param = (value: unknown) => {
    values.push(value);
    return `$${values.length}`;
  };
  const where = "r.organization_id=$1::uuid and r.module_id=$2::uuid and r.deleted_at is null";
  const index = `${schema}.record_index`;
  const exists = (key: string, condition: (alias: string) => string) => {
    const f = param(fieldUuid(key));
    return `exists(select 1 from ${index} e where e.organization_id=r.organization_id
      and e.module_id=r.module_id and e.record_id=r.id and e.field_id=${f}::uuid and ${condition("e")})`;
  };
  const join = (
    key: string,
    alias: string,
    outer = false,
  ) => `${outer ? "left join" : "join"} ${index} ${alias}
    on ${alias}.organization_id=r.organization_id and ${alias}.module_id=r.module_id
    and ${alias}.record_id=r.id and ${alias}.field_id=${param(fieldUuid(key))}::uuid`;
  if (scenario === "S8")
    return {
      text: `select r.* from ${schema}.records r where r.organization_id=$1::uuid and r.module_id=$2::uuid and r.id=${param(id)}::uuid`,
      values,
    };
  let joins = "";
  let extra = "";
  let order = "r.created_at desc,r.id desc";
  let offset = "";
  if (scenario.startsWith("S2")) {
    const status = param(p.leadStatus);
    extra += ` and ${exists("lead_status", (a) => `${a}.v_text=${status}::text`)}`;
    if (scenario !== "S2 count") {
      joins += join("company", "co", true);
      order = "co.v_text asc nulls last,r.id asc";
      if (scenario === "S2-KEYSET") {
        const cursorId = param(p.cursorId);
        if (p.cursorCompany === null) extra += ` and co.v_text is null and r.id>${cursorId}::uuid`;
        else
          extra += ` and ((co.v_text,r.id)>(${param(p.cursorCompany)}::text collate "und-x-icu",${cursorId}::uuid) or co.v_text is null)`;
      }
      if (scenario === "S2-OFFSET") offset = ` offset ${param(p.offset)}::int`;
    }
  } else if (scenario === "S3" || scenario.startsWith("S14")) {
    joins += join("annual_revenue", "rev");
    extra += ` and rev.v_num>=${param(compiledThreshold(">=", p.revenueMin).value)}::bigint`;
    order = `rev.v_num desc${scenario === "S14 (b)" ? "" : " nulls last"},r.id ${scenario === "S14 (a)" ? "asc" : "desc"}`;
    if (scenario === "S3") {
      extra += ` and r.owner_id=${param(p.ownerId)}::uuid`;
      const from = param(WINDOW_90_START_ISO),
        to = param(AS_OF_ISO);
      extra += ` and ${exists("cf_datetime_1", (a) => `${a}.v_time>=${from}::timestamptz and ${a}.v_time<${to}::timestamptz`)}`;
    }
  } else if (scenario === "S5") {
    joins += join("country", "country");
    const country = param(p.country),
      industry = param(p.industries),
      rating = param(p.rating);
    extra += ` and country.v_text=${country}::text and (${exists("industry", (a) => `${a}.v_text=any(${industry}::text[])`)}
      or ${exists("rating", (a) => `${a}.v_text=${rating}::text`)})`;
    order = "r.updated_at desc,r.id desc";
  } else if (scenario === "S11") {
    joins += join("cf_lookup_1", "ref");
    extra += ` and ref.v_ref=${param(p.contactId)}::uuid`;
  }
  if (scenario === "S2 count")
    return {
      text: `select count(*)::int as n from ${schema}.records r ${joins} where ${where}${extra}`,
      values,
    };
  return {
    text: `select ${display()} from ${schema}.records r ${joins} where ${where}${extra} order by ${order} limit 50${offset}`,
    values,
  };
}
export function sideNullQuery(
  order: "O1" | "O3",
  p: ListParams,
  offset: number,
  predicate?: "null" | "not null",
): Query {
  const dir = order === "O1" ? "asc" : "desc";
  return {
    text: `select r.id::text from bench_side.records r left join bench_side.record_index co
    on co.organization_id=r.organization_id and co.record_id=r.id and co.field_id=$3::uuid
    where r.organization_id=$1::uuid and r.module_id=$2::uuid and r.deleted_at is null
    ${predicate ? `and co.v_text is ${predicate}` : ""}
    order by co.v_text ${dir} nulls last,r.id ${dir} limit 51 offset $4::int`,
    values: [p.orgId, p.moduleId, fieldUuid("company"), offset],
  };
}
export function slotReportQuery(owner: boolean, p: ListParams): Query {
  return {
    text: `select ix_text_4 as lead_source,${owner ? "owner_id::text" : "null::text"} as owner_id,
    count(*)::int as n,(coalesce(sum(ix_num_1),0)/100::numeric)::numeric(38,2) as revenue from bench_slot.records
    where organization_id=$1::uuid and module_id=$2::uuid and deleted_at is null
    and ix_time_2>=$3::timestamptz and ix_time_2<$4::timestamptz
    group by ix_text_4${owner ? ",owner_id" : ""} order by ix_text_4 asc nulls last${owner ? ",owner_id asc nulls last" : ""}`,
    values: [p.orgId, p.moduleId, WINDOW_12_START_ISO, AS_OF_ISO],
  };
}
/** Predicate cardinality is independent of LIMIT, OFFSET and early scan termination. */
export function predicateCount(q: Query): Query | null {
  if (/union all|group by/.test(q.text)) return null;
  const from = q.text.indexOf("from ");
  if (from < 0) return null;
  const tail = q.text.slice(from).replace(/ order by[\s\S]*$/i, "");
  // Keep unused positional parameters typed by wrapping the original WHERE query rather than dropping bindings.
  const used = [...tail.matchAll(/\$(\d+)/g)].map((m) => Number(m[1]));
  const max = Math.max(0, ...used);
  return { text: `select count(*)::int as n ${tail}`, values: q.values.slice(0, max) };
}
