import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sweep } from "./ipc-sweep";
import { connectionUrl, parsePostmasterPid, startLocalPostgres } from "./local-postgres";

vi.mock("./ipc-sweep", () => ({ sweep: vi.fn() }));
vi.mock("./shared-memory", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./shared-memory")>()),
  readSysVSharedMemoryTable: vi.fn(async () => [
    {
      id: 987,
      key: "0x123",
      owner: "test-owner",
      nattch: 1,
      size: 56,
      cpid: process.pid,
      createdAt: 0,
    },
  ]),
}));

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
    vi.spyOn(process, "platform", "get").mockReturnValue("darwin");
    vi.mocked(sweep).mockReset().mockReturnValue({ exitCode: 0, removed: 0 });
    postgresStub.builds = 0;
    postgresStub.stopped = 0;
    postgresStub.steps = [];
    dataDir = await mkdtemp(join(tmpdir(), "crm-pg-start-test-"));
    vi.useFakeTimers();
  });

  afterEach(async () => {
    vi.useRealTimers();
    vi.restoreAllMocks();
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
    const failure = (await settled) as Error;
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
  it("sweeps once in apply mode and retries immediately after a removal", async () => {
    vi.mocked(sweep).mockImplementation((options) => {
      options?.log?.("Apply: limit=32, occupied=32, free=0");
      options?.log?.("987: candidate: orphan marker");
      options?.log?.("987: removed");
      return { exitCode: 0, removed: 1 };
    });
    postgresStub.steps = [
      { logLines: [SHARED_MEMORY_LOG], failAt: "start", error: SHARED_MEMORY_ERROR },
      { logLines: [] },
    ];
    const log = vi.fn();
    const server = await startLocalPostgres({ dataDir, onLog: log });
    expect(server.adopted).toBe(false);
    expect(sweep).toHaveBeenCalledExactlyOnceWith({ apply: true, log: expect.any(Function) });
    expect(vi.getTimerCount()).toBe(0);
    expect(log).toHaveBeenCalledWith("[ipc-sweep] Apply: limit=32, occupied=32, free=0");
    expect(log).toHaveBeenCalledWith("[ipc-sweep] 987: candidate: orphan marker");
    expect(log).toHaveBeenCalledWith("[ipc-sweep] 987: removed");
  });

  it("retains both retry waits and three attempts when no identifiers are removed", async () => {
    postgresStub.steps = Array.from({ length: 3 }, () => ({
      logLines: [SHARED_MEMORY_LOG],
      failAt: "start" as const,
      error: SHARED_MEMORY_ERROR,
    }));
    const log = vi.fn();
    const settled = startLocalPostgres({ dataDir, onLog: log }).catch((error: unknown) => error);
    await vi.advanceTimersByTimeAsync(4_999);
    expect(postgresStub.builds).toBe(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(postgresStub.builds).toBe(2);
    await vi.advanceTimersByTimeAsync(14_999);
    expect(postgresStub.builds).toBe(2);
    await vi.advanceTimersByTimeAsync(1);
    expect(((await settled) as Error).message).toContain(
      "System V shared memory: 1 kernel IDs in use",
    );
    expect(postgresStub.builds).toBe(3);
    expect(sweep).toHaveBeenCalledTimes(1);
    expect(log).toHaveBeenCalledWith(
      "shared memory table is full, retrying the server start in 15000 ms",
    );
  });

  it.each(["throw", "refuse", "removal failure"])(
    "preserves the original error and table summary on sweep %s",
    async (mode) => {
      vi.mocked(sweep).mockImplementation((options) => {
        if (mode === "throw") throw new Error("injected sweep failure");
        options?.log?.(
          mode === "refuse" ? "IPC sweep refused: bad table" : "987: removal failed: denied",
        );
        return { exitCode: 1, removed: 0 };
      });
      postgresStub.steps = Array.from({ length: 3 }, () => ({
        logLines: [SHARED_MEMORY_LOG],
        failAt: "start" as const,
        error: SHARED_MEMORY_ERROR,
      }));
      const log = vi.fn();
      const settled = startLocalPostgres({ dataDir, onLog: log }).catch((error: unknown) => error);
      await vi.advanceTimersByTimeAsync(20_000);
      const failure = (await settled) as Error;
      expect(failure.message).toContain(SHARED_MEMORY_ERROR);
      expect(failure.message).toContain("System V shared memory: 1 kernel IDs in use");
      expect(failure.message).not.toContain("[ipc-sweep]");
      expect(
        log.mock.calls.some(
          ([line]) => line.startsWith("[ipc-sweep]") && /failed|refused|threw/.test(line),
        ),
      ).toBe(true);
      expect(sweep).toHaveBeenCalledTimes(1);
    },
  );

  it("keeps sweep output out of the error ring and classification", async () => {
    vi.mocked(sweep).mockImplementation((options) => {
      for (let i = 0; i < 30; i++) options?.log?.(SHARED_MEMORY_LOG);
      return { exitCode: 0, removed: 1 };
    });
    postgresStub.steps = [
      { logLines: [SHARED_MEMORY_LOG], failAt: "start", error: SHARED_MEMORY_ERROR },
      { logLines: [SEMAPHORE_LOG], failAt: "start", error: SEMAPHORE_ERROR },
    ];
    const log = vi.fn();
    const failure = await startLocalPostgres({ dataDir, onLog: log }).catch(
      (error: unknown) => error,
    );
    expect((failure as Error).message).toContain(SEMAPHORE_LOG);
    expect((failure as Error).message).not.toContain("shared memory segment");
    expect(postgresStub.builds).toBe(2);
    expect(log.mock.calls.filter(([line]) => line.startsWith("[ipc-sweep]"))).toHaveLength(30);
  });

  it("never sweeps for non-exhaustion failures or normal startup", async () => {
    await startLocalPostgres({ dataDir });
    postgresStub.steps[postgresStub.builds] = {
      logLines: [SEMAPHORE_LOG],
      failAt: "start",
      error: SEMAPHORE_ERROR,
    };
    await expect(startLocalPostgres({ dataDir })).rejects.toThrow(SEMAPHORE_ERROR);
    expect(sweep).not.toHaveBeenCalled();
  });

  it("never sweeps outside Darwin", async () => {
    vi.spyOn(process, "platform", "get").mockReturnValue("linux");
    postgresStub.steps = [
      { logLines: [SHARED_MEMORY_LOG], failAt: "start", error: SHARED_MEMORY_ERROR },
      { logLines: [] },
    ];
    const starting = startLocalPostgres({ dataDir });
    await vi.advanceTimersByTimeAsync(5_000);
    await starting;
    expect(sweep).not.toHaveBeenCalled();
  });

  it("uses the core recheck path and protects every ineligible row", async () => {
    const core = await vi.importActual<typeof import("./ipc-sweep")>("./ipc-sweep");
    const header =
      "T ID KEY MODE OWNER GROUP CREATOR CGROUP NATTCH SEGSZ CPID LPID ATIME DTIME CTIME\nShared Memory:\n";
    const row =
      "m 987 0x123 --rw------- test-owner test-group test-owner test-group 0 56 765 765 no-entry no-entry 10:00:00\n";
    const table =
      header +
      [
        row,
        row.replace("m 987", "m 988").replace("0 56", "1 56"),
        row.replace("m 987", "m 989").replaceAll("765", "766"),
        row.replace("m 987", "m 990").replace("10:00:00", "10:09:00"),
        row.replace("m 987", "m 991").replace("0 56", "0 4096"),
        row.replace("m 987", "m 992").replaceAll("test-owner", "other-owner"),
      ].join("");
    const run = vi.fn((command: string, _args: string[]) =>
      command === "sysctl" ? "32" : command === "ipcs" ? table : "",
    );
    vi.mocked(sweep).mockImplementation((options) =>
      core.sweep({
        ...options,
        platform: "darwin",
        owner: "test-owner",
        run,
        now: () => new Date(2026, 9, 10, 10, 10).getTime(),
        dead: (pid) => pid === 765,
      }),
    );
    postgresStub.steps = [
      { logLines: [SHARED_MEMORY_LOG], failAt: "start", error: SHARED_MEMORY_ERROR },
      { logLines: [SHARED_MEMORY_LOG], failAt: "start", error: SHARED_MEMORY_ERROR },
      { logLines: [] },
    ];
    const log = vi.fn();
    const starting = startLocalPostgres({ dataDir, onLog: log });
    await vi.advanceTimersByTimeAsync(15_000);
    await starting;
    expect(sweep).toHaveBeenCalledTimes(1);
    expect(run.mock.calls.filter(([command]) => command === "ipcrm")).toEqual([
      ["ipcrm", ["-m", "987"]],
    ]);
    expect(run.mock.calls.filter(([command]) => command === "ipcs")).toHaveLength(2);
    expect(log.mock.calls.filter(([line]) => line.includes(": keep:"))).toHaveLength(5);
    expect(postgresStub.builds).toBe(3);
  });
});
