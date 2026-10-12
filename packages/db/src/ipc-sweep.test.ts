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
      if (command === "ipcs") return table;
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
    const run = vi.fn((command: string) =>
      command === "sysctl"
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
