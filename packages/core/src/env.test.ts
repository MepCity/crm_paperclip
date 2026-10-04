import { describe, expect, it } from "vitest";
import { parseEnv } from "./env";

const valid = {
  DATABASE_URL: "postgres://u:p@127.0.0.1:5432/crm",
  APP_URL: "http://127.0.0.1:3000",
  APP_SECRET: "a".repeat(32),
};

describe("parseEnv", () => {
  it("accepts a postgres URL", () => {
    const env = parseEnv(valid);
    expect(env.DATABASE_URL).toBe("postgres://u:p@127.0.0.1:5432/crm");
  });

  it("accepts the postgresql scheme", () => {
    expect(() => parseEnv({ ...valid, DATABASE_URL: "postgresql://localhost/crm" })).not.toThrow();
  });

  it("rejects a missing DATABASE_URL", () => {
    expect(() => parseEnv({})).toThrow(/DATABASE_URL/);
  });

  it("rejects a URL for another database engine", () => {
    expect(() => parseEnv({ ...valid, DATABASE_URL: "mysql://localhost/crm" })).toThrow(/postgres/);
  });

  it("reports missing auth settings in one readable error", () => {
    expect(() => parseEnv({ DATABASE_URL: valid.DATABASE_URL })).toThrow(/APP_URL.*APP_SECRET/);
  });

  it("rejects invalid app URLs and short secrets", () => {
    expect(() => parseEnv({ ...valid, APP_URL: "file:///tmp/app" })).toThrow(/APP_URL/);
    expect(() => parseEnv({ ...valid, APP_SECRET: "short" })).toThrow(/APP_SECRET/);
  });
});
