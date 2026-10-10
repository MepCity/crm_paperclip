import { execFile } from "node:child_process";
import { userInfo } from "node:os";
import { promisify } from "node:util";
import { parseIpcTable, type Segment, selectOrphans } from "./sysv-ipc";

const execFileAsync = promisify(execFile);

/**
 * macOS hands out System V shared memory IDs from a small kernel table and does not take an
 * ID back when the process that created it dies. PostgreSQL asks for one 56-byte ID while
 * `initdb` runs its bootstrap script and again while a server is up, so every server that was
 * killed instead of stopped leaves one ID behind. When the table is full, `shmget` fails with
 * ENOSPC and no new cluster can be initialised on the machine — by any project.
 */
export type SysVSharedMemoryRow = Segment;

/** Size of the placeholder segment a PostgreSQL server asks the kernel for. */
export const POSTGRES_MARKER_BYTES = 56;

/** Reads the complete Darwin shared memory table, failing closed on invalid output. */
export function parseSysVSharedMemoryTable(
  output: string,
  now = Date.now(),
): SysVSharedMemoryRow[] {
  return parseIpcTable(output, now).rows;
}

/**
 * Segments nothing is attached to and whose creator is gone. They hold an ID until someone
 * removes them or the machine reboots, so they are the ones that can block a new server.
 */
export function staleSysVSegments(
  rows: readonly SysVSharedMemoryRow[],
  isPidAlive: (pid: number) => boolean,
): SysVSharedMemoryRow[] {
  return rows.filter((row) => row.nattch === 0 && !isPidAlive(row.cpid));
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
  return staleSysVSegments(rows, isPidAlive).filter((row) => row.size === POSTGRES_MARKER_BYTES);
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
  options: { owner?: string; now?: number } = {},
): string | null {
  if (rows.length === 0) return null;
  const stale = selectOrphans(
    { rows: [...rows] },
    {
      owner: options.owner ?? userInfo().username,
      now: options.now ?? Date.now(),
      deadPids: new Set(rows.filter((row) => !isPidAlive(row.cpid)).map((row) => row.cpid)),
    },
  ).filter((decision) => decision.selected);
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
