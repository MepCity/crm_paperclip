import { createDb, type Database } from "@crm/db";
import { parseEnv } from "./env";

let shared: Database | undefined;

/** Process-wide database handle, created from `DATABASE_URL` on first use. */
export function getDb(): Database {
  shared ??= createDb(parseEnv(process.env).DATABASE_URL);
  return shared;
}
