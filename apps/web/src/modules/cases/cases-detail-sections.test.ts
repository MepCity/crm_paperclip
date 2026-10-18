import { expect, test } from "vitest";
import { buildCasesBusinessCardFields, buildCasesDetailSections } from "./cases-detail-sections";
import { caseField, caseMetadata, caseRecord } from "./test-metadata";

test("buildCasesBusinessCardFields returns empty array", () => {
  expect(buildCasesBusinessCardFields(caseMetadata(), caseRecord())).toEqual([]);
});

test("buildCasesDetailSections builds layout sections; 1-column sections span the full width", () => {
  const metadata = {
    ...caseMetadata([
      caseField("Case_Number"),
      caseField("Subject"),
      caseField("Status"),
      caseField("Description"),
      caseField("Solution"),
    ]),
    layout: [
      {
        label: "Case Information",
        columnCount: 2,
        columns: [["Case_Number", "Subject"], ["Status"]],
        fields: ["Case_Number", "Subject", "Status"],
      },
      {
        label: "Description Information",
        columnCount: 1,
        columns: [["Description"]],
        fields: ["Description"],
      },
      {
        label: "Solution Information",
        columnCount: 1,
        columns: [["Solution"]],
        fields: ["Solution"],
      },
    ],
  };

  const sections = buildCasesDetailSections(
    metadata,
    caseRecord({
      Case_Number: "101",
      Subject: "Login Issue",
      Status: "New",
      Description: "Cannot login",
      Solution: "Reset password",
    }),
  );

  expect(sections.map((s) => s.title)).toEqual([
    "Case Information",
    "Description Information",
    "Solution Information",
  ]);
  expect(sections[0]?.fields.map((f) => f.column)).toEqual(["left", "left", "right"]);
  expect(sections[1]?.fields[0]?.column).toBe("full");
  expect(sections[2]?.fields[0]?.column).toBe("full");
});
