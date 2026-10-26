import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it, vi } from "vitest";
import {
  confirmedDead,
  parseIpcTable,
  parseSemaphoreProbes,
  parseSemaphoreTable,
  type Segment,
  selectOrphans,
  selectSemaphoreOrphans,
} from "./sysv-ipc";

const ipcHeader =
  "T ID KEY MODE OWNER GROUP CREATOR CGROUP NATTCH SEGSZ CPID LPID ATIME DTIME CTIME\nShared Memory:\n";
const ipcRow =
  "m 987 0x123 --rw------- test-owner test-group test-owner test-group 0 56 765 765 no-entry no-entry 10:00:00\n";
const now = new Date(2026, 9, 10, 10, 10).getTime();
const table = () => parseIpcTable(ipcHeader + ipcRow, now);
const options = { owner: "test-owner", now, deadPids: new Set([765]) };

describe("Darwin IPC parser", () => {
  it("reads the measured column format, including time-of-day columns", () => {
    expect(table().error).toBeUndefined();
    expect(table().rows[0]).toMatchObject({ id: 987, nattch: 0, size: 56, cpid: 765 });
    expect(table().rows[0]?.createdAt).toBe(now - 600_000);
  });
  it("accepts an empty table with its headers", () => {
    expect(parseIpcTable(ipcHeader, now)).toEqual({ rows: [] });
  });
  it.each([
    "",
    ipcRow,
    ipcHeader.replace("CPID ", ""),
    ipcHeader + ipcRow.replace(" 56 ", " bad "),
    `${ipcHeader}${ipcRow}unexpected`,
    ipcHeader + ipcRow.replace("10:00:00", "25:00:00"),
  ])("refuses the entire malformed table: %s", (text) => {
    const parsed = parseIpcTable(text, now);
    expect(parsed.error).toBeTruthy();
    expect(parsed.rows).toEqual([]);
    expect(selectOrphans(parsed, options)).toEqual([]);
  });
  it("uses the most recent occurrence across midnight", () => {
    const midnight = new Date(2026, 9, 11, 0, 1).getTime();
    const row = parseIpcTable(ipcHeader + ipcRow.replace("10:00:00", "23:59:00"), midnight).rows[0];
    expect(row?.createdAt).toBe(midnight - 120_000);
  });
});

describe("orphan selection", () => {
  it("requires all conditions and includes the age boundary", () => {
    expect(selectOrphans(table(), options)[0]?.selected).toBe(true);
    expect(selectOrphans(table(), { ...options, now: now - 300_000 })[0]?.selected).toBe(true);
  });
  it.each<{ change: Partial<Segment>; reason: string }>([
    { change: { nattch: 1 }, reason: "attached processes" },
    { change: { size: 8 }, reason: "not a PostgreSQL marker (56 bytes)" },
    { change: { cpid: 766 }, reason: "creator alive or unconfirmed" },
    { change: { createdAt: now - 299_999 }, reason: "younger than minimum age" },
    { change: { owner: "other-owner" }, reason: "different owner" },
    { change: { createdAt: now + 1 }, reason: "younger than minimum age" },
  ])("protects $reason", ({ change, reason }) => {
    const row = table().rows[0];
    if (!row) throw new Error("missing fixture");
    expect(selectOrphans({ rows: [{ ...row, ...change }] }, options)[0]).toMatchObject({
      selected: false,
      reason,
    });
  });
});

describe("creator process probe", () => {
  it.each(["ESRCH", "EPERM", "EINVAL"])("only confirms ESRCH (%s)", (code) => {
    const kill = vi.spyOn(process, "kill").mockImplementation(() => {
      throw Object.assign(new Error("probe failure"), { code });
    });
    try {
      expect(confirmedDead(765)).toBe(code === "ESRCH");
      expect(kill).toHaveBeenCalledWith(765, 0);
    } finally {
      kill.mockRestore();
    }
  });
  it("protects a living creator", () => {
    const kill = vi.spyOn(process, "kill").mockReturnValue(true);
    try {
      expect(confirmedDead(765)).toBe(false);
    } finally {
      kill.mockRestore();
    }
  });
});

