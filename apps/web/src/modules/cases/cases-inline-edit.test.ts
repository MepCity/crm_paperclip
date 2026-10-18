import { expect, test } from "vitest";
import { isCaseInlineEditable } from "./cases-inline-edit";
import { caseField } from "./test-metadata";

test("Cases system fields and autonumber are not inline editable, ordinary fields are", () => {
  expect(isCaseInlineEditable(caseField("Subject"))).toBe(true);
  expect(isCaseInlineEditable(caseField("Description"))).toBe(true);

  for (const name of ["Case_Number", "Created_By", "Modified_Time", "id", "Last_Activity_Time"]) {
    expect(isCaseInlineEditable(caseField(name))).toBe(false);
  }
});
