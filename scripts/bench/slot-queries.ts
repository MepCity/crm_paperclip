import type pg from "pg";
import { AS_OF_ISO, type Universe, WINDOW_90_START_ISO } from "./dataset";
import {
  countQuery,
  fullQuery,
  type ListKind,
  type ListParams,
  listQuery,
  type Query,
} from "./queries";
import { LEAD_SLOTS } from "./slot-layout";

export const SLOT_SCENARIOS = [
  "S1",
  "S2",
  "S2-KEYSET",
  "S2-OFFSET",
  "S3",
  "S4",
  "S5",
  "S11",
  "S14",
  "S2 count",
  "S2 capped",
  "S8",
] as const;
export type SlotScenario = (typeof SLOT_SCENARIOS)[number];

/** Replace only compiler expressions; display values continue to come from data. */
export function projectSlots(query: Query): Query {
  let text = query.text;
  for (const [key, slot] of Object.entries(LEAD_SLOTS)) {
    if (slot.startsWith("ix_text")) {
      text = text.replaceAll(`(data->>'${key}') collate "und-x-icu"`, slot);
    }
  }
  text = text.replace(/\(data->'annual_revenue'\)::numeric(?!\()/g, "ix_num_1");
  text = text.replace(/(ix_num_1 >= \$\d+)::numeric/g, "$1::double precision");
  text = text.replace(
    /\(data->>'cf_datetime_1'\) collate "C" (>=|<) (\$\d+)/g,
    "ix_time_1 $1 $2::timestamptz",
  );
  text = text.replace(
    /\(\(data->>'cf_lookup_1'\) collate "und-x-icu"\) = (\$\d+)/g,
    "ix_ref_1 = $1::uuid",
  );
  if (text.includes("union all")) {
    text = text.replaceAll(
      "as annual_revenue\n    from bench_a.records",
      "as annual_revenue, ix_text_1\n    from bench_a.records",
    );
    text = text.replace(
      'order by company collate "und-x-icu" asc nulls last, id asc',
      "order by ix_text_1 asc nulls last, id asc",
    );
  }
  return { text, values: query.values };
}

export function scenarioQuery(
  stage: string,
  scenario: SlotScenario,
  input: ListParams,
  id: string,
): Query {
  const option = stage === "B1" ? "B" : "A";
  let query: Query;
  if (scenario === "S8") query = fullQuery(option, id);
  else if (scenario === "S2 count" || scenario === "S2 capped") {
    query = countQuery(option, "s2", input, scenario === "S2 capped", "expression");
  } else query = listQuery(option, scenario.toLowerCase() as ListKind, input, "expression");
  return stage.startsWith("A4") ? projectSlots(query) : query;
}

/** Pick selective filters from loaded data so equivalence cannot pass on empty sets. */
export async function loadedParams(
  client: pg.Client,
  world: Universe,
  count = 30,
): Promise<ListParams[]> {
  const where = "organization_id = $1::uuid and module_id = $2::uuid and deleted_at is null";
  const values = [world.orgA, world.moduleLeads];
  const tuples = await client.query(
    `select industry, rating, country, lead_status, cf_lookup_1::text as contact_id
    from bench_b.leads where ${where} and industry is not null and rating is not null and country is not null
      and lead_status is not null and cf_lookup_1 is not null order by id limit $3`,
    [...values, count],
  );
  const owners = await client.query(
    `select owner_id::text as owner_id from bench_b.leads where ${where}
    and owner_id is not null and cf_datetime_1 >= $3::timestamptz and cf_datetime_1 < $4::timestamptz
    and annual_revenue >= 2500000 order by id limit $5`,
    [...values, WINDOW_90_START_ISO, AS_OF_ISO, count],
  );
  const threshold = await client.query(
    `select annual_revenue::text as revenue from bench_b.leads where ${where}
    and annual_revenue is not null order by annual_revenue desc offset
    (select floor(count(*) * 0.10)::int from bench_b.leads where ${where}) limit 1`,
    values,
  );
  if (!tuples.rows.length || !owners.rows.length || !threshold.rows.length)
    throw new Error("loaded dataset lacks nonempty filter parameters");
  const params: ListParams[] = [];
  for (let i = 0; i < count; i++) {
    const tuple = tuples.rows[i % tuples.rows.length];
    const owner = owners.rows[i % owners.rows.length];
    const status = tuple.lead_status;
    const n = await client.query(
      `select count(*)::int as n from bench_b.leads where ${where} and lead_status = $3`,
      [...values, status],
    );
    // Small fixtures also seek a populated page. Full scale keeps page 100.
    const offset = Math.max(0, Math.min(4949, Number(n.rows[0]?.n) - 51));
    const cursor = await client.query(
      `select company, id::text from bench_b.leads where ${where} and lead_status = $3
      order by company collate "und-x-icu" asc nulls last, bench_b.leads.id asc offset $4 limit 1`,
      [...values, status, offset],
    );
    const row = cursor.rows[0];
    params.push({
      orgId: world.orgA,
      moduleId: world.moduleLeads,
      leadStatus: status,
      ownerId: owner.owner_id,
      revenueMin: "2500000.00",
      industries: [tuple.industry],
      rating: tuple.rating,
      country: tuple.country,
      contactId: tuple.contact_id,
      cursorCompany: row?.company ?? null,
      cursorId: row?.id ?? null,
      searchLike: "%xqz%",
      prefixQuery: "alpha:*",
      offset: 5000,
    });
  }
  // S14 has its own approximately 10% threshold, rather than S3's fixed floor.
  return params.map((p) => Object.assign(p, { s14Min: String(threshold.rows[0]?.revenue) }));
}

export function paramsForScenario(input: ListParams, scenario: SlotScenario): ListParams {
  return scenario === "S14"
    ? {
        ...input,
        revenueMin: (input as ListParams & { s14Min?: string }).s14Min ?? input.revenueMin,
      }
    : input;
}
