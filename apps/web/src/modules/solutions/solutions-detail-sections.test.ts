import { expect, test } from "vitest";
import {
  buildSolutionsBusinessCardFields,
  buildSolutionsDetailSections,
} from "./solutions-detail-sections";
import { solutionField, solutionMetadata, solutionRecord } from "./test-metadata";

test("buildSolutionsBusinessCardFields returns empty array", () => {
  expect(buildSolutionsBusinessCardFields(solutionMetadata(), solutionRecord())).toEqual([]);
});

test("buildSolutionsDetailSections builds layout sections; 1-column sections and description/comment span full width", () => {
  const metadata = {
    ...solutionMetadata([
      solutionField("Solution_Number"),
      solutionField("Solution_Title"),
      solutionField("Status"),
      solutionField("Description"),
      solutionField("Question"),
      solutionField("Answer"),
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
        label: "Comment Information",
        columnCount: 2,
        columns: [["Question"], ["Answer"]],
        fields: ["Question", "Answer"],
      },
    ],
  };

  const sections = buildSolutionsDetailSections(
    metadata,
    solutionRecord({
      Solution_Number: "SOL-001",
      Solution_Title: "Network Setup",
      Status: "Draft",
      Description: "Setup steps",
      Question: "How to connect?",
      Answer: "Follow instructions",
    }),
  );

  expect(sections.map((s) => s.title)).toEqual([
    "Solution Information",
    "Description Information",
    "Comment Information",
  ]);
  expect(sections[0]?.fields.map((f) => f.column)).toEqual(["left", "left", "right"]);
  expect(sections[1]?.fields[0]?.column).toBe("full");
  expect(sections[2]?.fields.map((f) => f.column)).toEqual(["full", "full"]);
});
