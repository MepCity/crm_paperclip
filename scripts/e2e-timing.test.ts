import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, expect, it, vi } from "vitest";
import { timeE2eStage } from "./e2e-timing";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

it("publishes stage timing in public Actions annotations", async () => {
  vi.stubEnv("GITHUB_ACTIONS", "true");
  vi.stubEnv("GITHUB_STEP_SUMMARY", "");
  const log = vi.spyOn(console, "log").mockImplementation(() => {});
  await timeE2eStage("next build", async () => 0);
  expect(log).toHaveBeenCalledWith(
    expect.stringMatching(/^::notice title=E2E stage timing::next build: \d+\.\d s$/),
  );
});

it("preserves the stage result without a CI summary", async () => {
  vi.stubEnv("GITHUB_STEP_SUMMARY", "");
  expect(await timeE2eStage("build", async () => 7)).toBe(7);
});

it("records elapsed time even when a stage fails and preserves its failure", async () => {
  const dir = await mkdtemp(join(tmpdir(), "e2e-timing-"));
  const summary = join(dir, "summary.md");
  vi.stubEnv("GITHUB_STEP_SUMMARY", summary);
  const error = new Error("browser failed");
  try {
    await expect(
      timeE2eStage("playwright", async () => {
        throw error;
      }),
    ).rejects.toBe(error);
    expect(await readFile(summary, "utf8")).toMatch(/^- playwright: \d+\.\d s\n$/);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
});
