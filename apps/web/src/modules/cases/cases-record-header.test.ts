import { expect, test } from "vitest";
import { casesRecordHeaderIdentity } from "./cases-record-header";
import { caseRecord } from "./test-metadata";

test("casesRecordHeaderIdentity returns Subject as title and disables portrait and recordNavigation", () => {
  const result = casesRecordHeaderIdentity(caseRecord({ Subject: "Server Down Incident" }));
  expect(result).toEqual({
    title: "Server Down Incident",
    hasPortrait: false,
    recordNavigation: false,
  });

  const empty = casesRecordHeaderIdentity(caseRecord());
  expect(empty.title).toBe("");
});
