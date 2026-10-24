import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, expect, it } from "vitest";

const script = fileURLToPath(new URL("./duration-summary.mjs", import.meta.url));
const fixture = (name: string) =>
  fileURLToPath(new URL(`./fixtures/${name}.json`, import.meta.url));
let directory: string;
let summaryPath: string;
beforeEach(() => {
  directory = mkdtempSync(path.join(tmpdir(), "duration-summary-"));
  summaryPath = path.join(directory, "summary.md");
});
afterEach(() => rmSync(directory, { recursive: true, force: true }));

function run(format: string, reportPath: string, output = summaryPath) {
  return execFileSync(process.execPath, [script, format, reportPath], {
    encoding: "utf8",
    env: { ...process.env, GITHUB_STEP_SUMMARY: output },
  });
}
function report(value: unknown) {
  const file = path.join(directory, "report.json");
  writeFileSync(file, JSON.stringify(value));
  return file;
}

it("appends the Vitest table with elapsed file durations and skipped test counts", () => {
  writeFileSync(summaryPath, "Existing summary\n\n");
  const stdout = run("vitest", fixture("vitest"));
  expect(stdout).toContain("| scripts/slow.test.ts | 3.000 | 2 |");
  expect(stdout).toContain("| scripts/fast.test.ts | 0.500 | 1 |");
  expect(stdout.indexOf("slow.test.ts")).toBeLessThan(stdout.indexOf("fast.test.ts"));
  expect(readFileSync(summaryPath, "utf8")).toBe(`Existing summary\n\n${stdout}\n`);
});

it("aggregates nested Playwright suites and retries once per file", () => {
  const stdout = run("playwright", fixture("playwright"));
  expect(stdout).toContain("| slow.spec.ts | 4.000 | 3 |");
  expect(stdout).toContain("| fast.spec.ts | 0.100 | 1 |");
  expect(stdout).toContain("including retries");
});

it("limits output to the slowest 20 files and hides runner paths", () => {
  const stdout = run(
    "vitest",
    report({
      testResults: Array.from({ length: 25 }, (_, i) => ({
        name: path.resolve(`scripts/file-${i}.test.ts`),
        startTime: 0,
        endTime: i * 1000,
        assertionResults: [],
      })),
    }),
  );
  expect(stdout).toContain("| scripts/file-24.test.ts | 24.000 | 0 |");
  expect(stdout).toContain("| scripts/file-5.test.ts | 5.000 | 0 |");
  expect(stdout).not.toContain("file-4.test.ts");
  expect(stdout).not.toContain(process.cwd());
  expect(stdout.split("\n").filter((line) => line.startsWith("| scripts/"))).toHaveLength(20);
});

it("escapes filenames, falls back to assertion durations, and sorts tied files", () => {
  const stdout = run(
    "vitest",
    report({
      testResults: [
        { name: "b|<x>`\n.test.ts", assertionResults: [{ duration: 2000 }, { duration: -2 }] },
        { name: "a.test.ts", assertionResults: [{ duration: 2000 }] },
      ],
    }),
  );
  expect(stdout).toContain("| b&#124;&lt;x&gt;&#96; .test.ts | 2.000 | 2 |");
  expect(stdout.indexOf("a.test.ts")).toBeLessThan(stdout.indexOf("b&#124;"));
});

it.each(["vitest", "playwright"])("handles empty %s reports with a one-line note", (format) => {
  const stdout = run(format, report(format === "vitest" ? { testResults: [] } : { suites: [] }));
  expect(stdout).toBe(`Test durations (${format}): no test files reported.\n`);
  expect(readFileSync(summaryPath, "utf8")).toBe(stdout);
});

it.each(["missing", "empty", "malformed", "null", "wrong-shape"])(
  "does not fail on a %s report",
  (kind) => {
    const file = path.join(directory, "input.json");
    if (kind !== "missing") {
      writeFileSync(
        file,
        { empty: "", malformed: "{", null: "null", "wrong-shape": '{"testResults":1}' }[kind] ?? "",
      );
    }
    expect(run("vitest", file)).toBe(
      "Test durations: report missing, unreadable or invalid; summary unavailable.\n",
    );
  },
);

it("keeps reporting best-effort when the step summary cannot be written", () => {
  expect(run("vitest", fixture("vitest"), directory)).toContain("could not append step summary");
});
