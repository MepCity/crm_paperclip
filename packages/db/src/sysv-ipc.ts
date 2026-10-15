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

export type SemaphoreSet = {
  id: number;
  key: string;
  owner: string;
  nsems: number;
  createdAt: number;
};
export type SemaphoreTable = { rows: SemaphoreSet[]; error?: string };

/** Darwin semaphore table; unknown layouts or any malformed row fail closed. */
export function parseSemaphoreTable(output: string, now: number): SemaphoreTable {
  try {
    const lines = output
      .trim()
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    if (lines[0]?.startsWith("IPC status from ")) lines.shift();
    if (
      lines.shift()?.replace(/\s+/g, " ") !==
        "T ID KEY MODE OWNER GROUP CREATOR CGROUP NSEMS OTIME CTIME" ||
      lines.shift() !== "Semaphores:" ||
      !Number.isFinite(now)
    )
      throw new Error("invalid header");
    const rows = lines.map((line) => {
      const cells = line.split(/\s+/);
      const [type, id, key, , owner, , , , nsems, , ctime] = cells;
      if (
        cells.length !== 11 ||
        type !== "s" ||
        !owner ||
        !key ||
        !/^0x[0-9a-f]+$/i.test(key) ||
        !/^\d+$/.test(id ?? "") ||
        !/^\d+$/.test(nsems ?? "") ||
        !Number.isSafeInteger(Number(id)) ||
        !Number.isSafeInteger(Number(nsems))
      )
        throw new Error("invalid row");
      return {
        id: Number(id),
        key,
        owner,
        nsems: Number(nsems),
        createdAt: creationTime(ctime ?? "", now),
      };
    });
    if (new Set(rows.map((row) => row.id)).size !== rows.length) throw new Error("duplicate ID");
    return { rows };
  } catch (error) {
    return { rows: [], error: `Cannot parse semaphore table: ${String(error)}` };
  }
}

export type SemaphoreProbe = {
  id: number;
  uid: number;
  nsems: number;
  createdAt: number;
  marker: number;
  pid: number;
  dead: boolean;
  key: number;
};

export function parseSemaphoreProbes(output: string): SemaphoreProbe[] {
  return output.trim() === ""
    ? []
    : output
        .trim()
        .split("\n")
        .map((line) => {
          const values = line.trim().split(/\s+/).map(Number);
          if (
            values.length !== 8 ||
            values.some((value) => !Number.isSafeInteger(value) || value < 0) ||
            ![0, 1].includes(values[6] ?? -1)
          )
            throw new Error("Invalid semaphore probe");
          const [id = 0, uid = 0, nsems = 0, seconds = 0, marker = 0, pid = 0, dead = 0, key = 0] =
            values;
          return { id, uid, nsems, createdAt: seconds * 1000, marker, pid, dead: dead === 1, key };
        });
}

export function selectSemaphoreOrphans(
  table: SemaphoreTable,
  probes: SemaphoreProbe[],
  options: { owner: string; uid: number; now: number },
): SemaphoreProbe[] {
  if (table.error || !Number.isFinite(options.now)) return [];
  return probes.filter((probe) => {
    const row = table.rows.find((row) => row.id === probe.id);
    return (
      row?.owner === options.owner &&
      row.nsems === 17 &&
      probe.nsems === 17 &&
      probe.uid === options.uid &&
      probe.marker === 537 &&
      probe.pid > 0 &&
      probe.dead &&
      Number(row.key) === probe.key &&
      options.now - row.createdAt >= 300_000 &&
      options.now - probe.createdAt >= 300_000
    );
  });
}
