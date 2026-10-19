import { expect, test } from "vitest";
import { casesRecordHeaderIdentity } from "./cases-record-header";
import { caseRecord } from "./test-metadata";

test("casesRecordHeaderIdentity returns Subject as title, disables portrait and enables recordNavigation", () => {
  const result = casesRecordHeaderIdentity(caseRecord({ Subject: "Server Down Incident" }));
  expect(result).toEqual({
    title: "Server Down Incident",
    hasPortrait: false,
    recordNavigation: true,
  });

  const empty = casesRecordHeaderIdentity(caseRecord());
  expect(empty.title).toBe("");
});
