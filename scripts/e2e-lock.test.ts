import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { acquireE2eLock, isLockStale, releaseE2eLock } from "./e2e-lock";

const STALE_MS = 30 * 60 * 1000;

describe("e2e machine-wide lock", () => {
  let lockRoot: string;
  let lockDir: string;

  beforeEach(async () => {
    lockRoot = await mkdtemp(join(tmpdir(), "crm-e2e-lock-test-"));
    lockDir = join(lockRoot, "lock");
    process.env.MEP_E2E_LOCK_DIR = lockDir;
    process.env.MEP_E2E_LOCK = "1";
    delete process.env.MEP_E2E_LOCK_WAIT_MS;
  });

  afterEach(async () => {
    await releaseE2eLock();
    delete process.env.MEP_E2E_LOCK_DIR;
    delete process.env.MEP_E2E_LOCK;
    delete process.env.MEP_E2E_LOCK_WAIT_MS;
    vi.restoreAllMocks();
  });

  it("acquires and releases the lock directory", async () => {
    const fs = await import("node:fs/promises");
    expect(await acquireE2eLock()).toBe(true);
    await expect(fs.access(lockDir)).resolves.toBeUndefined();
    await releaseE2eLock();
    await expect(fs.access(lockDir)).rejects.toThrow();
  });

  it("blocks a second acquirer until the first releases", async () => {
    expect(await acquireE2eLock()).toBe(true);
    let secondAcquired = false;
    const second = acquireE2eLock().then((held) => {
      secondAcquired = true;
      return held;
    });

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(secondAcquired).toBe(false);

    await releaseE2eLock();
    expect(await second).toBe(true);
  });

  it("takes over a lock whose owner pid is not running", async () => {
    const fs = await import("node:fs/promises");
    await fs.mkdir(lockDir);
    await fs.writeFile(join(lockDir, "pid"), "999999999");
    await fs.writeFile(join(lockDir, "startedAt"), String(Date.now()));

    expect(await acquireE2eLock()).toBe(true);
    await expect(fs.readFile(join(lockDir, "pid"), "utf8")).resolves.toBe(String(process.pid));
  });

  it("reports no lock when the wait budget expires", async () => {
    process.env.MEP_E2E_LOCK_WAIT_MS = "50";
    const fs = await import("node:fs/promises");
    const ownerPid = process.pid + 1;
    await fs.mkdir(lockDir);
    await fs.writeFile(join(lockDir, "pid"), String(ownerPid));
    await fs.writeFile(join(lockDir, "startedAt"), String(Date.now()));
    vi.spyOn(process, "kill").mockImplementation(() => {
      throw Object.assign(new Error("alive"), { code: "EPERM" });
    });

    expect(await acquireE2eLock()).toBe(false);
    await expect(fs.readFile(join(lockDir, "pid"), "utf8")).resolves.toBe(String(ownerPid));
  });

  it("does not remove another process lock on release", async () => {
    const fs = await import("node:fs/promises");
    await fs.mkdir(lockDir);
    await fs.writeFile(join(lockDir, "pid"), "424242");
    await fs.writeFile(join(lockDir, "startedAt"), String(Date.now()));

    await releaseE2eLock();
    await expect(fs.access(lockDir)).resolves.toBeUndefined();
  });

  it("treats missing owner and old locks as stale", () => {
    expect(isLockStale(999999999, Date.now())).toBe(true);
    expect(isLockStale(process.pid, Date.now() - STALE_MS - 1)).toBe(true);
  });

  it("does not take over a fresh lock directory without pid files", async () => {
    const fs = await import("node:fs/promises");
    await fs.mkdir(lockDir);
    process.env.MEP_E2E_LOCK_WAIT_MS = "80";

    expect(await acquireE2eLock()).toBe(false);
    await expect(fs.access(lockDir)).resolves.toBeUndefined();
  });

  it("takes over a pid-less lock directory after the grace period", async () => {
    const fs = await import("node:fs/promises");
    await fs.mkdir(lockDir);
    const elevenSecondsAgo = new Date(Date.now() - 11_000);
    await fs.utimes(lockDir, elevenSecondsAgo, elevenSecondsAgo);

    expect(await acquireE2eLock()).toBe(true);
    await expect(fs.readFile(join(lockDir, "pid"), "utf8")).resolves.toBe(String(process.pid));
  });

  it("reports no lock when the lock parent path is missing", async () => {
    process.env.MEP_E2E_LOCK_DIR = join(lockRoot, "missing", "nested", "lock");
    expect(await acquireE2eLock()).toBe(false);
  });

  it("reports no lock when shouldStop becomes true", async () => {
    const fs = await import("node:fs/promises");
    await fs.mkdir(lockDir);
    await fs.writeFile(join(lockDir, "pid"), String(process.pid + 1));
    await fs.writeFile(join(lockDir, "startedAt"), String(Date.now()));
    vi.spyOn(process, "kill").mockImplementation(() => {
      throw Object.assign(new Error("alive"), { code: "EPERM" });
    });

    let stop = false;
    setTimeout(() => {
      stop = true;
    }, 40);
    expect(await acquireE2eLock({ shouldStop: () => stop })).toBe(false);
    await expect(fs.access(lockDir)).resolves.toBeUndefined();
  });

  it("reports no lock when locking is disabled, and creates nothing", async () => {
    const fs = await import("node:fs/promises");
    process.env.MEP_E2E_LOCK = "0";

    expect(await acquireE2eLock()).toBe(false);
    await expect(fs.access(lockDir)).rejects.toThrow();
  });

  it("leaves another run's lock in place when locking is disabled", async () => {
    const fs = await import("node:fs/promises");
    process.env.MEP_E2E_LOCK = "0";
    await fs.mkdir(lockDir);
    await fs.writeFile(join(lockDir, "pid"), "424242");
    await fs.writeFile(join(lockDir, "startedAt"), String(Date.now()));

    expect(await acquireE2eLock()).toBe(false);
    await releaseE2eLock();
    await expect(fs.access(lockDir)).resolves.toBeUndefined();
  });
});
