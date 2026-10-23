import pg from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  assertRuntimeCatalog,
  createTenantDatabase,
  type OrgTransaction,
  type TableContract,
} from "./tenancy";

const A = "00000000-0000-7000-8000-000000000001";
const B = "00000000-0000-7000-8000-000000000002";
const contracts: TableContract[] = [
  { name: "tenant_probe", privileges: ["SELECT", "INSERT", "UPDATE", "DELETE"] },
];
let admin: pg.Client;
let pool: pg.Pool;
let db: Awaited<ReturnType<typeof createTenantDatabase>>;

beforeAll(async () => {
  admin = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await admin.connect();
  await admin.query("alter role crm_app password 'test-runtime'");
  await admin.query(`grant usage, create on schema public to crm_owner;
    set role crm_owner;
    create table tenant_probe (organization_id uuid not null, id uuid not null, value text,
      primary key (organization_id,id));
    alter table tenant_probe enable row level security;
    create policy tenant_isolation on tenant_probe to crm_app
      using (organization_id = (select public.current_org_id()))
      with check (organization_id = (select public.current_org_id()));
    grant select,insert,update,delete on tenant_probe to crm_app;
    reset role;`);
  const url = new URL(process.env.DATABASE_URL ?? "");
  url.username = "crm_app";
  url.password = "test-runtime";
  pool = new pg.Pool({ connectionString: url.toString(), max: 1 });
  db = await createTenantDatabase(pool, contracts);
});
afterAll(async () => {
  await pool?.end();
  await admin?.end();
});

async function guard() {
  const client = await pool.connect();
  try {
    await assertRuntimeCatalog(client, contracts);
  } finally {
    client.release();
  }
}

it("uses real non-owner roles and keeps all credential/identity tables inaccessible", async () => {
  const result = await pool.query("select current_user");
  expect(result.rows[0].current_user).toBe("crm_app");
  for (const name of [
    "sessions",
    "accounts",
    "verifications",
    "users",
    "memberships",
    "invitations",
    "organizations",
  ]) {
    await expect(pool.query(`select * from ${name}`)).rejects.toMatchObject({ code: "42501" });
  }
  await expect(
    pool.query("create temporary table forbidden_temp_ddl(id int)"),
  ).rejects.toMatchObject({ code: "42501" });
  await expect(pool.query("create table forbidden_ddl(id int)")).rejects.toMatchObject({
    code: "42501",
  });
});

it("isolates reads, inserts, updates and deletes without relying on repository predicates", async () => {
  for (const orgId of [A, B])
    await db.withOrg({ orgId }, (tx) =>
      tx.query("insert into tenant_probe values ($1,$1,$2)", [
        orgId,
        orgId === A ? "alpha" : "beta",
      ]),
    );
  await db.withOrg({ orgId: A }, async (tx) => {
    expect((await tx.query("select value from tenant_probe")).rows).toEqual([{ value: "alpha" }]);
    expect(
      (await tx.query("update tenant_probe set value=$1 where organization_id=$2", ["bad", B]))
        .rowCount,
    ).toBe(0);
    expect(
      (await tx.query("delete from tenant_probe where organization_id=$1", [B])).rowCount,
    ).toBe(0);
  });
  await expect(
    db.withOrg({ orgId: A }, (tx) =>
      tx.query("insert into tenant_probe values ($1,uuidv7(),$2)", [B, "bad"]),
    ),
  ).rejects.toMatchObject({ code: "42501" });
  await expect(
    db.withOrg({ orgId: A }, (tx) => tx.query("update tenant_probe set organization_id=$1", [B])),
  ).rejects.toMatchObject({ code: "42501" });
  expect(
    (await db.withOrg({ orgId: B }, (tx) => tx.query("select value from tenant_probe"))).rows,
  ).toEqual([{ value: "beta" }]);
});

it("refuses absent/invalid context, and RLS independently fails closed", async () => {
  let called = false;
  for (const orgId of ["", "invalid"])
    await expect(
      db.withOrg({ orgId }, async () => {
        called = true;
      }),
    ).rejects.toThrow("context required");
  expect(called).toBe(false);
  expect((await pool.query("select * from tenant_probe")).rows).toEqual([]);
  await expect(
    pool.query("insert into tenant_probe values ($1,uuidv7(),null)", [A]),
  ).rejects.toMatchObject({ code: "42501" });
});

