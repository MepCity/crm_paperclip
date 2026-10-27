import pg from "pg";
import { afterAll, beforeAll, expect, it } from "vitest";
import { InMemoryCustomizationAdapter } from "../../core/src/customization/memory";
import {
  context,
  definitionContract,
  otherContext,
  reportInput,
  unwrap,
} from "../../core/src/definitions/contract-suite";
import { createDefinitionPorts } from "../../core/src/definitions/service";
import { fixtureMetadataBaselines } from "../../core/src/records/fixture/metadata-projection";
import { createPostgresDefinitionRepository } from "./definitions";
import { createTenantDatabase, definitionTableContracts } from "./tenancy";

let admin: pg.Client;
let pool: pg.Pool;
let db: Awaited<ReturnType<typeof createTenantDatabase>>;
beforeAll(async () => {
  admin = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await admin.connect();
  await admin.query("alter role crm_app password 'test-runtime'");
  const url = new URL(process.env.DATABASE_URL ?? "");
  url.username = "crm_app";
  url.password = "test-runtime";
  pool = new pg.Pool({ connectionString: url.toString(), max: 2 });
  db = await createTenantDatabase(pool, []);
});
afterAll(async () => {
  await pool?.end();
  await admin?.end();
});
const setup = async () => {
  await admin.query("truncate report_definitions,assignment_shells,organization_email_addresses");
  return {
    repository: createPostgresDefinitionRepository(db),
    customization: new InMemoryCustomizationAdapter(fixtureMetadataBaselines()),
    canManageReports: async () => false,
  };
};
definitionContract("Postgres runtime role", setup);
it("serializes concurrent retries and report CAS without lost updates", async () => {
  const p = createDefinitionPorts(await setup());
  const results = await Promise.all(
    [1, 2].map(() => p.reports.create(context, reportInput, { idempotencyKey: "race" })),
  );
  if (!results[0] || !results[1]) throw new Error("Missing concurrent result");
  const row = unwrap(results[0]);
  expect(unwrap(results[1])).toEqual(row);
  const changed = await Promise.all(
    ["First", "Second"].map((name) =>
      p.reports.update(context, { ...reportInput, id: row.id, name }, { expectedRevision: 1 }),
    ),
  );
  expect(changed.filter((r) => r.ok)).toHaveLength(1);
  expect(changed.filter((r) => !r.ok)).toEqual([{ ok: false, error: { code: "conflict" } }]);
  expect(unwrap(await p.reports.get(context, row.id)).revision).toBe(2);
});
it("persists across adapter reconstruction", async () => {
  const deps = await setup();
  const p = createDefinitionPorts(deps);
  const r = unwrap(await p.reports.create(context, reportInput, { idempotencyKey: "durable" }));
  const reconstructed = createDefinitionPorts({
    ...deps,
    repository: createPostgresDefinitionRepository(await createTenantDatabase(pool, [])),
  });
  expect(unwrap(await reconstructed.reports.get(context, r.id))).toEqual(r);
});
it("RLS independently prevents cross-tenant reads/writes and missing-context access on every table", async () => {
  const p = createDefinitionPorts(await setup());
  unwrap(await p.reports.create(context, reportInput, { idempotencyKey: "rls" }));
  unwrap(
    await p.automation.createAssignmentShell(
      context,
      { module: "Leads", name: "RLS", description: "" },
      { idempotencyKey: "rls" },
    ),
  );
  unwrap(
    await p.organizationAddresses.add(
      context,
      { displayName: "RLS", address: "rls@example.test" },
      { idempotencyKey: "rls" },
    ),
  );
  for (const { name } of definitionTableContracts) {
    expect((await pool.query(`select * from ${name}`)).rows).toEqual([]);
    expect(
      (await db.withOrg(otherContext, (tx) => tx.query(`select * from ${name}`))).rows,
    ).toEqual([]);
    expect((await db.withOrg(context, (tx) => tx.query(`select * from ${name}`))).rowCount).toBe(1);
    await expect(
      db.withOrg(otherContext, (tx) =>
        tx.query(`insert into ${name} select * from ${name} where organization_id=$1`, [
          context.orgId,
        ]),
      ),
    ).resolves.toMatchObject({ rowCount: 0 });
    const insert =
      name === "report_definitions"
        ? "(organization_id,name,description,module,columns,idempotency_key,created_by,updated_by) values ($1,'bad','','Leads','[]','bad','actor','actor')"
        : name === "assignment_shells"
          ? "(organization_id,module,name,description,idempotency_key) values ($1,'Leads','bad','','bad')"
          : "(organization_id,display_name,address_normalized,idempotency_key,created_by) values ($1,'bad','bad@example.test','bad','actor')";
    await expect(
      db.withOrg(otherContext, (tx) => tx.query(`insert into ${name} ${insert}`, [context.orgId])),
    ).rejects.toMatchObject({ code: "42501" });
    await expect(
      pool.query(`insert into ${name} ${insert}`, [context.orgId]),
    ).rejects.toMatchObject({ code: "42501" });
    await admin.query("begin");
    try {
      await admin.query("set local role crm_auth");
      await expect(admin.query(`select * from ${name}`)).rejects.toMatchObject({ code: "42501" });
    } finally {
      await admin.query("rollback");
    }
  }
  expect(
    (await db.withOrg(otherContext, (tx) => tx.query("update report_definitions set name='bad'")))
      .rowCount,
  ).toBe(0);
  await expect(
    db.withOrg(context, (tx) => tx.query("update assignment_shells set enabled=true")),
  ).rejects.toMatchObject({ code: "42501" });
  await expect(
    db.withOrg(context, (tx) =>
      tx.query("update organization_email_addresses set status='verified'"),
    ),
  ).rejects.toMatchObject({ code: "42501" });
});
