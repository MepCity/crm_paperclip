import { expect, test } from "vitest";
import {
  buildSolutionsBusinessCardFields,
  buildSolutionsDetailSections,
} from "./solutions-detail-sections";
import { solutionField, solutionMetadata, solutionRecord } from "./test-metadata";

test("buildSolutionsBusinessCardFields returns empty array", () => {
  expect(buildSolutionsBusinessCardFields(solutionMetadata(), solutionRecord())).toEqual([]);
});

test("buildSolutionsDetailSections builds layout sections; 1-column sections and description span full width", () => {
  const metadata = {
    ...solutionMetadata([
      solutionField("Solution_Number"),
      solutionField("Solution_Title"),
      solutionField("Status"),
      solutionField("Description"),
      solutionField("Solution"),
    ]),
    layout: [
      {
        label: "Solution Information",
        columnCount: 2,
        columns: [["Solution_Number", "Solution_Title"], ["Status"]],
        fields: ["Solution_Number", "Solution_Title", "Status"],
      },
      {
        label: "Description Information",
        columnCount: 1,
        columns: [["Description"]],
        fields: ["Description"],
      },
      {
        label: "Solution Information Full",
        columnCount: 1,
        columns: [["Solution"]],
        fields: ["Solution"],
      },
    ],
  };

  const sections = buildSolutionsDetailSections(
    metadata,
    solutionRecord({
      Solution_Number: "201",
      Solution_Title: "Known Workaround",
      Status: "Draft",
      Description: "Issue description",
      Solution: "Steps to resolve",
    }),
  );

  expect(sections.map((s) => s.title)).toEqual([
    "Solution Information",
    "Description Information",
    "Solution Information Full",
  ]);
  expect(sections[0]?.fields.map((f) => f.column)).toEqual(["left", "left", "right"]);
  expect(sections[1]?.fields[0]?.column).toBe("full");
  expect(sections[2]?.fields[0]?.column).toBe("full");
});
