import { describe, expect, it, vi } from "vitest";
import {
  enforceVitestGuard,
  evaluateVitestRun,
  normalizeArgs,
  VITEST_GUARD_MESSAGE,
} from "./vitest-guard";

describe("normalizeArgs", () => {
  it("strips node and vitest binary from full process.argv", () => {
    expect(
      normalizeArgs([
        "node",
        "node_modules/vitest/vitest.mjs",
        "run",
        "scripts/vitest-guard.test.ts",
      ]),
    ).toEqual(["run", "scripts/vitest-guard.test.ts"]);
  });

  it("strips vitest binary if invoked directly", () => {
    expect(normalizeArgs(["vitest", "run", "--project", "unit"])).toEqual([
      "run",
      "--project",
      "unit",
    ]);
  });

  it("leaves already-stripped CLI args intact", () => {
    expect(normalizeArgs(["run", "-t", "guard"])).toEqual(["run", "-t", "guard"]);
  });

  it("handles empty argument array", () => {
    expect(normalizeArgs([])).toEqual([]);
  });
});

describe("evaluateVitestRun", () => {
  describe("unfiltered run rejection", () => {
    it("rejects plain 'run' without filters when MEP_FULL_SUITE is absent", () => {
      const result = evaluateVitestRun(["run"], {});
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe(VITEST_GUARD_MESSAGE);
    });

    it("rejects full process.argv for 'vitest run' without filters", () => {
      const result = evaluateVitestRun(["node", "node_modules/vitest/vitest.mjs", "run"], {});
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe(VITEST_GUARD_MESSAGE);
    });

    it("rejects '--run' flag without filters", () => {
      const result = evaluateVitestRun(["--run"], {});
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe(VITEST_GUARD_MESSAGE);
    });

    it("rejects non-filter options without a filter target", () => {
      expect(evaluateVitestRun(["run", "--reporter", "verbose"], {}).allowed).toBe(false);
      expect(evaluateVitestRun(["run", "--reporter=verbose"], {}).allowed).toBe(false);
      expect(evaluateVitestRun(["run", "--config", "vitest.config.ts"], {}).allowed).toBe(false);
      expect(evaluateVitestRun(["run", "--config=vitest.config.ts"], {}).allowed).toBe(false);
      expect(evaluateVitestRun(["run", "--bail", "1"], {}).allowed).toBe(false);
      expect(evaluateVitestRun(["run", "--passWithNoTests"], {}).allowed).toBe(false);
      expect(evaluateVitestRun(["run", "--"], {}).allowed).toBe(false);
    });
  });

  describe("filter allowances", () => {
    it("allows a single file path filter", () => {
      const result = evaluateVitestRun(["run", "scripts/e2e-lock.test.ts"], {});
      expect(result.allowed).toBe(true);
    });

    it("allows a name filter string", () => {
      const result = evaluateVitestRun(["run", "tokens"], {});
      expect(result.allowed).toBe(true);
    });

    it("allows positional paths following non-filter options", () => {
      const result = evaluateVitestRun(
        ["run", "--reporter", "verbose", "scripts/vitest-guard.test.ts"],
        {},
      );
      expect(result.allowed).toBe(true);
    });

    it("allows positional paths following '--'", () => {
      const result = evaluateVitestRun(["run", "--", "scripts/vitest-guard.test.ts"], {});
      expect(result.allowed).toBe(true);
    });

    it("allows test name patterns with '-t'", () => {
      expect(evaluateVitestRun(["run", "-t", "guard test"], {}).allowed).toBe(true);
      expect(evaluateVitestRun(["run", "-t=guard test"], {}).allowed).toBe(true);
    });

    it("allows test name patterns with '--testNamePattern' and '--test-name-pattern'", () => {
      expect(evaluateVitestRun(["run", "--testNamePattern", "pattern"], {}).allowed).toBe(true);
      expect(evaluateVitestRun(["run", "--testNamePattern=pattern"], {}).allowed).toBe(true);
      expect(evaluateVitestRun(["run", "--test-name-pattern", "pattern"], {}).allowed).toBe(true);
      expect(evaluateVitestRun(["run", "--test-name-pattern=pattern"], {}).allowed).toBe(true);
    });

    it("allows project filters with '--project' and '-p'", () => {
      expect(evaluateVitestRun(["run", "--project", "unit"], {}).allowed).toBe(true);
      expect(evaluateVitestRun(["run", "--project=unit"], {}).allowed).toBe(true);
      expect(evaluateVitestRun(["run", "-p", "unit"], {}).allowed).toBe(true);
      expect(evaluateVitestRun(["run", "-p=unit"], {}).allowed).toBe(true);
    });

    it("allows git changed filters with '--changed' and '--since'", () => {
      expect(evaluateVitestRun(["run", "--changed"], {}).allowed).toBe(true);
      expect(evaluateVitestRun(["run", "--changed=HEAD~1"], {}).allowed).toBe(true);
      expect(evaluateVitestRun(["run", "--changed", "HEAD~1"], {}).allowed).toBe(true);
      expect(evaluateVitestRun(["run", "--since", "HEAD~1"], {}).allowed).toBe(true);
      expect(evaluateVitestRun(["run", "--since=HEAD~1"], {}).allowed).toBe(true);
    });

    it("allows '--filter' flag", () => {
      expect(evaluateVitestRun(["run", "--filter", "suite"], {}).allowed).toBe(true);
      expect(evaluateVitestRun(["run", "--filter=suite"], {}).allowed).toBe(true);
    });
  });

  describe("environment variable handling", () => {
    it("allows unfiltered run when MEP_FULL_SUITE=1", () => {
      const result = evaluateVitestRun(["run"], { MEP_FULL_SUITE: "1" });
      expect(result.allowed).toBe(true);
    });

    it("allows full suite run with options when MEP_FULL_SUITE=1", () => {
      const result = evaluateVitestRun(["run", "--reporter", "verbose"], {
        MEP_FULL_SUITE: "1",
      });
      expect(result.allowed).toBe(true);
    });

    it("rejects unfiltered run when MEP_FULL_SUITE is '0' or unset", () => {
      expect(evaluateVitestRun(["run"], { MEP_FULL_SUITE: "0" }).allowed).toBe(false);
      expect(evaluateVitestRun(["run"], {}).allowed).toBe(false);
    });
  });

  describe("non-run modes", () => {
    it("does not block invocations outside of run mode", () => {
      expect(evaluateVitestRun([], {}).allowed).toBe(true);
      expect(evaluateVitestRun(["watch"], {}).allowed).toBe(true);
      expect(evaluateVitestRun(["bench"], {}).allowed).toBe(true);
    });
  });
});

describe("enforceVitestGuard", () => {
  it("exits with 1 and logs the guard message when run is rejected", () => {
    const exitMock = vi.fn();
    const errorMock = vi.fn();

    enforceVitestGuard(["run"], {}, exitMock, errorMock);

    expect(errorMock).toHaveBeenCalledWith(VITEST_GUARD_MESSAGE);
    expect(exitMock).toHaveBeenCalledWith(1);
  });

  it("does not exit or log when run is allowed", () => {
    const exitMock = vi.fn();
    const errorMock = vi.fn();

    enforceVitestGuard(["run", "scripts/vitest-guard.test.ts"], {}, exitMock, errorMock);

    expect(errorMock).not.toHaveBeenCalled();
    expect(exitMock).not.toHaveBeenCalled();
  });
});
