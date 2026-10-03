// Type-checks every workspace project. tsc is resolved from node_modules/.bin, so no pnpm on PATH is needed.
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const projects = [".", "packages/db", "packages/core", "apps/web"];

let failed = false;
for (const project of projects) {
  const result = spawnSync("tsc", ["-p", project], {
    cwd: root,
    stdio: "inherit",
    env: { ...process.env, PATH: `${root}node_modules/.bin:${process.env.PATH}` },
  });
  if (result.status !== 0) {
    console.error(`typecheck failed: ${project}`);
    failed = true;
  }
}
process.exit(failed ? 1 : 0);
