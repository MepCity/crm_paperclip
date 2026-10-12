import { describe, expect, it, vi } from "vitest";
import {
  enforceVitestGuard,
  evaluateVitestRun,
  isVitestCliProcess,
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

describe("isVitestCliProcess", () => {
  it("detects node launching vitest script", () => {
    expect(isVitestCliProcess(["node", "node_modules/vitest/vitest.mjs"])).toBe(true);
    expect(isVitestCliProcess(["node", "node_modules/.bin/vitest"])).toBe(true);
    expect(isVitestCliProcess(["node", "/usr/local/bin/vitest"])).toBe(true);
  });

  it("detects direct vitest binary invocation", () => {
    expect(isVitestCliProcess(["vitest", "run"])).toBe(true);
    expect(isVitestCliProcess(["/usr/local/bin/vitest", "watch"])).toBe(true);
  });

  it("treats raw CLI argument arrays as vitest invocations", () => {
    expect(isVitestCliProcess([])).toBe(true);
    expect(isVitestCliProcess(["watch"])).toBe(true);
    expect(isVitestCliProcess(["run"])).toBe(true);
    expect(isVitestCliProcess(["--watch"])).toBe(true);
  });

  it("returns false for other scripts importing the config via node", () => {
    expect(isVitestCliProcess(["node", "scripts/inspect-config.ts"])).toBe(false);
    expect(isVitestCliProcess(["node", "scripts/typecheck.mjs"])).toBe(false);
    expect(isVitestCliProcess(["node", "/workspace/tools/runner.js"])).toBe(false);
    expect(isVitestCliProcess(["node"])).toBe(false);
  });
});

describe("evaluateVitestRun", () => {
  describe("unfiltered run rejection", () => {
    it("rejects empty args (pnpm exec vitest)", () => {
      const result = evaluateVitestRun([], {});
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe(VITEST_GUARD_MESSAGE);
    });

    it("rejects plain 'run' without filters", () => {
      const result = evaluateVitestRun(["run"], {});
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe(VITEST_GUARD_MESSAGE);
    });

    it("rejects plain 'watch' without filters", () => {
      const result = evaluateVitestRun(["watch"], {});
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe(VITEST_GUARD_MESSAGE);
    });

    it("rejects plain 'dev' without filters", () => {
      const result = evaluateVitestRun(["dev"], {});
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe(VITEST_GUARD_MESSAGE);
    });

    it("rejects '--watch' flag without filters", () => {
      const result = evaluateVitestRun(["--watch"], {});
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe(VITEST_GUARD_MESSAGE);
    });

    it("rejects '--run' flag without filters", () => {
      const result = evaluateVitestRun(["--run"], {});
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe(VITEST_GUARD_MESSAGE);
    });

    it("rejects full process.argv for vitest without filters", () => {
      expect(evaluateVitestRun(["node", "node_modules/vitest/vitest.mjs"], {}).allowed).toBe(false);
      expect(evaluateVitestRun(["node", "node_modules/vitest/vitest.mjs", "run"], {}).allowed).toBe(
        false,
      );
      expect(
        evaluateVitestRun(["node", "node_modules/vitest/vitest.mjs", "watch"], {}).allowed,
      ).toBe(false);
    });

    it("rejects '--exclude' option without a filter target", () => {
      expect(evaluateVitestRun(["run", "--exclude", "foo"], {}).allowed).toBe(false);
      expect(evaluateVitestRun(["run", "--exclude=foo"], {}).allowed).toBe(false);
      expect(evaluateVitestRun(["--exclude", "foo"], {}).allowed).toBe(false);
      expect(evaluateVitestRun(["--exclude=foo"], {}).allowed).toBe(false);
    });

    it("rejects non-filter options without a filter target", () => {
      expect(evaluateVitestRun(["--reporter", "verbose"], {}).allowed).toBe(false);
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
    it("allows a single file path filter across execution modes", () => {
      expect(evaluateVitestRun(["scripts/vitest-guard.test.ts"], {}).allowed).toBe(true);
      expect(evaluateVitestRun(["run", "scripts/vitest-guard.test.ts"], {}).allowed).toBe(true);
      expect(evaluateVitestRun(["watch", "scripts/vitest-guard.test.ts"], {}).allowed).toBe(true);
      expect(evaluateVitestRun(["dev", "scripts/vitest-guard.test.ts"], {}).allowed).toBe(true);
      expect(evaluateVitestRun(["--watch", "scripts/vitest-guard.test.ts"], {}).allowed).toBe(true);
    });

    it("allows a name filter string", () => {
      expect(evaluateVitestRun(["tokens"], {}).allowed).toBe(true);
      expect(evaluateVitestRun(["run", "tokens"], {}).allowed).toBe(true);
      expect(evaluateVitestRun(["watch", "tokens"], {}).allowed).toBe(true);
    });

    it("allows positional paths following non-filter options", () => {
      expect(
        evaluateVitestRun(["--reporter", "verbose", "scripts/vitest-guard.test.ts"], {}).allowed,
      ).toBe(true);
      expect(
        evaluateVitestRun(["run", "--reporter", "verbose", "scripts/vitest-guard.test.ts"], {})
          .allowed,
      ).toBe(true);
    });

    it("allows positional paths following '--exclude'", () => {
      expect(
        evaluateVitestRun(["run", "--exclude", "foo", "scripts/vitest-guard.test.ts"], {}).allowed,
      ).toBe(true);
      expect(evaluateVitestRun(["--exclude=foo", "scripts/vitest-guard.test.ts"], {}).allowed).toBe(
        true,
      );
    });

    it("allows positional paths following '--'", () => {
      expect(evaluateVitestRun(["run", "--", "scripts/vitest-guard.test.ts"], {}).allowed).toBe(
        true,
      );
      expect(evaluateVitestRun(["--", "scripts/vitest-guard.test.ts"], {}).allowed).toBe(true);
    });

    it("allows test name patterns with '-t' across modes", () => {
      expect(evaluateVitestRun(["-t", "guard test"], {}).allowed).toBe(true);
      expect(evaluateVitestRun(["run", "-t", "guard test"], {}).allowed).toBe(true);
      expect(evaluateVitestRun(["run", "-t=guard test"], {}).allowed).toBe(true);
      expect(evaluateVitestRun(["watch", "-t", "guard test"], {}).allowed).toBe(true);
      expect(evaluateVitestRun(["dev", "-t", "guard test"], {}).allowed).toBe(true);
      expect(evaluateVitestRun(["--watch", "-t", "guard test"], {}).allowed).toBe(true);
      expect(evaluateVitestRun(["--reporter", "verbose", "-t", "guard test"], {}).allowed).toBe(
        true,
      );
    });

    it("allows test name patterns with '--testNamePattern' and '--test-name-pattern'", () => {
      expect(evaluateVitestRun(["run", "--testNamePattern", "pattern"], {}).allowed).toBe(true);
      expect(evaluateVitestRun(["run", "--testNamePattern=pattern"], {}).allowed).toBe(true);
      expect(evaluateVitestRun(["run", "--test-name-pattern", "pattern"], {}).allowed).toBe(true);
      expect(evaluateVitestRun(["run", "--test-name-pattern=pattern"], {}).allowed).toBe(true);
    });

    it("allows project filters with '--project' and '-p' across modes", () => {
      expect(evaluateVitestRun(["--project", "unit"], {}).allowed).toBe(true);
      expect(evaluateVitestRun(["run", "--project", "unit"], {}).allowed).toBe(true);
      expect(evaluateVitestRun(["run", "--project=unit"], {}).allowed).toBe(true);
      expect(evaluateVitestRun(["watch", "--project", "unit"], {}).allowed).toBe(true);
      expect(evaluateVitestRun(["dev", "--project", "unit"], {}).allowed).toBe(true);
      expect(evaluateVitestRun(["--watch", "--project", "unit"], {}).allowed).toBe(true);
      expect(evaluateVitestRun(["--reporter", "verbose", "--project", "unit"], {}).allowed).toBe(
        true,
      );
      expect(evaluateVitestRun(["run", "-p", "unit"], {}).allowed).toBe(true);
      expect(evaluateVitestRun(["run", "-p=unit"], {}).allowed).toBe(true);
    });

    it("allows git changed filters with '--changed' and '--since'", () => {
      expect(evaluateVitestRun(["run", "--changed"], {}).allowed).toBe(true);
      expect(evaluateVitestRun(["watch", "--changed"], {}).allowed).toBe(true);
      expect(evaluateVitestRun(["run", "--changed=HEAD~1"], {}).allowed).toBe(true);
      expect(evaluateVitestRun(["run", "--changed", "HEAD~1"], {}).allowed).toBe(true);
      expect(evaluateVitestRun(["run", "--since", "HEAD~1"], {}).allowed).toBe(true);
      expect(evaluateVitestRun(["run", "--since=HEAD~1"], {}).allowed).toBe(true);
      expect(evaluateVitestRun(["run", "--changed-since=HEAD~1"], {}).allowed).toBe(true);
    });

    it("allows '--filter' flag", () => {
      expect(evaluateVitestRun(["run", "--filter", "suite"], {}).allowed).toBe(true);
      expect(evaluateVitestRun(["run", "--filter=suite"], {}).allowed).toBe(true);
    });
  });

  describe("exempt commands and flags", () => {
    it("allows exempt commands", () => {
      expect(evaluateVitestRun(["bench"], {}).allowed).toBe(true);
      expect(evaluateVitestRun(["related", "scripts/vitest-guard.ts"], {}).allowed).toBe(true);
      expect(evaluateVitestRun(["list"], {}).allowed).toBe(true);
      expect(evaluateVitestRun(["init", "my-project"], {}).allowed).toBe(true);
    });

    it("allows help and version flags", () => {
      expect(evaluateVitestRun(["--help"], {}).allowed).toBe(true);
      expect(evaluateVitestRun(["-h"], {}).allowed).toBe(true);
      expect(evaluateVitestRun(["--version"], {}).allowed).toBe(true);
      expect(evaluateVitestRun(["-v"], {}).allowed).toBe(true);
      expect(evaluateVitestRun(["run", "--help"], {}).allowed).toBe(true);
      expect(evaluateVitestRun(["watch", "-v"], {}).allowed).toBe(true);
    });
  });

  describe("non-vitest processes", () => {
    it("allows scripts importing vitest.config.ts when not invoked via vitest CLI", () => {
      expect(evaluateVitestRun(["node", "scripts/inspect-config.ts"], {}).allowed).toBe(true);
      expect(evaluateVitestRun(["node", "scripts/typecheck.mjs"], {}).allowed).toBe(true);
      expect(evaluateVitestRun(["node", "/workspace/tools/runner.js"], {}).allowed).toBe(true);
      expect(evaluateVitestRun(["node", "scripts/build.ts", "run"], {}).allowed).toBe(true);
    });
  });

  describe("environment variable handling", () => {
    it("allows unfiltered run when MEP_FULL_SUITE=1 across commands", () => {
      expect(evaluateVitestRun([], { MEP_FULL_SUITE: "1" }).allowed).toBe(true);
      expect(evaluateVitestRun(["run"], { MEP_FULL_SUITE: "1" }).allowed).toBe(true);
      expect(evaluateVitestRun(["watch"], { MEP_FULL_SUITE: "1" }).allowed).toBe(true);
      expect(evaluateVitestRun(["dev"], { MEP_FULL_SUITE: "1" }).allowed).toBe(true);
      expect(evaluateVitestRun(["--watch"], { MEP_FULL_SUITE: "1" }).allowed).toBe(true);
      expect(evaluateVitestRun(["--reporter", "verbose"], { MEP_FULL_SUITE: "1" }).allowed).toBe(
        true,
      );
    });

    it("rejects unfiltered run when MEP_FULL_SUITE is '0' or unset", () => {
      expect(evaluateVitestRun([], { MEP_FULL_SUITE: "0" }).allowed).toBe(false);
      expect(evaluateVitestRun(["run"], { MEP_FULL_SUITE: "0" }).allowed).toBe(false);
      expect(evaluateVitestRun(["watch"], { MEP_FULL_SUITE: "0" }).allowed).toBe(false);
      expect(evaluateVitestRun(["dev"], { MEP_FULL_SUITE: "0" }).allowed).toBe(false);
      expect(evaluateVitestRun(["--watch"], { MEP_FULL_SUITE: "0" }).allowed).toBe(false);
      expect(evaluateVitestRun(["run"], {}).allowed).toBe(false);
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

  it("exits with 1 when empty argv is rejected", () => {
    const exitMock = vi.fn();
    const errorMock = vi.fn();

    enforceVitestGuard([], {}, exitMock, errorMock);

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
