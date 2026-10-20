import { expect, it } from "vitest";
import { integrationSummary } from "./integration-summary";

it("counts test files once even when they contain multiple suites and tests", () => {
  const summary = integrationSummary({
    numTotalTests: 4,
    numPassedTests: 2,
    numFailedTests: 1,
    numPendingTests: 1,
    testResults: [
      { name: "first.int.test.ts", assertionResults: [{ status: "passed" }, { status: "failed" }] },
      { name: "second.int.test.ts", assertionResults: [{ status: "passed" }] },
      { name: "skipped.int.test.ts", assertionResults: [{ status: "pending" }] },
    ],
  });
  expect(summary).toContain("Files: 2 executed / 3 reported");
  expect(summary).toContain("4 total, 2 passed, 1 failed, 1 pending");
});

it.each([
  { testResults: [] },
  { testResults: [{ name: "skipped.int.test.ts", assertionResults: [{ status: "pending" }] }] },
])("rejects empty or entirely skipped runs", ({ testResults }) => {
  expect(() =>
    integrationSummary({
      numTotalTests: testResults.length,
      numPassedTests: 0,
      numFailedTests: 0,
      numPendingTests: testResults.length,
      testResults,
    }),
  ).toThrow("no executed integration tests");
});

it("rejects reports that executed only non-integration files", () => {
  expect(() =>
    integrationSummary({
      numTotalTests: 1,
      numPassedTests: 1,
      numFailedTests: 0,
      numPendingTests: 0,
      testResults: [{ name: "unit.test.ts", assertionResults: [{ status: "passed" }] }],
    }),
  ).toThrow("no executed integration tests");
});
