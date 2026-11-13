import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema/index";

export type Database = NodePgDatabase<typeof schema> & { $client: pg.Pool };

/** Bounds of one process-wide pool. Every limit is finite so a stuck path fails instead of hanging. */
export type PoolSettings = {
  /** Most pooled connections at once. */
  max: number;
  /** How long a caller waits for a free connection before the checkout fails. */
  connectionTimeoutMillis: number;
  /** Server-side cap on one statement (0 disables it). */
  statementTimeoutMillis: number;
  /** Server-side cap on a transaction that sits idle (0 disables it). */
  idleInTransactionTimeoutMillis: number;
};

export const defaultPoolSettings: PoolSettings = {
  max: 10,
  connectionTimeoutMillis: 5_000,
  statementTimeoutMillis: 30_000,
  idleInTransactionTimeoutMillis: 60_000,
};

const poolEnv = {
  max: "DB_POOL_MAX",
  connectionTimeoutMillis: "DB_POOL_CONNECTION_TIMEOUT_MS",
  statementTimeoutMillis: "DB_STATEMENT_TIMEOUT_MS",
  idleInTransactionTimeoutMillis: "DB_IDLE_IN_TRANSACTION_TIMEOUT_MS",
} as const satisfies Record<keyof PoolSettings, string>;

/** Reads the pool bounds from the environment; unset values keep the safe defaults. */
export function poolSettingsFromEnv(env: Record<string, string | undefined>): PoolSettings {
  const settings = { ...defaultPoolSettings };
  for (const key of Object.keys(poolEnv) as (keyof PoolSettings)[]) {
    const raw = env[poolEnv[key]]?.trim();
    if (!raw) continue;
    const value = Number(raw);
    const min = key === "max" || key === "connectionTimeoutMillis" ? 1 : 0;
    if (!Number.isInteger(value) || value < min) {
      throw new Error(`Invalid environment: ${poolEnv[key]} must be an integer of at least ${min}`);
    }
    settings[key] = value;
  }
  return settings;
}

export function createDb(
  url: string,
  settings: PoolSettings = poolSettingsFromEnv(process.env),
): Database {
  const pool = new pg.Pool({
    connectionString: url,
    max: settings.max,
    connectionTimeoutMillis: settings.connectionTimeoutMillis,
    statement_timeout: settings.statementTimeoutMillis,
    idle_in_transaction_session_timeout: settings.idleInTransactionTimeoutMillis,
  });
  pool.on("error", () => {
    // Idle clients can fail when the server stops; the next query reports the error.
  });
  return drizzle(pool, { schema });
}

export async function closeDb(db: Database): Promise<void> {
  await db.$client.end();
}
