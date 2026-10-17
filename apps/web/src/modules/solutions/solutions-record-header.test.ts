import { expect, test } from "vitest";
import { solutionsRecordHeaderIdentity } from "./solutions-record-header";
import { solutionRecord } from "./test-metadata";

test("solutionsRecordHeaderIdentity returns Solution_Title as title and disables portrait and recordNavigation", () => {
  const result = solutionsRecordHeaderIdentity(
    solutionRecord({ Solution_Title: "Email Sync Solution" }),
  );
  expect(result).toEqual({
    title: "Email Sync Solution",
    hasPortrait: false,
    recordNavigation: false,
  });

  const empty = solutionsRecordHeaderIdentity(solutionRecord());
  expect(empty.title).toBe("");
});
