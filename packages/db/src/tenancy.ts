import type pg from "pg";

export type TableContract = {
  /** Trusted adapter metadata, never a request identifier. All tables are in public. */
  name: string;
  privileges: readonly ("SELECT" | "INSERT" | "UPDATE" | "DELETE")[];
};

/** Installed CRM families are always checked, including when another adapter starts. */
export const definitionTableContracts: readonly TableContract[] = [
  { name: "report_definitions", privileges: ["SELECT", "INSERT", "UPDATE"] },
  { name: "assignment_shells", privileges: ["SELECT", "INSERT"] },
  { name: "organization_email_addresses", privileges: ["SELECT", "INSERT"] },
];

export const chatTableContracts: readonly TableContract[] = [
  { name: "chat_conversations", privileges: ["SELECT", "INSERT", "UPDATE"] },
  { name: "chat_members", privileges: ["SELECT", "INSERT", "UPDATE", "DELETE"] },
  { name: "chat_messages", privileges: ["SELECT", "INSERT", "UPDATE"] },
  { name: "chat_thread_reads", privileges: ["SELECT", "INSERT", "UPDATE"] },
  { name: "chat_stars", privileges: ["SELECT", "INSERT", "DELETE"] },
  { name: "chat_presence", privileges: ["SELECT", "INSERT", "UPDATE"] },
];

const identityTables = new Set([
  "users",
  "accounts",
  "sessions",
  "verifications",
  "organizations",
  "memberships",
  "invitations",
]);

function unsafe(): never {
  // Do not expose catalog details, database messages or key values to callers.
  throw new Error("Unsafe CRM persistence configuration");
}

