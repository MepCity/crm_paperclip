import { describe, expect, it, vi } from "vitest";
import { sweep } from "./ipc-sweep";

const header =
  "T ID KEY MODE OWNER GROUP CREATOR CGROUP NATTCH SEGSZ CPID LPID ATIME DTIME CTIME\nShared Memory:\n";
const row =
  "m 987 0x123 --rw------- test-owner test-group test-owner test-group 0 56 765 765 no-entry no-entry 10:00:00\n";
const now = () => new Date(2026, 9, 10, 10, 10).getTime();
function fixture(tables = [header + row]) {
  let reads = 0;
  const run = vi.fn((command: string) =>
    command === "sysctl"
      ? "32"
      : command === "ipcs"
        ? (tables[Math.min(reads++, tables.length - 1)] ?? "")
        : "",
  );
  const log = vi.fn();
  return { run, log, platform: "darwin", owner: "test-owner", now, dead: () => true };
}
describe("ipc sweep", () => {
  it("defaults to dry run and never executes a removal", () => {
    const options = fixture();
    expect(sweep(options)).toBe(0);
    expect(options.run.mock.calls.map(([command]) => command)).toEqual(["sysctl", "ipcs"]);
    expect(options.log).toHaveBeenCalledWith("Dry run: limit=32, occupied=1, free=31");
  });
  it("rechecks before an explicit apply", () => {
    const options = fixture();
    expect(sweep({ ...options, apply: true })).toBe(0);
    expect(options.run).toHaveBeenLastCalledWith("ipcrm", ["-m", "987"]);
    expect(options.run.mock.calls.filter(([command]) => command === "ipcs")).toHaveLength(2);
  });
  it.each([
    header,
    header + row.replace("0 56", "1 56"),
    header + row.replace("0x123", "0x456"),
    header + row.replace("765", "766"),
  ])("skips disappeared, attached or reused identifiers", (fresh) => {
    const options = fixture([header + row, fresh]);
    expect(sweep({ ...options, apply: true })).toBe(0);
    expect(options.run.mock.calls.some(([command]) => command === "ipcrm")).toBe(false);
  });
  it("fails closed when the recheck is malformed", () => {
    const options = fixture([header + row, "bad table"]);
    expect(sweep({ ...options, apply: true })).toBe(1);
    expect(options.run.mock.calls.some(([command]) => command === "ipcrm")).toBe(false);
  });
  it("protects live creators", () => {
    const options = fixture();
    expect(sweep({ ...options, apply: true, dead: () => false })).toBe(0);
    expect(options.run.mock.calls.some(([command]) => command === "ipcrm")).toBe(false);
  });
  it("does nothing outside Darwin", () => {
    const options = fixture();
    expect(sweep({ ...options, platform: "linux", apply: true })).toBe(0);
    expect(options.run).not.toHaveBeenCalled();
  });
});
