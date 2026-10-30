import pg from "pg";

/** Cluster provisioning only. Never call with a browser-serving connection. */
export async function provisionRuntimeRoles(adminUrl: string): Promise<void> {
  const client = new pg.Client({ connectionString: adminUrl });
  await client.connect();
  try {
    // Serialize provisioners sharing a cluster; never repair an existing unsafe role silently.
    await client.query("begin");
    await client.query("select pg_advisory_xact_lock(7302911002)");
    for (const role of ["crm_owner", "crm_app", "crm_auth"]) {
      const existing = await client.query("select 1 from pg_roles where rolname = $1", [role]);
      if (!existing.rowCount) {
        await client.query(
          `create role ${client.escapeIdentifier(role)} login nosuperuser nocreatedb nocreaterole noinherit nobypassrls`,
        );
      }
    }
    await client.query("commit");
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    await client.end();
  }
}
