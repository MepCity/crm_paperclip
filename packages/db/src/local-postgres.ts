import type { ChildProcess } from "node:child_process";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import EmbeddedPostgres from "embedded-postgres";
import pg from "pg";
import { sweep } from "./ipc-sweep";
import { isPortFree, pickFreePort } from "./ports";
import {
  describeSysVSharedMemory,
  isSharedMemoryExhaustion,
  readSysVSharedMemoryTable,
  retryOnSharedMemoryExhaustion,
} from "./shared-memory";

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

  /** Splits server and initdb output into the lines the caller is given. */
  const toLines = (message: string): string[] =>
    message.split("\n").filter((line) => line.trim() !== "");

  // The retry note is reported to the caller only: it must not land in the log ring of the
  // attempt that follows it.
  const report = (message: string) => {
    for (const line of toLines(message)) options.onLog?.(line);
  };

  const startOnce = async (): Promise<LocalPostgres> => {
    // One ring per attempt. The composed error is what the retry classifies, so an older
    // attempt's shared memory line must never be carried into a newer failure's report.
    const tail: string[] = [];
    const onLog = (message: string) => {
      for (const line of toLines(message)) {
        tail.push(line);
        if (tail.length > 20) tail.shift();
        options.onLog?.(line);
      }
    };

    const port = options.port ?? (await pickFreePort());
    if (options.port !== undefined && !(await isPortFree(port))) {
      throw new Error(`port ${port} is already in use`);
    }

    const flags = Object.entries({ listen_addresses: HOST, ...options.settings }).flatMap(
      ([name, value]) => ["-c", `${name}=${value}`],
    );
    const server = new EmbeddedPostgres({
      databaseDir: dataDir,
      port,
      user: USER,
      password: PASSWORD,
      persistent: true,
      initdbFlags: UTF8_INITDB_FLAGS,
      postgresFlags: flags,
      onLog,
      onError: (error) => onLog(error instanceof Error ? error.message : String(error)),
    });

    try {
      if (!existsSync(join(dataDir, "PG_VERSION"))) await server.initialise();
      await server.start();
    } catch (error) {
      await server.stop().catch(() => undefined);
      const reason = error instanceof Error ? error.message : "server exited during start";
      throw new Error(`could not start local PostgreSQL: ${reason}\n${tail.join("\n")}`);
    }

    return {
      port,
      adopted: false,
      urlFor: (database) => connectionUrl(port, database),
      async stop() {
        // A Ctrl+C reaches the server directly (same process group) and it exits on its own;
        // embedded-postgres would then wait forever for an exit event it already missed.
        const child = (server as unknown as { process?: ChildProcess }).process;
        if (child && (child.exitCode !== null || child.signalCode !== null)) {
          (server as unknown as { process?: ChildProcess }).process = undefined;
          return;
        }
        await server.stop();
      },
    };
  };

  let swept = false;
  try {
    return await retryOnSharedMemoryExhaustion(startOnce, {
      onExhaustion: () => {
        if (swept || process.platform !== "darwin") return false;
        swept = true;
        const log = (line: string) => report(`[ipc-sweep] ${line}`);
        try {
          const result = sweep({ apply: true, log });
          if (result.exitCode !== 0) log("Sweep failed; continuing the server start retry flow.");
          return result.removed > 0;
        } catch (error) {
          log(`Sweep threw: ${String(error)}; continuing the server start retry flow.`);
          return false;
        }
      },
      onRetry: (_error, delayMs) =>
        report(`shared memory table is full, retrying the server start in ${delayMs} ms`),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!isSharedMemoryExhaustion(message)) throw error;
    // Every run on this machine shares one small kernel table, so the useful part of the
    // report is who is holding it: live servers finish and free their ID, stale ones do not.
    const pressure = describeSysVSharedMemory(await readSysVSharedMemoryTable(), isAlive);
    throw new Error(pressure ? `${message}\n${pressure}` : message);
  }
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
