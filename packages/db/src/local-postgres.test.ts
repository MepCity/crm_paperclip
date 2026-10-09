import { describe, expect, it } from "vitest";
import {
  buildInitdbFlags,
  buildServerFlags,
  connectionUrl,
  isIpcExhausted,
  parsePostmasterPid,
} from "./local-postgres";

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

describe("buildInitdbFlags", () => {
  it("asks the bootstrap run for mmap shared memory", () => {
    const flags = buildInitdbFlags();
    expect(flags).toEqual([
      "--encoding=UTF8",
      "--locale=C",
      "--locale-provider=icu",
      "--icu-locale=und",
      "-c",
      "shared_memory_type=mmap",
    ]);
  });
});

describe("buildServerFlags", () => {
  it("loopbacks the server and keeps its shared memory out of the SysV table", () => {
    expect(buildServerFlags()).toEqual([
      "-c",
      "listen_addresses=127.0.0.1",
      "-c",
      "shared_memory_type=mmap",
    ]);
  });

  it("adds the caller's settings and lets them override the default", () => {
    expect(buildServerFlags({ fsync: "off", shared_memory_type: "sysv" })).toEqual([
      "-c",
      "listen_addresses=127.0.0.1",
      "-c",
      "shared_memory_type=sysv",
      "-c",
      "fsync=off",
    ]);
  });
});

describe("isIpcExhausted", () => {
  const initdbFailure =
    "Postgres init script failed (code: 1, signal: null). ERROR OUTPUT: FATAL:  could not create shared memory segment: No space left on device\nDETAIL:  Failed system call was shmget(key=89361825, size=56, 03600).";

  it("matches the shared memory and semaphore failures", () => {
    expect(isIpcExhausted(initdbFailure)).toBe(true);
    expect(isIpcExhausted("FATAL:  could not create semaphore set: No space left on device")).toBe(
      true,
    );
  });

  it("does not match other start failures", () => {
    expect(isIpcExhausted("port 54329 is already in use")).toBe(false);
    expect(isIpcExhausted("FATAL:  data directory does not exist")).toBe(false);
  });
});
