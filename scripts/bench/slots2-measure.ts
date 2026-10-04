import type pg from "pg";
import type { Query } from "./queries";
import { type PlanNode, percentile, summarizePlan } from "./report";
import { MODEL_SCHEMA, type Model } from "./slots2-storage";

export type Plan = PlanNode & {
  "Index Cond"?: string;
  Filter?: string;
  "Sort Key"?: string[];
  "Scan Direction"?: string;
  "Subplan Name"?: string;
  Plans?: Plan[];
};
export type Access = {
  plan: string;
  buffers: number;
  indexCond: boolean;
  ordered: boolean;
  fullSort: boolean;
  conditions: string[];
  arms: string[];
  estimated: number | null;
  actual: number | null;
};
export type ReadRow = Access & {
  section: number;
  model: string;
  scenario: string;
  round: number;
  rls: "off" | "on";
  median: number;
  p95: number;
};
export type ReadSpec = {
  section: number;
  model: string;
  scenario: string;
  queries: Query[];
  org: string;
  pureSort?: boolean;
  count?: Query;
  filtered?: boolean;
};
export type Write = {
  model: string;
  scenario: string;
  median: number;
  p95: number;
  wal: number;
  operations: number;
  locked: boolean;
};
export type Check = { name: string; pass: boolean; detail: string };
export type Size = { model: string; tables: number; indexes: number; sideRows?: number };
export type Evidence = {
  protocol: { rows: number; writes: number; warmup: number; measure: number; seed: number };
  environment: Record<string, string | number>;
  loadStart: number[];
  loadEnd: number[];
  reads: ReadRow[];
  writes: Write[];
  checks: Check[];
  sizes: Size[];
  sql: Record<string, string>;
  notes: string[];
  paired: { scenario: string; ratio: number; planSame: boolean }[];
  backfill: Record<string, number>;
  outcomes: { rule: number; pass: boolean; detail: string }[];
  complete: boolean;
};
export const transaction = async (client: pg.Client, org: string, q: Query, explain = false) => {
  await client.query("begin");
  try {
    await client.query("select set_config('app.org_id',$1,true)", [org]);
    const result = await client.query(
      `${explain ? "explain(analyze,buffers,format json) " : ""}${q.text}`,
      q.values,
    );
    await client.query("commit");
    return result;
  } catch (error) {
    await client.query("rollback");
    throw error;
  }
};
export function inspect(
  plan: Plan,
  cardinality?: number | null,
): Omit<Access, "estimated" | "actual"> {
  const nodes: Plan[] = [];
  const walk = (n: Plan) => {
    if (n["Subplan Name"]?.startsWith("InitPlan")) return;
    nodes.push(n);
    for (const c of n.Plans ?? []) walk(c);
  };
  walk(plan);
  const scans = nodes.filter((n) => /Index (Only )?Scan/.test(n["Node Type"]));
  const conditions = nodes
    .filter((n) =>
      /\b(ix_(text|num|time|ref)_\d|v_(text|num|time|ref))\b/.test(n["Index Cond"] ?? ""),
    )
    .map((n) => `${n["Index Name"]}: ${(n["Index Cond"] ?? "").replace(/'[^']*'/g, "'?'")}`);
  // A Sort over rows whose child LIMIT already cut each arm is bounded, not a full-set Sort.
  const bounded = (n: Plan): boolean =>
    n["Node Type"] === "Limit" || ((n.Plans?.length ?? 0) > 0 && (n.Plans ?? []).every(bounded));
  const fullSort = nodes.some(
    (n) =>
      n["Node Type"] === "Sort" &&
      (!(n.Plans ?? []).every(bounded) ||
        (cardinality !== undefined &&
          cardinality !== null &&
          cardinality > 0 &&
          (n.Plans ?? []).some(
            (child) => (child["Actual Rows"] ?? 0) * (child["Actual Loops"] ?? 1) >= cardinality,
          ))),
  );
  const arms = nodes
    .filter((n) => n["Node Type"] === "Append")
    .flatMap((n) =>
      (n.Plans ?? []).map((arm, i) => {
        const cost = arm as Plan & { "Actual Total Time"?: number };
        return `arm ${i + 1}: ${summarizePlan(arm).summary}; ${cost["Actual Total Time"]?.toFixed(3) ?? "?"} ms; ${summarizePlan(arm).buffers} buffers`;
      }),
    );
  const summary = summarizePlan(plan);
  return {
    plan: summary.summary,
    buffers: summary.buffers,
    indexCond: conditions.length > 0,
    ordered:
      scans.some((n) => /slot_ix_text_1|value_text/.test(n["Index Name"] ?? "")) && !fullSort,
    fullSort,
    conditions,
    arms,
  };
}
export function unbounded(q: Query): Query {
  const text = q.text
    .replace(/^select count\(\*\)::int as n/i, "select 1")
    .replace(/\blimit\s+(?:\d+|\(\$\d+::int\+51\))/gi, "")
    .replace(/\boffset\s+\$\d+::int/gi, "");
  // Bind offset-only parameters which disappear when pagination is removed.
  const referenced = new Set([...text.matchAll(/\$(\d+)/g)].map((m) => Number(m[1])));
  const unused = q.values.map((_, i) => i + 1).filter((i) => !referenced.has(i));
  return {
    text: unused.length
      ? `select * from (${text}) unpaged where ${unused.map((i) => `($${i}::text is null or $${i}::text is not null)`).join(" and ")}`
      : text,
    values: q.values,
  };
}
export async function rls(db: pg.Client, model: string, on: boolean): Promise<void> {
  const schema = MODEL_SCHEMA[model as Model];
  const tables = schema
    ? ["records", "events", "modules", ...(model.startsWith("A5") ? ["record_index"] : [])]
    : model === "B1"
      ? ["leads", "events"]
      : ["records", "events"];
  const target = schema ?? (model === "B1" ? "bench_b" : "bench_a");
  for (const t of tables)
    await db.query(`alter table ${target}.${t} ${on ? "enable" : "disable"} row level security`);
}
export async function measureRead(
  db: pg.Client,
  app: pg.Client,
  e: Evidence,
  spec: ReadSpec,
  progress: (s: string) => void,
): Promise<void> {
  const first = spec.queries[0];
  if (!first) throw new Error("empty query set");
  const whole = spec.count ?? unbounded(first);
  let actual: number | null = null,
    estimated: number | null = null;
  if (spec.filtered) {
    actual = Number(
      (await db.query(`select count(*)::int as n from (${whole.text}) cardinality`, whole.values))
        .rows[0].n,
    );
    estimated = Number(
      (await db.query(`explain(format json) ${whole.text}`, whole.values)).rows[0]["QUERY PLAN"][0]
        .Plan["Plan Rows"],
    );
  }
  for (let round = 1; round <= 3; round++) {
    progress(`${spec.model} ${spec.scenario} round=${round}`);
    for (const enabled of [false, true]) {
      await rls(db, spec.model, enabled);
      for (let i = 0; i < e.protocol.warmup; i++)
        await transaction(app, spec.org, spec.queries[i % spec.queries.length] ?? first);
      const plan = (await transaction(app, spec.org, first, true)).rows[0]["QUERY PLAN"][0]
        .Plan as Plan;
      const samples: number[] = [];
      for (let i = 0; i < e.protocol.measure; i++) {
        const started = performance.now();
        await transaction(app, spec.org, spec.queries[i % spec.queries.length] ?? first);
        samples.push(performance.now() - started);
      }
      e.reads.push({
        ...inspect(plan, actual),
        estimated,
        actual,
        section: spec.section,
        model: spec.model,
        scenario: spec.scenario,
        round,
        rls: enabled ? "on" : "off",
        median: percentile(samples, 0.5),
        p95: percentile(samples, 0.95),
      });
    }
  }
  await rls(db, spec.model, true);
}
export function bestPairs(
  reads: ReadRow[],
): { on: ReadRow; off: ReadRow; range: string; same: boolean }[] {
  const groups = new Map<string, ReadRow[]>();
  for (const row of reads) {
    const key = `${row.model}:${row.scenario}`;
    const g = groups.get(key) ?? [];
    g.push(row);
    groups.set(key, g);
  }
  return [...groups.values()].map((rows) => {
    const on = rows.filter((r) => r.rls === "on").sort((a, b) => a.p95 - b.p95)[0];
    if (!on) throw new Error("missing on round");
    const off = rows.find((r) => r.rls === "off" && r.round === on.round);
    if (!off) throw new Error("missing off round");
    const p95 = rows.filter((r) => r.rls === "on").map((r) => r.p95);
    return {
      on,
      off,
      range: `${Math.min(...p95).toFixed(2)}–${Math.max(...p95).toFixed(2)}`,
      same: on.plan === off.plan && on.buffers === off.buffers,
    };
  });
}
