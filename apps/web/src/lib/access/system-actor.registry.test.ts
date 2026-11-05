import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * ADR 0017 §4.8: a production fixture service either carries the viewer's access source or is
 * an explicit system actor (`system: true`); a missing option is never a silent bypass.
 */
const root = join(import.meta.dirname, "..", "..");
function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return name === "node_modules" ? [] : sources(path);
    return /\.(ts|tsx)$/.test(name) && !/\.(test|demo|spec)\./.test(name) ? [path] : [];
  });
}

describe("system actor registry", () => {
  it("every production createFixture* call declares access or system", () => {
    const offenders: string[] = [];
    for (const file of sources(root)) {
      const text = readFileSync(file, "utf8");
      for (const match of text.matchAll(
        /createFixture(?:RecordService|TagService|RecordHistoryService|RecycleBinService)\(/g,
      )) {
        const call = text.slice(match.index, (match.index ?? 0) + 400);
        if (!/access\s*:|system\s*:\s*true/.test(call)) offenders.push(file.replace(root, ""));
      }
    }
    expect(offenders).toEqual([]);
  });
});
