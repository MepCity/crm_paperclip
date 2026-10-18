import { expect, test } from "vitest";
import { solutionsRecordHeaderIdentity } from "./solutions-record-header";
import { solutionRecord } from "./test-metadata";

test("solutionsRecordHeaderIdentity returns Solution_Title as title and disables portrait and recordNavigation", () => {
  const result = solutionsRecordHeaderIdentity(
    solutionRecord({ Solution_Title: "How to reset router" }),
  );
  expect(result).toEqual({
    title: "How to reset router",
    hasPortrait: false,
    recordNavigation: false,
  });

  const empty = solutionsRecordHeaderIdentity(solutionRecord());
  expect(empty.title).toBe("");
});
