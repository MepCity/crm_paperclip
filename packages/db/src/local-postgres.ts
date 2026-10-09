import type { ChildProcess } from "node:child_process";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import EmbeddedPostgres from "embedded-postgres";
import pg from "pg";
import { isPortFree, pickFreePort } from "./ports";

const USER = "postgres";
const PASSWORD = "postgres";
const HOST = "127.0.0.1";

// initdb otherwise follows libc locale from the environment (e.g. LATIN1 under
// ISO-8859-1), which conflicts with --encoding=UTF8. ICU collations such as
// und-x-icu exist only for UTF-8, so libc locale is pinned to C and ICU to und.
const UTF8_INITDB_FLAGS = [
  "--encoding=UTF8",
  "--locale=C",
  "--locale-provider=icu",
  "--icu-locale=und",
];

// macOS caps SysV IPC identifiers at kern.sysv.shmmni (32 on this shared machine). PostgreSQL
// takes one identifier per instance whichever shared_memory_type it uses: measured on a default
// (mmap) postmaster it is a 56-byte marker segment, released by a clean shutdown and kept forever
// by a postmaster that is killed. With the table full a cluster fails to start on "could not
// create shared memory segment: No space left on device", in initdb's bootstrap run or in the
// postmaster itself.

/**
 * Only the identifier failure is retried, and only briefly: the waits stay under the integration
 * project's 60s hook timeout and help when another run's cluster is shutting down. Identifiers
 * leaked by killed postmasters do not come back on their own.
 */
const IPC_RETRY_DELAYS_MS = [5_000, 10_000, 20_000];

const IPC_EXHAUSTION_HINT =
  "This host is out of SysV IPC identifiers (kern.sysv.shmmni). Retrying only helps while another " +
  "cluster is shutting down: identifiers leaked by killed postmasters are never reclaimed by waiting " +
  "and must be released (ipcrm) or the limit raised.";

function toFlags(settings: Record<string, string>): string[] {
  return Object.entries(settings).flatMap(([name, value]) => ["-c", `${name}=${value}`]);
}

/** initdb arguments. No shared memory setting is passed: both implementations take one SysV
 *  identifier for their marker segment, so the choice does not relieve the identifier table. */
export function buildInitdbFlags(): string[] {
  return [...UTF8_INITDB_FLAGS];
}

/** `-c name=value` server arguments. A caller's setting wins over the default. */
export function buildServerFlags(settings: Record<string, string> = {}): string[] {
  return toFlags({ listen_addresses: HOST, ...settings });
}

/** True when PostgreSQL failed because machine-wide SysV identifiers are taken. */
export function isIpcExhausted(message: string): boolean {
  return /could not create (shared memory segment|semaphore set)/.test(message);
}

function realSleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** The parts of an embedded-postgres instance this module drives. */
export type ClusterStart = {
  initialise(): Promise<void>;
  start(): Promise<void>;
  stop(): Promise<void>;
  /** Postmaster child process; embedded-postgres sets it while the cluster is running. */
  process?: ChildProcess;
};

/**
 * Text of a failed attempt. embedded-postgres rejects start() with no arguments when the
 * postmaster exits early, so there is often no reason to report but this placeholder.
 */
export function failureReason(error: unknown): string {
  return error instanceof Error && error.message !== ""
    ? error.message
    : "server exited during start";
}

/**
 * Stops a cluster, tolerating one that is already gone: a Ctrl+C reaches the postmaster directly
 * (same process group) and a failed start can end it too, after which embedded-postgres would
 * wait forever for an exit event it already missed.
 */
export async function stopCluster(cluster: ClusterStart): Promise<void> {
  const child = cluster.process;
  if (child && (child.exitCode !== null || child.signalCode !== null)) {
    cluster.process = undefined;
    return;
  }
  await cluster.stop();
}

export type ClusterStartResult =
  | { ok: true; cluster: ClusterStart; attempts: number }
  | { ok: false; reason: string; ipcExhausted: boolean; attempts: number };

