import type pg from "pg";
import type { GeneratedRecord, Universe } from "./dataset";
import { assertSame } from "./exec";
import type { Query } from "./queries";
import type { Evidence } from "./slots2-measure";
import { transaction } from "./slots2-measure";
import { compiledThreshold, OPERATORS, scaledWrite } from "./slots2-numeric";
import { MODEL_SCHEMA, type Model, SYSTEM } from "./slots2-storage";

export async function equivalent(
  db: pg.Client,
  e: Evidence,
  label: string,
  a: Query,
  b: Query,
  full = false,
): Promise<void> {
  const left = (await db.query(a.text, a.values)).rows,
    right = (await db.query(b.text, b.values)).rows;
  let pass = true;
  try {
    assertSame(
      label,
      full ? left : left.map((r) => r.id ?? r.n),
      full ? right : right.map((r) => r.id ?? r.n),
    );
  } catch {
    pass = false;
  }
  e.checks.push({
    name: label,
    pass,
    detail: `left=${left.length}; right=${right.length}; ${full ? "projected rows" : "identity/order or count"}`,
  });
}
export async function exactness(db: pg.Client, e: Evidence, world: Universe): Promise<void> {
  const thresholds = [
    "1234567890123456.005",
    "1234567890123456.01",
    "0",
    "-1234567890123456.005",
    "-0.001",
    "1.001",
    "92233720368547758.08",
    "-92233720368547758.09",
  ];
  const base = "organization_id=$1::uuid and module_id=$2::uuid and deleted_at is null";
  const fingerprint = (predicate: string, order: string) => `select count(*)::int as n,
    md5(coalesce(string_agg(id::text,',' order by ${order} desc,id desc),'')) as digest
    from bench_slot.records where ${base} and ${predicate}`;
  let doubleDifferences = 0;
  for (const threshold of thresholds)
    for (const operator of OPERATORS) {
      const compiled = compiledThreshold(operator, threshold, "ix_num_1", "$3");
      const exact = await db.query(
        fingerprint(
          `(data->>'annual_revenue')::numeric ${operator} $3::numeric`,
          "(data->>'annual_revenue')::numeric",
        ),
        [world.orgA, world.moduleLeads, threshold],
      );
      const slot = await db.query(
        fingerprint(compiled.sql, "ix_num_1"),
        compiled.value === null
          ? [world.orgA, world.moduleLeads]
          : [world.orgA, world.moduleLeads, compiled.value],
      );
      let pass = true;
      try {
        assertSame("numeric", exact.rows, slot.rows);
      } catch {
        pass = false;
      }
      e.checks.push({
        name: `exact ${operator} ${threshold}`,
        pass,
        detail: `count=${exact.rows[0].n}; ordered identity digest compared`,
      });
      const floating = await db.query(
        fingerprint(
          `(data->>'annual_revenue')::double precision ${operator} $3::double precision`,
          "(data->>'annual_revenue')::double precision",
        ),
        [world.orgA, world.moduleLeads, threshold],
      );
      if (JSON.stringify(floating.rows) !== JSON.stringify(exact.rows)) doubleDifferences++;
    }
  e.notes.push(
    `Double precision differs from exact numeric in ${doubleDifferences}/${thresholds.length * OPERATORS.length} ordered comparisons. The paired 16-digit amounts collapse at binary floating point precision.`,
  );
  let rejected = false;
  try {
    scaledWrite("1.001");
  } catch {
    rejected = true;
  }
  e.checks.push({
    name: "write rejects third decimal place",
    pass: rejected,
    detail: "1.001 is rejected before executing a write; no rounding",
  });
  e.checks.push({
    name: "negative zero write",
    pass: scaledWrite("-0") === "0",
    detail: "scaledWrite(-0)=0",
  });
}
export async function isolation(
  db: pg.Client,
  app: pg.Client,
  e: Evidence,
  world: Universe,
  model: Model,
  id: string,
  record: GeneratedRecord,
): Promise<void> {
  const schema = MODEL_SCHEMA[model];
  for (const table of [
    "records",
    "events",
    "modules",
    ...(model.startsWith("A5") ? ["record_index"] : []),
  ]) {
    const unset = await transaction(app, "", {
      text: `select count(*)::int as n from ${schema}.${table}`,
      values: [],
    });
    e.checks.push({
      name: `${model}.${table} unset tenant`,
      pass: unset.rows[0].n === 0,
      detail: `visible=${unset.rows[0].n}`,
    });
  }
  const read = await transaction(app, world.orgB, {
    text: `select id from ${schema}.records where organization_id=$1 and id=$2`,
    values: [world.orgA, id],
  });
  e.checks.push({
    name: `${model} foreign read`,
    pass: read.rows.length === 0,
    detail: `visible=${read.rows.length}`,
  });
  await app.query("begin");
  await app.query("select set_config('app.org_id',$1,true)", [world.orgB]);
  const update = await app.query(
    `update ${schema}.records set name='forbidden' where organization_id=$1 and id=$2`,
    [world.orgA, id],
  );
  await app.query("rollback");
  e.checks.push({
    name: `${model} foreign update`,
    pass: update.rowCount === 0,
    detail: `affected=${update.rowCount}`,
  });
  const row = (
    await db.query(
      `select ${SYSTEM.join(",")} from ${schema}.records where organization_id=$1 and id=$2`,
      [world.orgA, id],
    )
  ).rows[0];
  let code = "";
  await app.query("begin");
  await app.query("select set_config('app.org_id',$1,true)", [world.orgB]);
  try {
    await app.query(
      `insert into ${schema}.records (${SYSTEM.join(",")}) values(${SYSTEM.map((_, i) => `$${i + 1}`).join(",")})`,
      SYSTEM.map((k) =>
        k === "id" ? record.id : k === "data" ? JSON.stringify(row.data) : row[k],
      ),
    );
  } catch (error) {
    code = (error as { code: string }).code;
  }
  await app.query("rollback");
  e.checks.push({
    name: `${model} foreign insert`,
    pass: code === "42501",
    detail: `SQLSTATE=${code}`,
  });
  if (model.startsWith("A5")) {
    const foreign = await transaction(app, world.orgB, {
      text: `select record_id from ${schema}.record_index where organization_id=$1 and record_id=$2`,
      values: [world.orgA, id],
    });
    e.checks.push({
      name: `${model} foreign indexed values`,
      pass: foreign.rows.length === 0,
      detail: `visible=${foreign.rows.length}`,
    });
    await app.query("begin");
    await app.query("select set_config('app.org_id',$1,true)", [world.orgB]);
    code = "";
    try {
      await app.query(
        `insert into ${schema}.record_index values($1,$2,$3,$4,'forbidden',null,null,null)`,
        [world.orgA, world.moduleLeads, record.id, record.id],
      );
    } catch (error) {
      code = (error as { code: string }).code;
    }
    await app.query("rollback");
    e.checks.push({
      name: `${model} foreign indexed insert`,
      pass: code === "42501",
      detail: `SQLSTATE=${code}`,
    });
  }
}
