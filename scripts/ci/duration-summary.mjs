import { appendFile, readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const milliseconds = (value) => (Number.isFinite(value) && value >= 0 ? value : 0);

// Reports can contain runner-local absolute filenames; summaries show repository paths only.
function filename(value, root) {
  const normalized = value.replaceAll("\\", "/");
  const relative = path.posix.isAbsolute(normalized)
    ? path.posix.relative(root.replaceAll("\\", "/"), normalized)
    : normalized;
  return relative.startsWith("../") ? path.posix.basename(relative) : relative;
}

export function durationSummary(format, report, root = process.cwd()) {
  const files = new Map();
  function add(file, duration, tests) {
    if (typeof file !== "string" || !file) return;
    const key = filename(file, root);
    const entry = files.get(key) ?? { duration: 0, tests: 0 };
    entry.duration += duration;
    entry.tests += tests;
    files.set(key, entry);
  }

  if (format === "vitest") {
    for (const file of report.testResults ?? []) {
      const assertions = file.assertionResults ?? [];
      const duration =
        Number.isFinite(file.startTime) && Number.isFinite(file.endTime)
          ? milliseconds(file.endTime - file.startTime)
          : assertions.reduce((total, test) => total + milliseconds(test.duration), 0);
      add(file.name, duration, assertions.length);
    }
  } else if (format === "playwright") {
    function visit(suite) {
      for (const spec of suite.specs ?? []) {
        const tests = spec.tests ?? [];
        const duration = tests.reduce(
          (total, test) =>
            total +
            (test.results ?? []).reduce((sum, result) => sum + milliseconds(result.duration), 0),
          0,
        );
        add(spec.file ?? suite.file, duration, tests.length);
      }
      for (const child of suite.suites ?? []) visit(child);
    }
    for (const suite of report.suites ?? []) visit(suite);
  } else {
    throw new Error("Expected vitest or playwright format");
  }

  if (!files.size) return `Test durations (${format}): no test files reported.\n`;
  const rows = [...files].sort((a, b) => b[1].duration - a[1].duration || a[0].localeCompare(b[0]));
  const escapeCell = (value) =>
    value
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll("|", "&#124;")
      .replaceAll("`", "&#96;")
      .replace(/[\r\n]/g, " ");
  return [
    `### Test durations (${format}): slowest 20 files`,
    "",
    format === "vitest"
      ? "Duration is file end minus start (assertion duration sum when timestamps are absent)."
      : "Duration sums all test attempts, including retries; parallel tests overlap in wall time.",
    "Tests includes skipped tests; retries do not increase the count.",
    "",
    "| File | Duration (s) | Tests |",
    "| --- | ---: | ---: |",
    ...rows
      .slice(0, 20)
      .map(
        ([file, entry]) =>
          `| ${escapeCell(file)} | ${(entry.duration / 1000).toFixed(3)} | ${entry.tests} |`,
      ),
    "",
    "",
  ].join("\n");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [format, reportPath] = process.argv.slice(2);
  let summary;
  try {
    summary = durationSummary(format, JSON.parse(await readFile(reportPath, "utf8")));
  } catch {
    summary = "Test durations: report missing, unreadable or invalid; summary unavailable.\n";
  }
  console.log(summary.trimEnd());
  if (process.env.GITHUB_STEP_SUMMARY) {
    try {
      await appendFile(process.env.GITHUB_STEP_SUMMARY, summary);
    } catch {
      console.log("Test durations: could not append step summary.");
    }
  }
}