/** Validate on startup/first use, as the actual runtime connection. No owner connection. */
export async function assertRuntimeCatalog(
  client: pg.PoolClient,
  tables: readonly TableContract[],
): Promise<void> {
  const role = (
    await client.query(`select current_user = 'crm_app' as app,
    rolsuper or rolbypassrls or rolcreatedb or rolcreaterole as elevated,
    exists(select 1 from pg_roles other where other.rolname <> current_user
      and pg_has_role(current_user, other.oid, 'MEMBER')) as owner_member
    from pg_roles where rolname = current_user`)
  ).rows[0];
  if (!role?.app || role.elevated || role.owner_member) unsafe();
  if (
    (
      await client.query(`select exists(select 1 from pg_namespace where nspname !~ '^pg_'
      and nspname <> 'information_schema' and has_schema_privilege(current_user,oid,'CREATE')) as ddl,
    has_database_privilege(current_user, current_database(), 'CREATE,TEMPORARY') as db_ddl`)
    ).rows.some((row) => row.ddl || row.db_ddl)
  )
    unsafe();

  const helper =
    await client.query(`select p.prosecdef, p.provolatile, p.prosrc, p.prorettype = 'uuid'::regtype as uuid,
    pg_get_userbyid(p.proowner) as owner,
    has_function_privilege(current_user, p.oid, 'EXECUTE') as executable
    from pg_proc p join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public' and p.proname='current_org_id' and p.pronargs=0`);
  if (
    helper.rows.length !== 1 ||
    helper.rows.some(
      (fn) =>
        fn.prosecdef ||
        fn.provolatile !== "s" ||
        !fn.uuid ||
        fn.prosrc.replace(/\s/g, "").toLowerCase() !==
          "selectnullif(current_setting('app.org_id',true),'')::uuid" ||
        fn.owner !== "crm_owner" ||
        !fn.executable,
    )
  )
    unsafe();

  const installed = [...definitionTableContracts, ...chatTableContracts];
  tables = [...installed.filter((base) => !tables.some((t) => t.name === base.name)), ...tables];
  const contracts = new Map(tables.map((table) => [table.name, table]));
  if (contracts.size !== tables.length || tables.some((table) => identityTables.has(table.name)))
    unsafe();
  const catalog = await client.query(`select c.oid, c.relname, c.relkind,
    pg_get_userbyid(c.relowner) as owner, c.relrowsecurity, c.relforcerowsecurity,
    a.attnum as tenant_column, a.attnotnull, a.atttypid = 'uuid'::regtype as uuid,
    exists(select 1 from pg_attribute i where i.attrelid=c.oid and i.attname='id' and not i.attisdropped) as has_id
    from pg_class c join pg_namespace n on n.oid=c.relnamespace
    left join pg_attribute a on a.attrelid=c.oid and a.attname='organization_id' and not a.attisdropped
    where n.nspname='public' and c.relkind in ('r','p','v','m','f')`);
  for (const table of catalog.rows) {
    const name = `public.${pgIdentifier(table.relname)}`;
    const contract = contracts.get(table.relname);
    if (!contract) {
      // Identity roots are explicitly classified; every new tenant table must be registered.
      if (table.tenant_column && !identityTables.has(table.relname)) unsafe();
      const access = await client.query(
        `select has_any_column_privilege(current_user,$1,'SELECT,INSERT,UPDATE,REFERENCES')
        or has_table_privilege(current_user,$1,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER') as allowed`,
        [name],
      );
      if (access.rows[0]?.allowed) unsafe();
      continue;
    }
    contracts.delete(table.relname);
    if (
      table.relkind !== "r" ||
      table.owner !== "crm_owner" ||
      !table.relrowsecurity ||
      table.relforcerowsecurity ||
      !table.tenant_column ||
      !table.attnotnull ||
      !table.uuid
    )
      unsafe();
    const keys = await client.query(
      `select i.indisprimary, i.indisunique,
      i.indkey[0] = $2::smallint as tenant_first,
      (select array_agg(a.attname::text order by k.ord) from unnest(i.indkey::smallint[]) with ordinality k(num,ord)
       join pg_attribute a on a.attrelid=i.indrelid and a.attnum=k.num where k.ord <= i.indnkeyatts) as columns
      from pg_index i where i.indrelid=$1 and (i.indisunique or i.indisprimary)`,
      [table.oid, table.tenant_column],
    );
    if (
      !keys.rows.some((key) => key.indisprimary) ||
      keys.rows.some(
        (key) =>
          !key.tenant_first ||
          (key.indisprimary && table.has_id && key.columns.join(",") !== "organization_id,id"),
      )
    )
      unsafe();
    const foreignKeys = await client.query(
      `select con.conkey[1]=$2::smallint as source_first,
      a.attname='organization_id' as target_first
      from pg_constraint con join pg_class target on target.oid=con.confrelid
      join pg_attribute a on a.attrelid=target.oid and a.attnum=con.confkey[1]
      where con.conrelid=$1 and con.contype='f'
      and exists(select 1 from pg_attribute ta where ta.attrelid=target.oid and ta.attname='organization_id' and not ta.attisdropped)`,
      [table.oid, table.tenant_column],
    );
    if (foreignKeys.rows.some((key) => !key.source_first || !key.target_first)) unsafe();
    const policies = await client.query(
      `select polcmd, polpermissive,
      polroles = array[(select oid from pg_roles where rolname='crm_app')] as app_only,
      pg_get_expr(polqual, polrelid) as using_expression,
      pg_get_expr(polwithcheck, polrelid) as check_expression
      from pg_policy where polrelid=$1`,
      [table.oid],
    );
    // Accept the canonical ADR policy only. Queue claim exceptions need their own reviewed guard.
    const canonical = (value: string | null) =>
      value?.replace(/\s|public\.|\(|\)/g, "") ===
      "organization_id=SELECTcurrent_org_idAScurrent_org_id";
    if (
      policies.rows.length !== 1 ||
      policies.rows.some(
        (policy) =>
          policy.polcmd !== "*" ||
          !policy.polpermissive ||
          !policy.app_only ||
          !canonical(policy.using_expression) ||
          !canonical(policy.check_expression),
      )
    )
      unsafe();
    for (const privilege of [
      "SELECT",
      "INSERT",
      "UPDATE",
      "DELETE",
      "TRUNCATE",
      "REFERENCES",
      "TRIGGER",
    ]) {
      const grants = await client.query(
        `select has_table_privilege(current_user,$1,$2) as allowed,
        has_table_privilege('crm_auth',$1,$2) as auth_allowed,
        has_table_privilege(current_user,$1,$3) as grantable`,
        [name, privilege, `${privilege} WITH GRANT OPTION`],
      );
      const expected = contract.privileges.some((value) => value === privilege);
      if (
        grants.rows[0]?.allowed !== expected ||
        grants.rows[0]?.auth_allowed ||
        grants.rows[0]?.grantable
      )
        unsafe();
    }
    const columnGrants = await client.query(
      `select attname,
      has_column_privilege('crm_auth',attrelid,attnum,'SELECT,INSERT,UPDATE,REFERENCES') as auth_allowed,
      has_column_privilege(current_user,attrelid,attnum,'REFERENCES') as references_allowed,
      has_column_privilege(current_user,attrelid,attnum,'SELECT') as select_allowed,
      has_column_privilege(current_user,attrelid,attnum,'INSERT') as insert_allowed,
      has_column_privilege(current_user,attrelid,attnum,'UPDATE') as update_allowed
      from pg_attribute where attrelid=$1 and attnum>0 and not attisdropped`,
      [table.oid],
    );
    if (
      columnGrants.rows.some(
        (grant) =>
          grant.auth_allowed ||
          grant.references_allowed ||
          (grant.select_allowed && !contract.privileges.includes("SELECT")) ||
          (grant.insert_allowed && !contract.privileges.includes("INSERT")) ||
          (grant.update_allowed && !contract.privileges.includes("UPDATE")),
      )
    )
      unsafe();
  }
  if (contracts.size) unsafe();
}