it("overrides poisoned sessions, restores them after commit/rollback and expires handles", async () => {
  await pool.query("select set_config('app.org_id',$1,false)", [B]);
  let escaped: OrgTransaction | undefined;
  await db.withOrg({ orgId: A }, async (tx) => {
    escaped = tx;
    expect((await tx.query("select public.current_org_id() as org")).rows[0]?.org).toBe(A);
  });
  expect((await pool.query("select public.current_org_id() as org")).rows[0]?.org).toBe(B);
  if (!escaped) throw new Error("Missing transaction probe");
  await expect(escaped.query("select 1")).rejects.toThrow("no longer active");
  await expect(
    db.withOrg({ orgId: A }, async (tx) => {
      await tx.query("insert into tenant_probe values ($1,uuidv7(),'rollback')", [A]);
      throw new Error("rollback probe");
    }),
  ).rejects.toThrow("rollback probe");
  expect((await pool.query("select public.current_org_id() as org")).rows[0]?.org).toBe(B);
  expect(
    (
      await db.withOrg({ orgId: A }, (tx) =>
        tx.query("select * from tenant_probe where value='rollback'"),
      )
    ).rows,
  ).toEqual([]);
  await pool.query("reset app.org_id");
  for (const fail of [false, true]) {
    try {
      await db.withOrg({ orgId: A }, async () => {
        if (fail) throw new Error("abort");
      });
    } catch {
      /* Expected rollback. */
    }
    expect((await pool.query("select public.current_org_id() as org")).rows[0]?.org).toBeNull();
  }
});

describe("catalog startup rejects drift", () => {
  const cases: [string, string][] = [
    [
      "temporary DDL grant",
      "do $$ begin execute format('grant temporary on database %I to crm_app',current_database()); end $$",
    ],
    ["schema DDL grant", "grant create on schema public to crm_app"],
    ["disabled RLS", "alter table tenant_probe disable row level security"],
    [
      "nullable tenant",
      "alter table tenant_probe drop constraint tenant_probe_pkey; alter table tenant_probe alter column organization_id drop not null",
    ],
    ["helper definer", "alter function current_org_id() security definer"],
    [
      "forged helper",
      "create or replace function current_org_id() returns uuid language sql stable as 'select null::uuid'",
    ],
    ["auth membership", "grant crm_auth to crm_app"],
    ["forced RLS", "alter table tenant_probe force row level security"],
    ["wrong owner", "alter table tenant_probe owner to crm_auth"],
    ["missing key", "alter table tenant_probe drop constraint tenant_probe_pkey"],
    ["global unique key", "create unique index bad_unique on tenant_probe(id)"],
    ["missing grant", "revoke insert on tenant_probe from crm_app"],
    ["extra grant", "grant truncate on tenant_probe to crm_app"],
    ["auth grant", "grant select(value) on tenant_probe to crm_auth"],
    ["unsafe policy", "create policy unsafe on tenant_probe to crm_app using (true)"],
    ["missing policy", "drop policy tenant_isolation on tenant_probe"],
    ["runtime owner membership", "grant crm_owner to crm_app"],
    ["bypass role", "alter role crm_app bypassrls"],
    ["unregistered tenant table", "create table unregistered_probe(organization_id uuid)"],
    ["credential grant", "grant select(password) on accounts to crm_app"],
  ];
  for (const [label, sql] of cases)
    it(`rejects ${label}`, async () => {
      await admin.query("begin");
      // Inspect uncommitted catalog drift as the restricted role, then roll it back.
      try {
        await admin.query(sql);
        await admin.query("set local role crm_app");
        await expect(
          assertRuntimeCatalog(admin as unknown as pg.PoolClient, contracts),
        ).rejects.toThrow("Unsafe CRM");
      } finally {
        await admin.query("rollback");
      }
      await guard();
    });
  it("rejects a superuser connection", async () => {
    await expect(
      assertRuntimeCatalog(admin as unknown as pg.PoolClient, contracts),
    ).rejects.toThrow("Unsafe CRM");
  });
});
