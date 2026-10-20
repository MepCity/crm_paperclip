import { describe, expect, it } from "vitest";
import { isDevLoginEnabled } from "./dev-login";

describe("local development login gate", () => {
  it.each(["localhost", "127.0.0.1", "[::1]"])("permits development on %s", (host) => {
    expect(isDevLoginEnabled({ NODE_ENV: "development", APP_URL: `http://${host}:3000` })).toBe(
      true,
    );
    expect(isDevLoginEnabled({ NODE_ENV: "production", APP_URL: `http://${host}:3000` })).toBe(
      false,
    );
  });
  it.each([
    undefined,
    "invalid",
    "https://crm.example.test",
    "http://localhost.example.test",
    "file://localhost",
  ])("rejects missing, malformed or remote URLs: %s", (APP_URL) => {
    expect(isDevLoginEnabled({ NODE_ENV: "development", APP_URL })).toBe(false);
  });
});
