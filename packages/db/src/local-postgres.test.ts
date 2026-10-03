import { describe, expect, it } from "vitest";
import { connectionUrl, parsePostmasterPid } from "./local-postgres";

describe("parsePostmasterPid", () => {
  it("reads pid and port from a postmaster.pid file", () => {
    const file = "4242\n/data/dir\n1700000000\n54555\n127.0.0.1\n  /tmp\n";
    expect(parsePostmasterPid(file)).toEqual({ pid: 4242, port: 54555 });
  });

  it("returns null for empty or malformed content", () => {
    expect(parsePostmasterPid("")).toBeNull();
    expect(parsePostmasterPid("abc\n\n\nxyz")).toBeNull();
  });
});

describe("connectionUrl", () => {
  it("builds a loopback URL for the given database", () => {
    expect(connectionUrl(5432, "crm")).toBe("postgres://postgres:postgres@127.0.0.1:5432/crm");
  });
});
