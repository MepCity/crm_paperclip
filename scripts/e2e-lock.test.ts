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
    const release = await acquireE2eLock();
    await expect(fs.access(lockDir)).resolves.toBeUndefined();
    await release();
    await expect(fs.access(lockDir)).rejects.toThrow();
  });

  it("blocks a second acquirer until the first releases", async () => {
    const firstRelease = await acquireE2eLock();
    let secondAcquired = false;
    const second = acquireE2eLock().then(async (release) => {
      secondAcquired = true;
      await release();
    });

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(secondAcquired).toBe(false);

    await firstRelease();
    await second;
    expect(secondAcquired).toBe(true);
  });

  it("takes over a lock whose owner pid is not running", async () => {
    const fs = await import("node:fs/promises");
    await fs.mkdir(lockDir);
    await fs.writeFile(join(lockDir, "pid"), "999999999");
    await fs.writeFile(join(lockDir, "startedAt"), String(Date.now()));

    const release = await acquireE2eLock();
    await release();
  });

  it("continues without a lock when the wait budget expires", async () => {
    process.env.MEP_E2E_LOCK_WAIT_MS = "50";
    const fs = await import("node:fs/promises");
    await fs.mkdir(lockDir);
    await fs.writeFile(join(lockDir, "pid"), String(process.pid + 1));
    await fs.writeFile(join(lockDir, "startedAt"), String(Date.now()));
    vi.spyOn(process, "kill").mockImplementation(() => {
      throw Object.assign(new Error("alive"), { code: "EPERM" });
    });

    const release = await acquireE2eLock();
    expect(release).toBeTypeOf("function");
    await release();
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

    const release = await acquireE2eLock();
    expect(release).toBeTypeOf("function");
    await release();
    await expect(fs.access(lockDir)).resolves.toBeUndefined();
  });

  it("takes over a pid-less lock directory after the grace period", async () => {
    const fs = await import("node:fs/promises");
    await fs.mkdir(lockDir);
    const elevenSecondsAgo = new Date(Date.now() - 11_000);
    await fs.utimes(lockDir, elevenSecondsAgo, elevenSecondsAgo);

    const release = await acquireE2eLock();
    await expect(fs.readFile(join(lockDir, "pid"), "utf8")).resolves.toBe(String(process.pid));
    await release();
  });

  it("continues without a lock when the lock parent path is missing", async () => {
    process.env.MEP_E2E_LOCK_DIR = join(lockRoot, "missing", "nested", "lock");
    const release = await acquireE2eLock();
    expect(release).toBeTypeOf("function");
    await release();
  });

  it("stops waiting when shouldStop becomes true", async () => {
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
    const release = await acquireE2eLock({ shouldStop: () => stop });
    expect(release).toBeTypeOf("function");
    await release();
    await expect(fs.access(lockDir)).resolves.toBeUndefined();
  });
});
