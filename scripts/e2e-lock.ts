import { mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";

export const DEFAULT_E2E_LOCK_DIR = "/tmp/crm-e2e.lock";
const STALE_MS = 30 * 60 * 1000;
const FRESH_PIDLESS_MS = 10_000;
const POLL_MS = 2_000;
const DEFAULT_WAIT_MS = 20 * 60 * 1000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function e2eLockDir(): string {
  return process.env.MEP_E2E_LOCK_DIR ?? DEFAULT_E2E_LOCK_DIR;
}

export function isE2eLockEnabled(): boolean {
  return process.env.MEP_E2E_LOCK !== "0";
}

function waitBudgetMs(): number {
  const parsed = Number(process.env.MEP_E2E_LOCK_WAIT_MS ?? DEFAULT_WAIT_MS);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : DEFAULT_WAIT_MS;
}

export function isLockStale(pid: number, startedAtMs: number, now = Date.now()): boolean {
  if (now - startedAtMs > STALE_MS) return true;
  try {
    process.kill(pid, 0);
    return false;
  } catch (error) {
    const code = error && typeof error === "object" && "code" in error ? error.code : undefined;
    return code === "ESRCH";
  }
}

async function readLockInfo(dir: string): Promise<{ pid: number; startedAtMs: number } | null> {
  try {
    const pid = Number(await readFile(join(dir, "pid"), "utf8"));
    const startedAtMs = Number(await readFile(join(dir, "startedAt"), "utf8"));
    if (!Number.isFinite(pid) || !Number.isFinite(startedAtMs)) return null;
    return { pid, startedAtMs };
  } catch {
    return null;
  }
}

async function isPidlessLockOldEnough(dir: string): Promise<boolean> {
  try {
    const { mtimeMs } = await stat(dir);
    return Date.now() - mtimeMs >= FRESH_PIDLESS_MS;
  } catch {
    return true;
  }
}

async function tryCreateLock(dir: string): Promise<boolean> {
  try {
    await mkdir(dir);
    await writeFile(join(dir, "pid"), String(process.pid));
    await writeFile(join(dir, "startedAt"), String(Date.now()));
    const info = await readLockInfo(dir);
    return info?.pid === process.pid;
  } catch (error) {
    const code = error && typeof error === "object" && "code" in error ? error.code : undefined;
    if (code === "EEXIST") return false;
    throw error;
  }
}

async function removeStaleLock(dir: string): Promise<void> {
  const info = await readLockInfo(dir);
  if (!info) {
    if (!(await isPidlessLockOldEnough(dir))) return;
    await rm(dir, { recursive: true, force: true });
    return;
  }
  if (isLockStale(info.pid, info.startedAtMs)) {
    await rm(dir, { recursive: true, force: true });
  }
}

/** Releases the machine-wide lock when this process created it. */
export async function releaseE2eLock(): Promise<void> {
  const dir = e2eLockDir();
  try {
    const info = await readLockInfo(dir);
    if (info?.pid === process.pid) {
      await rm(dir, { recursive: true, force: true });
    }
  } catch {
    // Another run may have removed the lock already.
  }
}

export type AcquireE2eLockOptions = {
  /** When true, stop waiting and return `false` without holding the lock. */
  shouldStop?: () => boolean;
};

/**
 * Waits for the machine-wide E2E lock. Returns `true` only when this process created the
 * lock directory, so the caller knows whether it must release it. Returns `false` when
 * locking is disabled, the wait was stopped, the budget expired, or lock setup failed;
 * such a run continues without the lock.
 */
export async function acquireE2eLock(options?: AcquireE2eLockOptions): Promise<boolean> {
  if (!isE2eLockEnabled()) return false;

  const dir = e2eLockDir();
  const waitMs = waitBudgetMs();
  const waitStart = Date.now();
  let lastLogMs = 0;

  const lockLoop = async (): Promise<boolean> => {
    while (true) {
      if (options?.shouldStop?.()) return false;

      if (await tryCreateLock(dir)) {
        return true;
      }
      await removeStaleLock(dir);
      if (await tryCreateLock(dir)) {
        return true;
      }

      const waitedMs = Date.now() - waitStart;
      if (waitedMs >= waitMs) {
        console.log("e2e: lock wait timed out; continuing without the machine-wide lock");
        return false;
      }

      const info = await readLockInfo(dir);
      const ownerPid = info?.pid ?? "?";
      const elapsedSec = Math.floor(waitedMs / 1000);
      if (lastLogMs === 0 || Date.now() - lastLogMs >= 60_000) {
        console.log(`e2e: waiting for another run (pid ${ownerPid}, ${elapsedSec} s)`);
        lastLogMs = Date.now();
      }
      await sleep(POLL_MS);
    }
  };

  try {
    return await lockLoop();
  } catch {
    console.log("e2e: could not use machine-wide lock; continuing without it");
    return false;
  }
}