/**
 * Creates, initialises and starts a cluster, retrying up to `retryDelaysMs.length` times while
 * the failure is a taken SysV identifier. Other failures stop after the first attempt. Every
 * failed attempt is cleaned up before the next one. `isIpcExhausted` is given the attempt's
 * reason; callers also inspect the server output they collect, because a postmaster that dies
 * during start leaves its FATAL line only there.
 */
export async function startClusterWithIpcRetry(options: {
  create: () => ClusterStart;
  needsInitialise: () => boolean;
  isIpcExhausted: (reason: string) => boolean;
  retryDelaysMs?: number[];
  sleep?: (ms: number) => Promise<void>;
  onRetry?: (info: { attempt: number; delayMs: number; reason: string }) => void;
}): Promise<ClusterStartResult> {
  const delays = options.retryDelaysMs ?? IPC_RETRY_DELAYS_MS;
  const sleep = options.sleep ?? realSleep;
  let attempts = 0;

  for (;;) {
    attempts += 1;
    const cluster = options.create();
    try {
      if (options.needsInitialise()) await cluster.initialise();
      await cluster.start();
      return { ok: true, cluster, attempts };
    } catch (error) {
      const reason = failureReason(error);
      await stopCluster(cluster).catch(() => undefined);
      const exhausted = options.isIpcExhausted(reason);
      const delayMs = delays[attempts - 1];
      if (!exhausted || delayMs === undefined) {
        return { ok: false, reason, ipcExhausted: exhausted, attempts };
      }
      options.onRetry?.({ attempt: attempts, delayMs, reason });
      await sleep(delayMs);
    }
  }
}

/** Message for a cluster that never started, with the kernel-limit hint when identifiers ran out. */
export function startFailureMessage(
  reason: string,
  tail: string[],
  ipcExhausted: boolean,
  attempts: number,
): string {
  const prefix = attempts > 1 ? `${attempts} attempts failed: ` : "";
  const hint = ipcExhausted ? `\n${IPC_EXHAUSTION_HINT}` : "";
  return `could not start local PostgreSQL: ${prefix}${reason}\n${tail.join("\n")}${hint}`;
}

const failureExitGuard = Symbol.for("crm.failureExitGuard");

/**
 * embedded-postgres registers async-exit-hook at import. That hook's beforeExit
 * listener always finishes by calling process.exit(0). Vitest stores a failed
 * run on process.exitCode and lets the event loop drain, so the listener reports
 * success. The hook still stops the cluster; a non-zero code already recorded
 * on the process is kept.
 */
function preserveFailureExitCode(): void {
  const current = process.exit as typeof process.exit & { [failureExitGuard]?: true };
  if (current[failureExitGuard]) return;
  const realExit = process.exit.bind(process);
  const guarded = ((code?: number) => {
    const recorded = process.exitCode;
    if ((code === undefined || code === 0) && typeof recorded === "number" && recorded !== 0) {
      return realExit(recorded);
    }
    return code === undefined ? realExit() : realExit(code);
  }) as typeof process.exit & { [failureExitGuard]?: true };
  guarded[failureExitGuard] = true;
  process.exit = guarded;
}

preserveFailureExitCode();

export type LocalPostgresOptions = {
  /** Cluster data directory. Created and initialised on first use. */
  dataDir: string;
  /** Fixed port. Default: a free port chosen by the OS. */
  port?: number;
  /** Extra `-c name=value` server settings. */
  settings?: Record<string, string>;
  /** Receives server and initdb output. Default: discarded (kept for error messages). */
  onLog?: (line: string) => void;
};

export type LocalPostgres = {
  port: number;
  /** True when a server already running on the data directory was reused. */
  adopted: boolean;
  /** Connection string for a database on this cluster. */
  urlFor(database: string): string;
  stop(): Promise<void>;
};

export function connectionUrl(port: number, database: string): string {
  return `postgres://${USER}:${PASSWORD}@${HOST}:${port}/${encodeURIComponent(database)}`;
}

