import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { connectionUrl, parsePostmasterPid, startLocalPostgres } from "./local-postgres";

type StartStep = {
  logLines: string[];
  failAt?: "initialise" | "start";
  error?: string;
};

const postgresStub = vi.hoisted(() => ({
  builds: 0,
  steps: [] as StartStep[],
  stopped: 0,
}));

vi.mock("embedded-postgres", () => ({
  default: class FakePostgres {
    private readonly onLog?: (message: string) => void;
    private readonly step: StartStep | undefined;

    constructor(options: { onLog?: (message: string) => void }) {
      this.onLog = options.onLog;
      this.step = postgresStub.steps[postgresStub.builds];
      postgresStub.builds += 1;
    }

    async initialise(): Promise<void> {
      for (const line of this.step?.logLines ?? []) this.onLog?.(line);
      if (this.step?.failAt === "initialise") throw new Error(this.step.error);
    }

    async start(): Promise<void> {
      for (const line of this.step?.logLines ?? []) this.onLog?.(line);
      if (this.step?.failAt === "start") throw new Error(this.step.error);
    }

    async stop(): Promise<void> {
      postgresStub.stopped += 1;
    }
  },
}));

// No real sockets: the start path's port choice is stubbed so the retry waits are the only
// timers in the test and fake timers can run them.
const portsStub = vi.hoisted(() => ({ port: 55_000 }));

vi.mock("./ports", () => ({
  pickFreePort: async () => portsStub.port,
  isPortFree: async () => true,
}));

// What a full System V table looks like in the log: the FATAL line reaches both the thrown
// error and the initdb output.
const SHARED_MEMORY_LOG = "FATAL:  could not create shared memory segment: No space left on device";
const SHARED_MEMORY_ERROR = `Postgres init script failed (code: 1, signal: null). ERROR OUTPUT: ${SHARED_MEMORY_LOG}`;
// Another kernel-object shortage: an ENOSPC word is in the line, but no shared memory ID was
// refused, so a retry would not help.
const SEMAPHORE_LOG = "FATAL:  could not create semaphore set: No space left on device";
const SEMAPHORE_ERROR = `Postgres server exited during start. ERROR OUTPUT: ${SEMAPHORE_LOG}`;

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

describe("startLocalPostgres", () => {
  let dataDir = "";

  beforeEach(async () => {
    postgresStub.builds = 0;
    postgresStub.stopped = 0;
    postgresStub.steps = [];
    dataDir = await mkdtemp(join(tmpdir(), "crm-pg-start-test-"));
    vi.useFakeTimers();
  });

  afterEach(async () => {
    vi.useRealTimers();
    await rm(dataDir, { recursive: true, force: true });
  });

  it("reports only the failing attempt's own log, so a second failure is not retried", async () => {
    postgresStub.steps = [
      { logLines: [SHARED_MEMORY_LOG], failAt: "initialise", error: SHARED_MEMORY_ERROR },
      { logLines: [SEMAPHORE_LOG], failAt: "start", error: SEMAPHORE_ERROR },
      { logLines: [SEMAPHORE_LOG], failAt: "start", error: SEMAPHORE_ERROR },
    ];
    const logs: string[] = [];
    const settled = startLocalPostgres({ dataDir, onLog: (line) => logs.push(line) }).catch(
      (error: unknown) => error,
    );
    await vi.advanceTimersByTimeAsync(60_000);

    // The first failure was a full shared memory table, so a second attempt ran. The second
    // was a different failure: it must be handed over at once, with the first attempt's
    // shared memory line not mixed into its report.
    const failure = await settled;
    expect(failure).toBeInstanceOf(Error);
    const message = (failure as Error).message;
    expect(message).toContain(SEMAPHORE_LOG);
    expect(message).not.toContain("shared memory segment");
    expect(message).not.toContain("retrying the server start");
    expect(postgresStub.builds).toBe(2);
    expect(postgresStub.stopped).toBe(2);
    // Everything each attempt logged is still handed to the caller.
    expect(logs).toEqual(expect.arrayContaining([SHARED_MEMORY_LOG, SEMAPHORE_LOG]));
  });

  it("starts on a later attempt once another run gives an id back", async () => {
    postgresStub.steps = [
      { logLines: [SHARED_MEMORY_LOG], failAt: "initialise", error: SHARED_MEMORY_ERROR },
      { logLines: ["database system is ready to accept connections"] },
    ];
    const logs: string[] = [];
    const starting = startLocalPostgres({ dataDir, onLog: (line) => logs.push(line) });
    await vi.advanceTimersByTimeAsync(60_000);
    const server = await starting;

    expect(postgresStub.builds).toBe(2);
    expect(server.adopted).toBe(false);
    expect(server.port).toBe(portsStub.port);
    expect(logs).toContain("shared memory table is full, retrying the server start in 5000 ms");
  });
});
