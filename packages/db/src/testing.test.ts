import { describe, expect, it } from "vitest";
import { testDatabaseName, withDatabase } from "./testing";

describe("testDatabaseName", () => {
  it("builds a lower-case identifier from worker id and suffix", () => {
    expect(testDatabaseName(3, "AB12")).toBe("crm_test_3_ab12");
  });

  it("replaces characters that are not valid in an unquoted identifier", () => {
    expect(testDatabaseName("pool-1/x", "a b")).toBe("crm_test_pool_1_x_a_b");
  });

  it("stays within the 63 character identifier limit", () => {
    expect(testDatabaseName("w".repeat(100), "abcd").length).toBeLessThanOrEqual(63);
  });

  it("gives different workers different names", () => {
    expect(testDatabaseName(1, "same")).not.toBe(testDatabaseName(2, "same"));
  });
});

describe("withDatabase", () => {
  it("swaps the database and keeps credentials, host and port", () => {
    expect(withDatabase("postgres://u:p@127.0.0.1:5555/postgres", "crm_x")).toBe(
      "postgres://u:p@127.0.0.1:5555/crm_x",
    );
  });
});