/** Parses the first lines of `postmaster.pid`: line 1 is the PID, line 4 the port. */
export function parsePostmasterPid(contents: string): { pid: number; port: number } | null {
  const lines = contents.split("\n");
  const pid = Number.parseInt(lines[0] ?? "", 10);
  const port = Number.parseInt(lines[3] ?? "", 10);
  if (!Number.isInteger(pid) || pid <= 0 || !Number.isInteger(port) || port <= 0) return null;
  return { pid, port };
}

function isAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return (error as NodeJS.ErrnoException).code === "EPERM";
  }
}

async function waitForExit(pid: number, timeoutMs: number): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (isAlive(pid)) {
    if (Date.now() > deadline) throw new Error(`postgres process ${pid} did not stop in time`);
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
}

async function runningServer(dataDir: string): Promise<{ pid: number; port: number } | null> {
  const pidFile = join(dataDir, "postmaster.pid");
  if (!existsSync(pidFile)) return null;
  const parsed = parsePostmasterPid(await readFile(pidFile, "utf8"));
  return parsed && isAlive(parsed.pid) ? parsed : null;
}

/**
 * Starts (or re-attaches to) an embedded PostgreSQL server on `dataDir`.
 * Each call owns its own data directory; use different directories for parallel servers.
 */
export async function startLocalPostgres(options: LocalPostgresOptions): Promise<LocalPostgres> {
  const { dataDir } = options;

  const existing = await runningServer(dataDir);
  if (existing) {
    return {
      port: existing.port,
      adopted: true,
      urlFor: (database) => connectionUrl(existing.port, database),
      async stop() {
        process.kill(existing.pid, "SIGINT");
        await waitForExit(existing.pid, 30_000);
      },
    };
  }

  const tail: string[] = [];
  const onLog = (message: string) => {
    for (const line of message.split("\n")) {
      if (line.trim() === "") continue;
      tail.push(line);
      if (tail.length > 20) tail.shift();
      options.onLog?.(line);
    }
  };

  const port = options.port ?? (await pickFreePort());
  if (options.port !== undefined && !(await isPortFree(port))) {
    throw new Error(`port ${port} is already in use`);
  }

  const flags = buildServerFlags(options.settings);
  const createCluster = (): ClusterStart =>
    new EmbeddedPostgres({
      databaseDir: dataDir,
      port,
      user: USER,
      password: PASSWORD,
      persistent: true,
      initdbFlags: buildInitdbFlags(),
      postgresFlags: flags,
      onLog,
      onError: (error) => onLog(error instanceof Error ? error.message : String(error)),
    }) as unknown as ClusterStart;

  const serverOutput = () => tail.join("\n");
  const started = await startClusterWithIpcRetry({
    create: createCluster,
    needsInitialise: () => !existsSync(join(dataDir, "PG_VERSION")),
    isIpcExhausted: (reason) => isIpcExhausted(reason) || isIpcExhausted(serverOutput()),
    onRetry: ({ attempt, delayMs }) =>
      onLog(`SysV IPC identifiers are taken, retrying attempt ${attempt + 1} in ${delayMs}ms`),
  });
  if (!started.ok) {
    throw new Error(
      startFailureMessage(started.reason, tail, started.ipcExhausted, started.attempts),
    );
  }

  const cluster = started.cluster;
  return {
    port,
    adopted: false,
    urlFor: (database) => connectionUrl(port, database),
    stop: () => stopCluster(cluster),
  };
}

/** Creates the database when it does not exist yet. */
export async function ensureDatabase(adminUrl: string, name: string): Promise<void> {
  const client = new pg.Client({ connectionString: adminUrl });
  await client.connect();
  try {
    const found = await client.query("select 1 from pg_database where datname = $1", [name]);
    if (found.rowCount === 0) {
      await client.query(`create database ${client.escapeIdentifier(name)}`);
    }
  } finally {
    await client.end();
  }
}
