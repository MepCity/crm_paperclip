import { describe, expect, it } from "vitest";
import { parseEnv } from "./env";

describe("parseEnv", () => {
  it("accepts a postgres URL", () => {
    const env = parseEnv({ DATABASE_URL: "postgres://u:p@127.0.0.1:5432/crm" });
    expect(env.DATABASE_URL).toBe("postgres://u:p@127.0.0.1:5432/crm");
  });

  it("accepts the postgresql scheme", () => {
    expect(() => parseEnv({ DATABASE_URL: "postgresql://localhost/crm" })).not.toThrow();
  });

  it("rejects a missing DATABASE_URL", () => {
    expect(() => parseEnv({})).toThrow(/DATABASE_URL/);
  });

  it("rejects a URL for another database engine", () => {
    expect(() => parseEnv({ DATABASE_URL: "mysql://localhost/crm" })).toThrow(/postgres/);
  });
});
