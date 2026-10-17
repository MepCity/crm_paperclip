import { expect, test } from "vitest";
import { isSolutionInlineEditable } from "./solutions-inline-edit";
import { solutionField } from "./test-metadata";

test("Solutions system fields and autonumber are not inline editable, ordinary fields are", () => {
  expect(isSolutionInlineEditable(solutionField("Solution_Title"))).toBe(true);
  expect(isSolutionInlineEditable(solutionField("Description"))).toBe(true);

  for (const name of [
    "Solution_Number",
    "Created_By",
    "Modified_Time",
    "id",
    "Last_Activity_Time",
  ]) {
    expect(isSolutionInlineEditable(solutionField(name))).toBe(false);
  }
});
