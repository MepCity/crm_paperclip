import { appendFile, readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

type IntegrationReport = {
  numTotalTests: number;
  numPassedTests: number;
  numFailedTests: number;
  numPendingTests: number;
  testResults: { name: string; assertionResults: { status: string }[] }[];
};

/** Count files containing executed tests, rather than nested describe suites. */
export function integrationSummary(report: IntegrationReport): string {
  const files = report.testResults.filter((result) => result.name.endsWith(".int.test.ts"));
  const executedFiles = files.filter((file) =>
    file.assertionResults.some((test) => test.status === "passed" || test.status === "failed"),
  );
  if (executedFiles.length === 0 || report.numPassedTests + report.numFailedTests === 0) {
    throw new Error("Integration report contains no executed integration tests");
  }
  return [
    "### Integration tests",
    `- Files: ${executedFiles.length} executed / ${files.length} reported`,
    `- Tests: ${report.numTotalTests} total, ${report.numPassedTests} passed, ${report.numFailedTests} failed, ${report.numPendingTests} pending`,
    "",
  ].join("\n");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const reportPath = process.argv[2];
  if (!reportPath) throw new Error("Expected a Vitest JSON report path");
  const summary = integrationSummary(JSON.parse(await readFile(reportPath, "utf8")));
  console.log(summary);
  if (process.env.GITHUB_STEP_SUMMARY) {
    await appendFile(process.env.GITHUB_STEP_SUMMARY, summary);
  }
}
