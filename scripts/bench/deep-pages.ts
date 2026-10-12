import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { renderDeep } from "./deep-pages-report";
import { type DeepEvidence, runDeep } from "./deep-pages-run";
import type { Args } from "./slots2-run";

async function main(): Promise<void> {
  const argv = process.argv.slice(2);
  if (argv[0] === "--render") {
    const input = argv[1],
      out = argv[2];
    if (!input || !out) throw new Error("--render JSON REPORT");
    await writeFile(out, renderDeep(JSON.parse(await readFile(input, "utf8")) as DeepEvidence));
    return;
  }
  const args: Args = {};
  for (let i = 0; i < argv.length; i += 2) {
    const key = argv[i]?.slice(2),
      value = argv[i + 1];
    if (
      !key ||
      !value ||
      !["rows", "writes", "warmup", "measure", "seed", "out", "json"].includes(key)
    )
      throw new Error("invalid option");
    if (key === "out" || key === "json") args[key] = value;
    else {
      const n = Number(value);
      if (!Number.isInteger(n) || n < 0) throw new Error("invalid numeric option");
      Object.assign(args, { [key]: n });
    }
  }
  for (const file of [args.out, args.json])
    if (file) await mkdir(dirname(file), { recursive: true });
  const e = await runDeep(args, (s) => console.error(s));
  if (!e.complete) process.exitCode = 1;
}
main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
