import { pathToFileURL } from "node:url";
import { sweep as sweepCore } from "@crm/db/ipc-sweep";

export function sweep(options: Parameters<typeof sweepCore>[0] = {}): number {
  return sweepCore(options).exitCode;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2);
  if (args.some((arg) => arg !== "--apply")) {
    console.error("Usage: pnpm ipc:sweep [--apply]");
    process.exitCode = 1;
  } else {
    process.exitCode = sweep({ apply: args.includes("--apply") });
  }
}
