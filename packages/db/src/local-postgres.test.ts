import { describe, expect, it } from "vitest";
import {
  buildInitdbFlags,
  buildServerFlags,
  type ClusterStart,
  connectionUrl,
  failureReason,
  ipcFailure,
  isIpcExhausted,
  parsePostmasterPid,
  startClusterWithIpcRetry,
  startFailureMessage,
  stopCluster,
} from "./local-postgres";

const INITDB_FAILURE =
  "Postgres init script failed (code: 1, signal: null). ERROR OUTPUT: FATAL:  could not create shared memory segment: No space left on device\nDETAIL:  Failed system call was shmget(key=89361825, size=56, 03600).";
const SERVER_FATAL = "FATAL:  could not create shared memory segment: No space left on device";

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
  it("pins the UTF-8 locale and sends no shared memory setting", () => {
    // Measured: a default mmap postmaster holds one 56-byte SysV identifier too, so choosing the
    // implementation here would not relieve kern.sysv.shmmni.
    expect(buildInitdbFlags()).toEqual([
      "--encoding=UTF8",
      "--locale=C",
      "--locale-provider=icu",
      "--icu-locale=und",
    ]);
  });
});

describe("buildServerFlags", () => {
  it("loopbacks the server", () => {
    expect(buildServerFlags()).toEqual(["-c", "listen_addresses=127.0.0.1"]);
  });

  it("adds the caller's settings and lets them win", () => {
    expect(buildServerFlags({ fsync: "off", shared_memory_type: "sysv" })).toEqual([
      "-c",
      "listen_addresses=127.0.0.1",
      "-c",
      "fsync=off",
      "-c",
      "shared_memory_type=sysv",
    ]);
  });
});

describe("isIpcExhausted", () => {
  it("matches the shared memory and semaphore failures", () => {
    expect(isIpcExhausted(INITDB_FAILURE)).toBe(true);
    expect(isIpcExhausted(SERVER_FATAL)).toBe(true);
    expect(isIpcExhausted("FATAL:  could not create semaphore set: No space left on device")).toBe(
      true,
    );
  });

  it("does not match other start failures", () => {
    expect(isIpcExhausted("port 54329 is already in use")).toBe(false);
    expect(isIpcExhausted("FATAL:  data directory does not exist")).toBe(false);
  });
});

describe("ipcFailure", () => {
  it("reads the identifier failure from the postmaster output when the reason is the placeholder", () => {
    expect(ipcFailure("server exited during start", SERVER_FATAL)).toBe(true);
    expect(ipcFailure("server exited during start", `previous line\n${SERVER_FATAL}`)).toBe(true);
  });

  it("reads it from the reason when initdb reports the whole stderr", () => {
    expect(ipcFailure(INITDB_FAILURE, "")).toBe(true);
  });

  it("stays false for an unrelated start failure", () => {
    expect(ipcFailure("server exited during start", "FATAL:  config file contains errors")).toBe(
      false,
    );
  });
});

describe("failureReason", () => {
  it("keeps a real message", () => {
    expect(failureReason(new Error(INITDB_FAILURE))).toBe(INITDB_FAILURE);
  });

  it("names the placeholder embedded-postgres leaves behind", () => {
    // start() rejects with no argument when the postmaster exits early.
    expect(failureReason(undefined)).toBe("server exited during start");
    expect(failureReason(new Error(""))).toBe("server exited during start");
    expect(failureReason("boom")).toBe("server exited during start");
  });
});

/** embedded-postgres rejects start() with no value when the postmaster dies during start. */
const REJECT_WITHOUT_REASON = Symbol("reject without reason");

type FakeFailure = Error | typeof REJECT_WITHOUT_REASON;

function rejectWith(failure: FakeFailure): void {
  throw failure === REJECT_WITHOUT_REASON ? undefined : failure;
}

function fakeCluster(
  failures: { initialise?: FakeFailure; start?: FakeFailure }[],
  log: string[],
): { create: () => ClusterStart; clusters: ClusterStart[] } {
  const clusters: ClusterStart[] = failures.map((failure, index) => {
    const cluster: ClusterStart = {
      async initialise() {
        log.push(`initialise:${index}`);
        if (failure.initialise !== undefined) rejectWith(failure.initialise);
      },
      async start() {
        log.push(`start:${index}`);
        if (failure.start !== undefined) rejectWith(failure.start);
      },
      async stop() {
        log.push(`stop:${index}`);
      },
    };
    return cluster;
  });
  let next = 0;
  return {
    create: () => {
      const cluster = clusters[next];
      if (!cluster) throw new Error("no cluster left in the fixture");
      next += 1;
      return cluster;
    },
    clusters,
  };
}

