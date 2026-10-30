import { afterEach, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

it.each([undefined, "", "1", "true"])(
  "enables JSON and CI annotations only with CI=%s",
  async (ci) => {
    vi.resetModules();
    vi.stubEnv("CI", ci);
    vi.stubEnv("E2E_PORT", "3456");
    const { default: config } = await import("../../apps/web/playwright.config");
    expect(config.reporter).toEqual(ci ? [["list"], ["github"], ["html"], ["json"]] : [["list"]]);
  },
);