/** One identifier quoting path; input must come from trusted adapter metadata. */
function pgIdentifier(value: string): string {
  return `"${value.replaceAll('"', '""')}"`;
}

const transactionBrand: unique symbol = Symbol("OrgTransaction");
export type OrgTransaction = {
  readonly [transactionBrand]: true;
  query<Row extends pg.QueryResultRow = pg.QueryResultRow>(
    text: string,
    values?: unknown[],
  ): Promise<pg.QueryResult<Row>>;
};

/** The pool stays private to the composition root. Repositories receive only OrgTransaction. */
export async function createTenantDatabase(pool: pg.Pool, tables: readonly TableContract[]) {
  const startup = await pool.connect();
  try {
    await assertRuntimeCatalog(startup, tables);
  } finally {
    startup.release();
  }
  return {
    async withOrg<T>(ctx: { orgId: string }, work: (tx: OrgTransaction) => Promise<T>): Promise<T> {
      if (!ctx?.orgId || !/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(ctx.orgId)) {
        throw new Error("Authorized organization context required");
      }
      const client = await pool.connect();
      let active = false;
      let broken = false;
      try {
        await client.query("begin");
        await client.query("select set_config('app.org_id', $1, true)", [ctx.orgId]);
        active = true;
        const tx: OrgTransaction = {
          [transactionBrand]: true,
          async query<Row extends pg.QueryResultRow>(text: string, values?: unknown[]) {
            if (!active) throw new Error("Organization transaction is no longer active");
            return client.query<Row>(text, values);
          },
        };
        const result = await work(tx);
        active = false;
        const committed = await client.query("commit");
        if (committed.command !== "COMMIT") throw new Error("Organization transaction failed");
        return result;
      } catch (error) {
        active = false;
        try {
          await client.query("rollback");
        } catch {
          broken = true;
        }
        throw error;
      } finally {
        client.release(broken);
      }
    },
  };
}