describe("startClusterWithIpcRetry", () => {
  it("retries a taken identifier and waits between attempts", async () => {
    const log: string[] = [];
    const waits: number[] = [];
    const exhausted = new Error(INITDB_FAILURE);
    const { create } = fakeCluster(
      [{ initialise: exhausted }, { initialise: exhausted }, { initialise: exhausted }, {}],
      log,
    );
    const retries: number[] = [];

    const result = await startClusterWithIpcRetry({
      create,
      needsInitialise: () => true,
      isIpcExhausted: (reason) => isIpcExhausted(reason),
      sleep: async (ms) => {
        waits.push(ms);
      },
      onRetry: ({ delayMs }) => retries.push(delayMs),
    });

    expect(result.ok).toBe(true);
    expect(result.attempts).toBe(4);
    expect(waits).toEqual([5_000, 10_000, 20_000]);
    expect(retries).toEqual([5_000, 10_000, 20_000]);
    expect(log).toEqual([
      "initialise:0",
      "stop:0",
      "initialise:1",
      "stop:1",
      "initialise:2",
      "stop:2",
      "initialise:3",
      "start:3",
    ]);
  });

  it("gives up after the last delay and reports the failure as exhausted", async () => {
    const log: string[] = [];
    const { create } = fakeCluster(
      [
        { start: new Error(SERVER_FATAL) },
        { start: new Error(SERVER_FATAL) },
        { start: new Error(SERVER_FATAL) },
        { start: new Error(SERVER_FATAL) },
      ],
      log,
    );
    const waits: number[] = [];

    const result = await startClusterWithIpcRetry({
      create,
      needsInitialise: () => false,
      isIpcExhausted: (reason) => isIpcExhausted(reason),
      sleep: async (ms) => {
        waits.push(ms);
      },
    });

    expect(result).toMatchObject({
      ok: false,
      ipcExhausted: true,
      attempts: 4,
      reason: SERVER_FATAL,
    });
    // Three waits follow the first three attempts; the fourth failure ends the loop.
    expect(waits).toEqual([5_000, 10_000, 20_000]);
    expect(log).toEqual([
      "start:0",
      "stop:0",
      "start:1",
      "stop:1",
      "start:2",
      "stop:2",
      "start:3",
      "stop:3",
    ]);
  });

  it("does not retry any other failure", async () => {
    const log: string[] = [];
    const { create } = fakeCluster([{ start: new Error("data directory invalid") }, {}], log);
    const waits: number[] = [];

    const result = await startClusterWithIpcRetry({
      create,
      needsInitialise: () => true,
      isIpcExhausted: (reason) => isIpcExhausted(reason),
      sleep: async (ms) => {
        waits.push(ms);
      },
    });

    expect(result).toMatchObject({ ok: false, ipcExhausted: false, attempts: 1 });
    expect(waits).toEqual([]);
    expect(log).toEqual(["initialise:0", "start:0", "stop:0"]);
  });

  it("retries a server that died with the identifier error only in its output", async () => {
    const log: string[] = [];
    // The rejection carries no reason; the FATAL line is only in the machine output the
    // caller collects, so the caller's predicate has to look there.
    const { create } = fakeCluster([{ start: REJECT_WITHOUT_REASON }, {}], log);
    const seen: string[] = [];

    const result = await startClusterWithIpcRetry({
      create,
      needsInitialise: () => false,
      isIpcExhausted: (reason) => {
        seen.push(reason);
        return ipcFailure(reason, SERVER_FATAL);
      },
      sleep: async () => undefined,
    });

    expect(seen).toEqual(["server exited during start"]);
    expect(result.ok).toBe(true);
    expect(result.attempts).toBe(2);
  });

  it("stops every failed attempt even when the child is already gone", async () => {
    const log: string[] = [];
    const { create, clusters } = fakeCluster([{ start: new Error(SERVER_FATAL) }, {}], log);
    // The postmaster exited before the rejection was handled: stop() would never resolve.
    const dead = clusters[0] as ClusterStart;
    dead.process = { exitCode: 1, signalCode: null } as never;

    const result = await startClusterWithIpcRetry({
      create,
      needsInitialise: () => false,
      isIpcExhausted: (reason) => isIpcExhausted(reason),
      retryDelaysMs: [1],
      sleep: async () => undefined,
    });

    expect(result.ok).toBe(true);
    expect(log).toEqual(["start:0", "start:1"]);
    expect(dead.process).toBeUndefined();
  });

  it("skips initdb when the data directory is already initialised", async () => {
    const log: string[] = [];
    const { create } = fakeCluster([{}], log);

    const result = await startClusterWithIpcRetry({
      create,
      needsInitialise: () => false,
      isIpcExhausted: () => false,
      sleep: async () => undefined,
    });

    expect(result.ok).toBe(true);
    expect(log).toEqual(["start:0"]);
  });
});

describe("stopCluster", () => {
  it("waits for a running cluster", async () => {
    const log: string[] = [];
    await stopCluster({
      async initialise() {},
      async start() {},
      async stop() {
        log.push("stop");
      },
    });
    expect(log).toEqual(["stop"]);
  });

  it("does not await an exit event that already happened", async () => {
    const log: string[] = [];
    const cluster: ClusterStart = {
      async initialise() {},
      async start() {},
      async stop() {
        log.push("stop");
      },
      process: { exitCode: null, signalCode: "SIGKILL" } as never,
    };

    await stopCluster(cluster);

    expect(log).toEqual([]);
    expect(cluster.process).toBeUndefined();
  });
});

describe("startFailureMessage", () => {
  it("names the kernel limit and that waiting cannot reclaim a leak", () => {
    const message = startFailureMessage(SERVER_FATAL, ["last server line"], true, 4);
    expect(message).toContain(SERVER_FATAL);
    expect(message).toContain("4 attempts failed");
    expect(message).toContain("kern.sysv.shmmni");
    expect(message).toContain("never reclaimed by waiting");
    expect(message).toContain("last server line");
  });

  it("keeps the hint out of unrelated failures", () => {
    const message = startFailureMessage("data directory invalid", [], false, 1);
    expect(message).toBe("could not start local PostgreSQL: data directory invalid\n");
    expect(message).not.toContain("shmmni");
  });

  it("reports the reason of a single failed attempt without an attempt count", () => {
    expect(startFailureMessage(INITDB_FAILURE, [], true, 1)).toContain(
      `could not start local PostgreSQL: ${INITDB_FAILURE}`,
    );
  });
});
