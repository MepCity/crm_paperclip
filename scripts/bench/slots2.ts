import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { render } from "./slots2-report";
import { type Args, runSlots2 } from "./slots2-run";

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  if (argv.includes("--help")) {
    console.log(
      "pnpm exec tsx scripts/bench/slots2.ts [--rows N] [--writes N] [--warmup N] [--measure N] [--seed N] [--out file] [--json file]",
    );
    return;
  }
  const args: Args = {};
  for (let i = 0; i < argv.length; i += 2) {
    const name = argv[i],
      value = argv[i + 1];
    if (!name || !value || value.startsWith("--")) throw new Error("each option needs a value");
    const key = name.slice(2);
    if (!["rows", "writes", "warmup", "measure", "seed", "out", "json"].includes(key))
      throw new Error(`unknown option ${name}`);
    if (key === "out" || key === "json") args[key] = value;
    else {
      const n = Number(value);
      if (!Number.isInteger(n) || n < 0) throw new Error(`${name} must be a non-negative integer`);
      Object.assign(args, { [key]: n });
    }
  }
  if (args.out) await mkdir(dirname(args.out), { recursive: true });
  if (args.json) await mkdir(dirname(args.json), { recursive: true });
  const report = await runSlots2(args, (message) => console.error(message));
  process.stdout.write(render(report));
}
main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
