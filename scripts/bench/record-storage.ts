import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { type BenchArgs, markdownFor, resolveProtocol, runBench } from "./run";

function readArg(argv: string[], name: string): string | undefined {
  const index = argv.indexOf(name);
  if (index < 0) return undefined;
  const value = argv[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`${name} needs a value`);
  return value;
}

function parseArgs(argv: string[]): BenchArgs {
  if (argv.includes("--help")) {
    console.log(
      "pnpm bench:storage [--rows N] [--seed N] [--warmup N] [--measure N] [--writes N] [--json file] [--out file]",
    );
    process.exit(0);
  }
  const number = (name: string): number | undefined => {
    const value = readArg(argv, name);
    if (value === undefined) return undefined;
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 0)
      throw new Error(`${name} must be a non-negative integer`);
    return parsed;
  };
  const known = new Set([
    "--rows",
    "--seed",
    "--warmup",
    "--measure",
    "--writes",
    "--json",
    "--out",
    "--help",
  ]);
  for (let index = 0; index < argv.length; index++) {
    const token = argv[index];
    if (!token?.startsWith("--")) throw new Error(`unexpected argument ${token}`);
    if (!known.has(token)) throw new Error(`unknown argument ${token}`);
    index += 1;
  }
  return {
    rows: number("--rows"),
    seed: number("--seed"),
    warmup: number("--warmup"),
    measure: number("--measure"),
    writes: number("--writes"),
    jsonPath: readArg(argv, "--json"),
    outPath: readArg(argv, "--out"),
  };
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const protocol = resolveProtocol(args);
  console.error(
    `bench: rows=${protocol.rows} seed=${protocol.seed} warmup=${protocol.warmup} measure=${protocol.measure} writes=${protocol.writes}`,
  );
  if (args.outPath) await mkdir(dirname(args.outPath), { recursive: true });
  if (args.jsonPath) await mkdir(dirname(args.jsonPath), { recursive: true });
  const report = await runBench(args, (message) => console.error(message));
  process.stdout.write(markdownFor(report));
  if (!markdownFor(report).endsWith("\n")) process.stdout.write("\n");
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
