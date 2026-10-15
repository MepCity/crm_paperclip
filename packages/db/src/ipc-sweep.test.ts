import { describe, expect, it, vi } from "vitest";
import { sweep } from "./ipc-sweep";

const header =
  "T ID KEY MODE OWNER GROUP CREATOR CGROUP NATTCH SEGSZ CPID LPID ATIME DTIME CTIME\nShared Memory:\n";
const row =
  "m 987 0x123 --rw------- test-owner test-group test-owner test-group 0 56 765 765 no-entry no-entry 10:00:00\n";
const now = () => new Date(2026, 9, 10, 10, 10).getTime();

describe("sweep result", () => {
  it("counts successful removals even when a later removal fails", () => {
    const table = header + row + row.replace("m 987", "m 988");
    const run = vi.fn((command: string, args: string[]) => {
      if (command === "sysctl") return "32";
      if (command === "ipcs")
        return args[0] === "-s"
          ? "T ID KEY MODE OWNER GROUP CREATOR CGROUP NSEMS OTIME CTIME\nSemaphores:\n"
          : table;
      if (args[1] === "988") throw new Error("injected removal failure");
      return "";
    });
    const log = vi.fn();
    expect(
      sweep({
        apply: true,
        platform: "darwin",
        owner: "test-owner",
        now,
        dead: () => true,
        run,
        log,
      }),
    ).toEqual({ exitCode: 1, removed: 1 });
    expect(log).toHaveBeenCalledWith("987: removed");
    expect(log).toHaveBeenCalledWith("988: removal failed: Error: injected removal failure");
  });

  it("reports zero removals when the identifier is reused with a new creation time", () => {
    let reads = 0;
    const run = vi.fn((command: string, args: string[]) =>
      command === "ipcs" && args[0] === "-s"
        ? "T ID KEY MODE OWNER GROUP CREATOR CGROUP NSEMS OTIME CTIME\nSemaphores:\n"
        : command === "sysctl"
          ? "32"
          : header + (reads++ === 0 ? row : row.replace("10:00:00", "10:01:00")),
    );
    const log = vi.fn();
    expect(
      sweep({
        apply: true,
        platform: "darwin",
        owner: "test-owner",
        now,
        dead: () => true,
        run,
        log,
      }),
    ).toEqual({ exitCode: 0, removed: 0 });
    expect(log).toHaveBeenCalledWith("987: skipped after recheck");
    expect(run.mock.calls.some(([command]) => command === "ipcrm")).toBe(false);
  });
});

const semHeader = "T ID KEY MODE OWNER GROUP CREATOR CGROUP NSEMS OTIME CTIME\nSemaphores:\n";
const semRow =
  "s 987 0x123 --rw------- test-owner test-group test-owner test-group 17 no-entry 10:00:00\n";

describe("semaphore sweep", () => {
  function fakeRun(result = "987 removed\n", probe?: string) {
    return vi.fn((command: string, args: string[]) => {
      if (command === "sysctl") return "32";
      if (command === "ipcs") return args[0] === "-s" ? semHeader + semRow : header;
      if (command === "cc") return "";
      if (args[0] === "inspect")
        return probe ?? `987 501 17 ${(now() - 600_000) / 1000} 537 765 1 291\n`;
      if (args[0] === "remove") return result;
      throw new Error("unexpected command");
    });
  }
  const options = { platform: "darwin", owner: "test-owner", uid: 501, now };
  it("reports candidates without invoking remove mode in a dry run", () => {
    const run = fakeRun();
    const log = vi.fn();
    expect(sweep({ ...options, run, log })).toEqual({ exitCode: 0, removed: 0 });
    expect(log).toHaveBeenCalledWith("semaphore 987: candidate: orphan PostgreSQL marker");
    expect(run.mock.calls.some(([, args]) => args[0] === "remove")).toBe(false);
  });
  it.each(["987 removed\n", "", "987 failed\n"])("honours native recheck result: %j", (result) => {
    const run = fakeRun(result);
    const log = vi.fn();
    expect(sweep({ ...options, apply: true, run, log })).toEqual({
      exitCode: result.includes("failed") ? 1 : 0,
      removed: result.includes("removed") ? 1 : 0,
    });
    expect(run.mock.calls.find(([, args]) => args[0] === "remove")?.[1]).toEqual([
      "remove",
      `987:${(now() - 600_000) / 1000}:765:291`,
    ]);
    expect(log).toHaveBeenCalledWith(
      `semaphore 987: ${result ? result.trim().split(" ")[1] : "skipped after recheck"}`,
    );
  });
  it.each(["bad probe", "987 501 17 1 537 765 0 291"])(
    "never removes on unreadable or live probes",
    (probe) => {
      const run = fakeRun("", probe);
      sweep({ ...options, apply: true, run, log: vi.fn() });
      expect(run.mock.calls.some(([, args]) => args[0] === "remove")).toBe(false);
    },
  );
});
