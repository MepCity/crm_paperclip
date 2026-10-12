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
  "--filter",
]);

const OPTIONS_WITH_VALUE = new Set([
  "-c",
  "--config",
  "-r",
  "--root",
  "-R",
  "--reporter",
  "--outputFile",
  "--pool",
  "--poolOptions",
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
  "--environment",
  "--mode",
  "--dir",
  "--env",
  "--shard",
]);

export interface VitestGuardResult {
  allowed: boolean;
  reason?: string;
}

export function normalizeArgs(args: string[]): string[] {
  let startIndex = 0;
  if (args.length > 0) {
    const first = args[0];
    if (first !== undefined) {
      const baseFirst = basename(first);
      if (/^node(\.exe)?$/.test(baseFirst)) {
        startIndex = 1;
        const second = args[1];
        if (
          second !== undefined &&
          (second.includes("vitest") ||
            second.endsWith(".js") ||
            second.endsWith(".mjs") ||
            second.endsWith(".ts"))
        ) {
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

  const cliArgs = normalizeArgs(args);
  const isRunMode = cliArgs.includes("run") || cliArgs.includes("--run");

  if (!isRunMode) {
    return { allowed: true };
  }

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

    if (arg === "run" && !hasCommandBeenConsumed) {
      hasCommandBeenConsumed = true;
      continue;
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
