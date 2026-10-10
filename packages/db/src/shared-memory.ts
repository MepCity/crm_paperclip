import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

/**
 * macOS hands out System V shared memory IDs from a small kernel table and does not take an
 * ID back when the process that created it dies. PostgreSQL asks for one 56-byte ID while
 * `initdb` runs its bootstrap script and again while a server is up, so every server that was
 * killed instead of stopped leaves one ID behind. When the table is full, `shmget` fails with
 * ENOSPC and no new cluster can be initialised on the machine — by any project.
 */
export type SysVSharedMemoryRow = {
  id: number;
  attachedProcesses: number;
  creatorPid: number;
  bytes: number;
};

/** Size of the placeholder segment a PostgreSQL server asks the kernel for. */
export const POSTGRES_MARKER_BYTES = 56;

/** Reads the `ID`, `SEGSZ`, `NATTCH` and `CPID` columns of `ipcs -m -a` (macOS layout). */
export function parseSysVSharedMemoryTable(output: string): SysVSharedMemoryRow[] {
  const rows: SysVSharedMemoryRow[] = [];
  for (const line of output.split("\n")) {
    const columns = line.trim().split(/\s+/);
    if (columns[0] !== "m") continue;
    const id = Number(columns[1]);
    const bytes = Number(columns[9]);
    const attachedProcesses = Number(columns[8]);
    const creatorPid = Number(columns[10]);
    if (
      !Number.isInteger(id) ||
      !Number.isInteger(attachedProcesses) ||
      !Number.isInteger(creatorPid) ||
      !Number.isInteger(bytes)
    ) {
      continue;
    }
    rows.push({ id, attachedProcesses, creatorPid, bytes });
  }
  return rows;
}

/**
 * Segments nothing is attached to and whose creator is gone. They hold an ID until someone
 * removes them or the machine reboots, so they are the ones that can block a new server.
 */
export function staleSysVSegments(
  rows: readonly SysVSharedMemoryRow[],
  isPidAlive: (pid: number) => boolean,
): SysVSharedMemoryRow[] {
  return rows.filter((row) => row.attachedProcesses === 0 && !isPidAlive(row.creatorPid));
}

/**
 * Stale segments that are the size a PostgreSQL placeholder has. The size narrows the list to
 * what a killed test cluster is expected to leave, but it is a hint and not proof of who made a
 * segment: other programs can allocate the same size, so nothing here is removed on this basis.
 */
export function stalePostgresMarkers(
  rows: readonly SysVSharedMemoryRow[],
  isPidAlive: (pid: number) => boolean,
): SysVSharedMemoryRow[] {
  return staleSysVSegments(rows, isPidAlive).filter((row) => row.bytes === POSTGRES_MARKER_BYTES);
}

/** The FATAL line PostgreSQL prints when the kernel refuses to give it a shared memory ID. */
export function isSharedMemoryExhaustion(message: string): boolean {
  return (
    message.includes("could not create shared memory segment") &&
    (message.includes("No space left on device") || message.includes("ENOSPC"))
  );
}

/** Reads the live table. Empty on any other platform or when `ipcs` is unavailable. */
export async function readSysVSharedMemoryTable(): Promise<SysVSharedMemoryRow[]> {
  if (process.platform !== "darwin") return [];
  try {
    const { stdout } = await execFileAsync("ipcs", ["-m", "-a"], { timeout: 5_000 });
    return parseSysVSharedMemoryTable(stdout);
  } catch {
    return [];
  }
}

/** One line saying how full the table is, or null when there is nothing to report. */
export function describeSysVSharedMemory(
  rows: readonly SysVSharedMemoryRow[],
  isPidAlive: (pid: number) => boolean,
): string | null {
  if (rows.length === 0) return null;
  const stale = staleSysVSegments(rows, isPidAlive);
  return [
    `System V shared memory: ${rows.length} kernel IDs in use, ${stale.length} stale`,
    "(nothing attached, creator PID gone — left behind by servers that were killed instead of",
    "stopped). macOS keeps them until safely reclaimed or the machine reboots.",
    "For a dry run, use `pnpm ipc:sweep` (reports candidates and removes nothing).",
  ].join(" ");
}

/**
 * Calls `work` again while it keeps failing on a full shared memory table: on this machine
 * several runs share the IDs, so another run finishing can free one. Any other failure is
 * rethrown on the first attempt.
 */
export async function retryOnSharedMemoryExhaustion<T>(
  work: () => Promise<T>,
  options: {
    attempts?: number;
    delaysMs?: readonly number[];
    sleep?: (ms: number) => Promise<void>;
    onRetry?: (error: unknown, delayMs: number) => void;
  } = {},
): Promise<T> {
  const { attempts = 3, delaysMs = [5_000, 15_000], onRetry } = options;
  const sleep =
    options.sleep ?? ((ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)));
  const total = Math.max(1, attempts);
  let lastError: unknown;
  for (let attempt = 0; attempt < total; attempt += 1) {
    try {
      return await work();
    } catch (error) {
      lastError = error;
      const message = error instanceof Error ? error.message : String(error);
      if (!isSharedMemoryExhaustion(message)) throw error;
      const delayMs = delaysMs[attempt];
      if (delayMs === undefined) break;
      onRetry?.(error, delayMs);
      await sleep(delayMs);
    }
  }
  throw lastError;
}
