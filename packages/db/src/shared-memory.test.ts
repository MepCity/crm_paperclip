import { describe, expect, it, vi } from "vitest";
import {
  describeSysVSharedMemory,
  isSharedMemoryExhaustion,
  parseSysVSharedMemoryTable,
  retryOnSharedMemoryExhaustion,
  stalePostgresMarkers,
  staleSysVSegments,
} from "./shared-memory";

// Column layout of `ipcs -m -a` on macOS; every value below is synthetic.
const IPCS_OUTPUT = `IPC status from <running system> as of Fri Oct  9 23:22:38 +03 2026
T     ID     KEY        MODE       OWNER    GROUP  CREATOR   CGROUP NATTCH  SEGSZ  CPID  LPID   ATIME    DTIME    CTIME
Shared Memory:
m  65536 0x51105379 --rw-------    tester    wheel    tester    wheel      1      8   1477   1477 12:27:30 no-entry 12:27:30
m 131073 0x03a18781 --rw-------    tester    wheel    tester    wheel     19     56  57055  57055 18:16:20 23:22:25 18:16:20
m 92405762 0x04258363 --rw-------    tester    wheel    tester    wheel      0     56  47406  47406 18:14:46 18:16:41 18:14:46
m 13172739 0x03cd4334 --rw-------    tester    wheel    tester    wheel      0     56  26255  26255  1:14:47  1:18:36  1:14:47
m 21495835 0x052507ca --rw-------    tester    wheel    tester    wheel      3     56  96102  96102  3:08:21  3:16:04  3:08:21
m 777001 0x0777abcd --rw-------    tester    wheel    tester    wheel      0   4096  88888  88888  4:00:00 no-entry  4:00:00
`;

const EXHAUSTION = [
  "could not start local PostgreSQL: Postgres init script failed (code: 1, signal: null).",
  "ERROR OUTPUT: FATAL:  could not create shared memory segment: No space left on device",
  "DETAIL:  Failed system call was shmget(key=89317625, size=56, 03600).",
  "HINT:  This error does *not* mean that you have run out of disk space.",
].join("\n");

// 1477, 57055 and 96102 are still running; 47406, 26255 and 88888 died.
const now = new Date(2026, 9, 10, 23, 30).getTime();
const isPidAlive = (pid: number) => [1477, 57055, 96102, 1000].includes(pid);

describe("parseSysVSharedMemoryTable", () => {
  it("reads the id, size, attach count and creator pid of every shared memory row", () => {
    expect(
      parseSysVSharedMemoryTable(IPCS_OUTPUT, now).map(({ id, nattch, cpid, size }) => ({
        id,
        attachedProcesses: nattch,
        creatorPid: cpid,
        bytes: size,
      })),
    ).toEqual([
      { id: 65536, attachedProcesses: 1, creatorPid: 1477, bytes: 8 },
      { id: 131073, attachedProcesses: 19, creatorPid: 57055, bytes: 56 },
      { id: 92405762, attachedProcesses: 0, creatorPid: 47406, bytes: 56 },
      { id: 13172739, attachedProcesses: 0, creatorPid: 26255, bytes: 56 },
      { id: 21495835, attachedProcesses: 3, creatorPid: 96102, bytes: 56 },
      { id: 777001, attachedProcesses: 0, creatorPid: 88888, bytes: 4096 },
    ]);
  });

  it("rejects the entire table when a header or any row is malformed", () => {
    expect(parseSysVSharedMemoryTable(IPCS_OUTPUT.replace("SEGSZ", "UNKNOWN"), now)).toEqual([]);
    expect(parseSysVSharedMemoryTable(`${IPCS_OUTPUT}m broken\n`, now)).toEqual([]);
  });

  it("returns nothing for a header-only or empty report", () => {
    expect(parseSysVSharedMemoryTable("T ID KEY MODE\nShared Memory:\n")).toEqual([]);
    expect(parseSysVSharedMemoryTable("")).toEqual([]);
  });
});

describe("staleSysVSegments", () => {
  it("keeps only the segments nothing is attached to and whose creator is gone", () => {
    const rows = parseSysVSharedMemoryTable(IPCS_OUTPUT, now);
    expect(staleSysVSegments(rows, isPidAlive).map((row) => row.id)).toEqual([
      92405762, 13172739, 777001,
    ]);
  });

  it("keeps an unattached segment while its creator is still alive", () => {
    const rows = parseSysVSharedMemoryTable(IPCS_OUTPUT, now)
      .filter((row) => row.cpid === 1477)
      .map((row) => ({ ...row, nattch: 0 }));
    expect(staleSysVSegments(rows, isPidAlive)).toEqual([]);
  });
});

