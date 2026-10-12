import { basename } from "node:path";

export const VITEST_GUARD_MESSAGE =
  "Unfiltered Vitest runs are blocked to protect shared machine resources. Use targeted tests instead: pnpm exec vitest run <paths or name filter>";

const FILTER_FLAGS = new Set([
  "-t",
  "--testNamePattern",
  "--test-name-pattern",
  "-p",
  "--project",
  "--changed",
  "--since",
  "--changedSince",
  "--changed-since",
  "--filter",
]);

const EXEMPT_FLAGS = new Set(["-h", "--help", "-v", "--version"]);

const EXEMPT_COMMANDS = new Set(["related", "bench", "list", "init"]);

const GUARDED_COMMANDS = new Set(["run", "watch", "dev"]);

const OPTIONS_WITH_VALUE = new Set([
  "-c",
  "--config",
  "-r",
  "--root",
  "-R",
  "--reporter",
  "--reporters",
  "--outputFile",
  "--output-file",
  "--exclude",
  "--pool",
  "--poolOptions",
  "--pool-options",
  "--maxWorkers",
  "--max-workers",
  "--minWorkers",
  "--min-workers",
  "--testTimeout",
  "--test-timeout",
  "--hookTimeout",
  "--hook-timeout",
  "--teardownTimeout",
  "--teardown-timeout",
  "--slowTestThreshold",
  "--slow-test-threshold",
  "--retry",
  "--repeats",
  "--environment",
  "--mode",
  "--dir",
  "--env",
  "--shard",
  "--maxConcurrency",
  "--max-concurrency",
]);

export interface VitestGuardResult {
  allowed: boolean;
  reason?: string;
}

export function isVitestEntry(scriptPath: string): boolean {
  const normalized = scriptPath.replace(/\\/g, "/");
  const base = basename(normalized);
  if (/^vitest(\.(m?js|cjs|ts))?$/i.test(base)) {
    return true;
  }
  if (/(?:^|\/)node_modules\/(?:\.bin\/vitest|vitest\/)/i.test(normalized)) {
    return true;
  }
  return false;
}

export function isVitestCliProcess(args: string[]): boolean {
  if (args.length === 0) {
    return true;
  }
  const first = args[0];
  if (first === undefined) {
    return true;
  }
  const baseFirst = basename(first);
  if (/^(node|tsx|bun)(\.exe)?$/i.test(baseFirst)) {
    const second = args[1];
    if (second === undefined) {
      return false;
    }
    return isVitestEntry(second);
  }
  if (/^vitest(\.exe)?$/i.test(baseFirst)) {
    return true;
  }
  return true;
}

export function normalizeArgs(args: string[]): string[] {
  let startIndex = 0;
  if (args.length > 0) {
    const first = args[0];
    if (first !== undefined) {
      const baseFirst = basename(first);
      if (/^(node|tsx|bun)(\.exe)?$/i.test(baseFirst)) {
        startIndex = 1;
        const second = args[1];
        if (second !== undefined && isVitestEntry(second)) {
          startIndex = 2;
        }
      } else if (/^vitest(\.exe)?$/.test(baseFirst)) {
        startIndex = 1;
      }
    }
  }
  return args.slice(startIndex);
}

export function evaluateVitestRun(
  args: string[],
  env: NodeJS.ProcessEnv = process.env,
): VitestGuardResult {
  if (env.MEP_FULL_SUITE === "1") {
    return { allowed: true };
  }

  if (!isVitestCliProcess(args)) {
    return { allowed: true };
  }

  const cliArgs = normalizeArgs(args);

  let hasCommandBeenConsumed = false;
  let afterEndOfOptions = false;
  let positionalFilterCount = 0;

  for (let i = 0; i < cliArgs.length; i++) {
    const arg = cliArgs[i];
    if (arg === undefined) {
      continue;
    }

    if (afterEndOfOptions) {
      positionalFilterCount++;
      continue;
    }

    if (arg === "--") {
      afterEndOfOptions = true;
      continue;
    }

    if (EXEMPT_FLAGS.has(arg)) {
      return { allowed: true };
    }

    if (arg.startsWith("-")) {
      const equalIndex = arg.indexOf("=");
      const flagName = equalIndex === -1 ? arg : arg.slice(0, equalIndex);

      if (FILTER_FLAGS.has(flagName)) {
        return { allowed: true };
      }

      if (equalIndex !== -1) {
        continue;
      }

      if (OPTIONS_WITH_VALUE.has(arg)) {
        i++;
        continue;
      }

      if (arg === "--bail" || arg === "-b") {
        const nextArg = cliArgs[i + 1];
        if (nextArg !== undefined && /^\d+$/.test(nextArg)) {
          i++;
        }
        continue;
      }

      continue;
    }

    if (!hasCommandBeenConsumed) {
      if (EXEMPT_COMMANDS.has(arg)) {
        return { allowed: true };
      }
      if (GUARDED_COMMANDS.has(arg)) {
        hasCommandBeenConsumed = true;
        continue;
      }
      hasCommandBeenConsumed = true;
      positionalFilterCount++;
      continue;
    }

    positionalFilterCount++;
  }

  if (positionalFilterCount > 0) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: VITEST_GUARD_MESSAGE,
  };
}

export function enforceVitestGuard(
  args: string[] = process.argv,
  env: NodeJS.ProcessEnv = process.env,
  exitFn: (code: number) => void = (code) => process.exit(code),
  errorFn: (message: string) => void = (message) => console.error(message),
): void {
  const result = evaluateVitestRun(args, env);
  if (!result.allowed) {
    errorFn(result.reason ?? VITEST_GUARD_MESSAGE);
    exitFn(1);
  }
}
