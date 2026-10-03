import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema/index";

export type Database = NodePgDatabase<typeof schema> & { $client: pg.Pool };

export function createDb(url: string): Database {
  const pool = new pg.Pool({ connectionString: url });
  pool.on("error", () => {
    // Idle clients can fail when the server stops; the next query reports the error.
  });
  return drizzle(pool, { schema });
}

export async function closeDb(db: Database): Promise<void> {
  await db.$client.end();
}