describe("stalePostgresMarkers", () => {
  it("keeps the stale segments that are the size a PostgreSQL server asks for", () => {
    const rows = parseSysVSharedMemoryTable(IPCS_OUTPUT, now);
    expect(stalePostgresMarkers(rows, isPidAlive).map((row) => row.id)).toEqual([
      92405762, 13172739,
    ]);
  });

  it("leaves a live server's segment alone even when nothing is attached to it", () => {
    const rows = parseSysVSharedMemoryTable(IPCS_OUTPUT, now)
      .filter((row) => row.cpid === 96102)
      .map((row) => ({ ...row, nattch: 0 }));
    expect(stalePostgresMarkers(rows, isPidAlive)).toEqual([]);
  });
});

describe("isSharedMemoryExhaustion", () => {
  it("recognises the FATAL line PostgreSQL prints when the kernel refuses an ID", () => {
    expect(isSharedMemoryExhaustion(EXHAUSTION)).toBe(true);
  });

  it("does not match a plain disk-full or a different startup failure", () => {
    expect(isSharedMemoryExhaustion("no space left on device, wrote 4 kB")).toBe(false);
    expect(isSharedMemoryExhaustion("port 5432 is already in use")).toBe(false);
    expect(isSharedMemoryExhaustion("FATAL: could not create semaphore set")).toBe(false);
  });
});

describe("describeSysVSharedMemory", () => {
  it("reports how many ids are in use and how many are stale", () => {
    const line =
      describeSysVSharedMemory(parseSysVSharedMemoryTable(IPCS_OUTPUT, now), isPidAlive, {
        owner: "tester",
        now,
      }) ?? "";
    expect(line).toContain("6 kernel IDs in use");
    expect(line).toContain("2 stale");
    expect(line).toContain("pnpm ipc:sweep");
    expect(line).toContain("dry run");
    expect(line).toContain("removes nothing");
  });

  it("says nothing when the table could not be read", () => {
    expect(describeSysVSharedMemory([], isPidAlive)).toBeNull();
  });
});

describe("retryOnSharedMemoryExhaustion", () => {
  const exhaustion = () => new Error(EXHAUSTION);

  it("returns the first result without waiting", async () => {
    const sleep = vi.fn();
    const work = vi.fn(async () => "ok");
    await expect(retryOnSharedMemoryExhaustion(work, { sleep })).resolves.toBe("ok");
    expect(work).toHaveBeenCalledTimes(1);
    expect(sleep).not.toHaveBeenCalled();
  });

  it("tries again while another run frees an id", async () => {
    const sleep = vi.fn(async () => {});
    const onRetry = vi.fn();
    let calls = 0;
    const result = await retryOnSharedMemoryExhaustion(
      async () => {
        calls += 1;
        if (calls === 1) throw exhaustion();
        return "started";
      },
      { sleep, onRetry, delaysMs: [5_000, 15_000] },
    );
    expect(result).toBe("started");
    expect(calls).toBe(2);
    expect(sleep).toHaveBeenCalledWith(5_000);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("does not retry a failure that is not shared memory exhaustion", async () => {
    const sleep = vi.fn(async () => {});
    const work = vi.fn(async () => {
      throw new Error("port 5432 is already in use");
    });
    await expect(retryOnSharedMemoryExhaustion(work, { sleep })).rejects.toThrow("already in use");
    expect(work).toHaveBeenCalledTimes(1);
    expect(sleep).not.toHaveBeenCalled();
  });

  it("gives up after the attempts and rethrows the last failure", async () => {
    const sleep = vi.fn(async (_ms: number) => {});
    let calls = 0;
    await expect(
      retryOnSharedMemoryExhaustion(
        async () => {
          calls += 1;
          throw exhaustion();
        },
        { sleep, attempts: 3, delaysMs: [10, 20] },
      ),
    ).rejects.toThrow(EXHAUSTION);
    expect(calls).toBe(3);
    expect(sleep.mock.calls.map(([ms]) => ms)).toEqual([10, 20]);
  });
});