const semHeader = "T ID KEY MODE OWNER GROUP CREATOR CGROUP NSEMS OTIME CTIME\nSemaphores:\n";
const semRow =
  "s 987 0x123 --rw------- test-owner test-group test-owner test-group 17 no-entry 10:00:00\n";

describe("semaphore parsing and selection", () => {
  const probe = {
    id: 987,
    uid: 501,
    nsems: 17,
    createdAt: now - 600_000,
    marker: 537,
    pid: 765,
    dead: true,
    key: 0x123,
  };
  const opts = { owner: "test-owner", uid: 501, now };
  it("selects only a confirmed-dead PostgreSQL set at least five minutes old", () => {
    const table = parseSemaphoreTable(semHeader + semRow, now);
    expect(selectSemaphoreOrphans(table, [probe], opts)).toEqual([probe]);
    expect(
      selectSemaphoreOrphans(table, [{ ...probe, createdAt: now - 300_000 }], opts),
    ).toHaveLength(1);
    expect(parseSemaphoreProbes(`987 501 17 ${probe.createdAt / 1000} 537 765 1 291`)).toEqual([
      probe,
    ]);
  });
  it.each([
    { marker: 0 },
    { pid: 0 },
    { dead: false },
    { nsems: 1 },
    { uid: 502 },
    { createdAt: now - 299_999 },
    { createdAt: now + 1 },
    { key: 0x124 },
  ])("protects an ineligible probe: %j", (change) => {
    expect(
      selectSemaphoreOrphans(
        parseSemaphoreTable(semHeader + semRow, now),
        [{ ...probe, ...change }],
        opts,
      ),
    ).toEqual([]);
  });
  it.each([
    semHeader + semRow.replaceAll("test-owner", "other-owner"),
    semHeader + semRow.replace(" 17 ", " 1 "),
    semHeader + semRow.replace("10:00:00", "10:09:00"),
    "",
    semRow,
    semHeader.replace("NSEMS", "UNKNOWN") + semRow,
    `${semHeader}${semRow}s broken`,
    semHeader + semRow + semRow,
    semHeader + semRow.replace("10:00:00", "25:00:00"),
  ])("refuses malformed or ineligible tables", (output) => {
    expect(selectSemaphoreOrphans(parseSemaphoreTable(output, now), [probe], opts)).toEqual([]);
  });
  it.each(["987 501 17", "987 501 17 1 537 765 2 291", "oops 501 17 1 537 765 1 291"])(
    "rejects malformed helper output",
    (output) => {
      expect(() => parseSemaphoreProbes(output)).toThrow();
    },
  );
});

// Exercise the actual native recheck/removal branch with fake syscalls only.
describe("native semaphore recheck", () => {
  it("rechecks ownership, marker, PID, age and identifier reuse before removal", () => {
    const dir = mkdtempSync(join(tmpdir(), "crm-ipc-native-test-"));
    try {
      const binary = join(dir, "harness");
      execFileSync("cc", [
        "-Wall",
        "-Wextra",
        "-Werror",
        "-o",
        binary,
        fileURLToPath(new URL("./sysv-semaphore-harness.c", import.meta.url)),
      ]);
      for (const scenario of [
        "valid",
        "owner",
        "size",
        "marker",
        "young",
        "alive",
        "eperm",
        "unknown",
        "read-error",
        "zero-pid",
        "key-reuse",
        "ctime-reuse",
        "pid-reuse",
      ]) {
        expect(execFileSync(binary, [scenario], { encoding: "utf8" }), scenario).toContain(
          `removals=${scenario === "valid" ? 1 : 0}`,
        );
      }
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
