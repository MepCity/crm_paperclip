import { type Database, sql } from "@crm/db";
import { getDb } from "./database";

export type HealthReport = {
  status: "ok";
  postgresVersion: string;
  postgresMajor: number;
};

/** Queries the database and reports its version. Rejects when the database is unreachable. */
export async function checkHealth(db: Database = getDb()): Promise<HealthReport> {
  const result = await db.execute<{ version: string }>(
    sql`select current_setting('server_version') as version`,
  );
  const version = result.rows[0]?.version;
  if (!version) throw new Error("database returned no version");
  return { status: "ok", postgresVersion: version, postgresMajor: Number.parseInt(version, 10) };
}
