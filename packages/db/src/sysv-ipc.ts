import { execFileSync } from "node:child_process";

export type Segment = {
  id: number;
  key: string;
  owner: string;
  nattch: number;
  size: number;
  cpid: number;
  createdAt: number;
};
export type IpcTable = { rows: Segment[]; error?: string };
const header = "T ID KEY MODE OWNER GROUP CREATOR CGROUP NATTCH SEGSZ CPID LPID ATIME DTIME CTIME";

/** Darwin CTIME only contains the local time. Use its most recent occurrence (minimum age). */
function creationTime(value: string, now: number): number {
  if (!/^\d{1,2}:\d{2}:\d{2}$/.test(value)) throw new Error("invalid CTIME");
  const [hours = -1, minutes = -1, seconds = -1] = value.split(":").map(Number);
  if (hours > 23 || minutes > 59 || seconds > 59) throw new Error("invalid CTIME");
  const date = new Date(now);
  date.setHours(hours, minutes, seconds, 0);
  if (date.getTime() > now) date.setDate(date.getDate() - 1);
  return date.getTime();
}

/** Parse the complete Darwin table; one unknown header or malformed row closes the whole table. */
export function parseIpcTable(output: string, now: number): IpcTable {
  try {
    if (!Number.isFinite(now)) throw new Error("invalid current time");
    let sawHeader = false;
    let sawSection = false;
    const rows: Segment[] = [];
    const integer = (value: string | undefined) => {
      if (!value || !/^\d+$/.test(value)) throw new Error("invalid integer");
      const number = Number(value);
      if (!Number.isSafeInteger(number)) throw new Error("invalid integer");
      return number;
    };
    for (const line of output
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)) {
      if (line.startsWith("IPC status from ") && !sawHeader) continue;
      if (line.replace(/\s+/g, " ") === header && !sawHeader) {
        sawHeader = true;
        continue;
      }
      if (line === "Shared Memory:" && sawHeader && !sawSection) {
        sawSection = true;
        continue;
      }
      if (!sawSection) throw new Error("unexpected IPC header");
      const cells = line.split(/\s+/);
      if (cells.length !== 15 || cells[0] !== "m") throw new Error("malformed IPC row");
      const [, id, key, , owner, , , , nattch, size, cpid, lpid, , , ctime] = cells;
      if (!key || !/^0x[0-9a-f]+$/i.test(key) || !owner) throw new Error("malformed IPC row");
      integer(lpid);
      const creator = integer(cpid);
      if (creator === 0) throw new Error("invalid creator PID");
      rows.push({
        id: integer(id),
        key,
        owner,
        nattch: integer(nattch),
        size: integer(size),
        cpid: creator,
        createdAt: creationTime(ctime ?? "", now),
      });
    }
    if (!sawHeader || !sawSection || new Set(rows.map((row) => row.id)).size !== rows.length) {
      throw new Error("missing header or duplicate IPC identifier");
    }
    return { rows };
  } catch (error) {
    return { rows: [], error: `Cannot parse IPC table: ${(error as Error).message}` };
  }
}

export type Decision = { row: Segment; selected: boolean; reason: string };
/** Pure selection: only confirmed-dead creators qualify; unknown process state stays protected. */
export function selectOrphans(
  table: IpcTable,
  options: {
    owner: string;
    now: number;
    deadPids: ReadonlySet<number>;
    minimumAgeMs?: number;
  },
): Decision[] {
  if (table.error) return [];
  return table.rows.map((row) => {
    const reason =
      row.owner !== options.owner
        ? "different owner"
        : row.nattch !== 0
          ? "attached processes"
          : row.size !== 56
            ? "not a PostgreSQL marker (56 bytes)"
            : !options.deadPids.has(row.cpid)
              ? "creator alive or unconfirmed"
              : options.now - row.createdAt < (options.minimumAgeMs ?? 300_000)
                ? "younger than minimum age"
                : "orphan marker";
    return { row, selected: reason === "orphan marker", reason };
  });
}

export type CommandRunner = (command: string, args: string[]) => string;
export const runCommand: CommandRunner = (command, args) =>
  execFileSync(command, args, { encoding: "utf8" });

export function confirmedDead(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return false;
  } catch (error) {
    return (error as NodeJS.ErrnoException).code === "ESRCH";
  }
}

/** The only removal call. Caller must re-read and revalidate immediately before invoking. */
export function removeSegment(id: number, run: CommandRunner): string {
  return run("ipcrm", ["-m", String(id)]);
}
