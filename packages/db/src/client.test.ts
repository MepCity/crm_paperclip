import { describe, expect, it } from "vitest";
import { closeDb, createDb, defaultPoolSettings, poolSettingsFromEnv } from "./client";

describe("database pool settings", () => {
  it("bounds every limit by default", () => {
    expect(poolSettingsFromEnv({})).toEqual({
      max: 10,
      connectionTimeoutMillis: 5_000,
      statementTimeoutMillis: 30_000,
      idleInTransactionTimeoutMillis: 60_000,
    });
  });

  it("reads overrides from the environment", () => {
    expect(
      poolSettingsFromEnv({
        DB_POOL_MAX: "4",
        DB_POOL_CONNECTION_TIMEOUT_MS: " 2500 ",
        DB_STATEMENT_TIMEOUT_MS: "0",
        DB_IDLE_IN_TRANSACTION_TIMEOUT_MS: "15000",
      }),
    ).toEqual({
      max: 4,
      connectionTimeoutMillis: 2_500,
      statementTimeoutMillis: 0,
      idleInTransactionTimeoutMillis: 15_000,
    });
  });

  it.each([
    ["DB_POOL_MAX", "0"],
    ["DB_POOL_MAX", "ten"],
    ["DB_POOL_CONNECTION_TIMEOUT_MS", "0"],
    ["DB_STATEMENT_TIMEOUT_MS", "-1"],
    ["DB_IDLE_IN_TRANSACTION_TIMEOUT_MS", "1.5"],
  ])("rejects %s=%s", (name, value) => {
    expect(() => poolSettingsFromEnv({ [name]: value })).toThrow(name);
  });

  it("hands the bounds to the pool and its connections", async () => {
    const db = createDb("postgres://user:pass@127.0.0.1:1/none", {
      ...defaultPoolSettings,
      max: 3,
    });
    const options = db.$client.options as Record<string, unknown>;
    expect(options).toMatchObject({
      max: 3,
      connectionTimeoutMillis: 5_000,
      statement_timeout: 30_000,
      idle_in_transaction_session_timeout: 60_000,
    });
    await closeDb(db);
  });
});
