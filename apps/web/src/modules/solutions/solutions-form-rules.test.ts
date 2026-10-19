import { expect, test } from "vitest";
import {
  buildSolutionsFormDefaults,
  SOLUTIONS_DELETE_CONFIRM_MESSAGE,
  SOLUTIONS_DELETE_CONFIRM_TITLE,
  SOLUTIONS_FORM_CREATE_TITLE,
  SOLUTIONS_FORM_EDIT_TITLE,
  SOLUTIONS_FORM_INFORMATION_COLUMNS,
  SOLUTIONS_FORM_OMITTED_SYSTEM_FIELDS,
  SOLUTIONS_FORM_PICKLIST_NONE,
  SOLUTIONS_FORM_SYSTEM_FIELDS,
  solutionsFormRules,
} from "./solutions-form-rules";

test("Solutions form rules configure owner, defaults, required and omitted fields, and titles", () => {
  expect(SOLUTIONS_FORM_CREATE_TITLE).toBe("Create Solution");
  expect(SOLUTIONS_FORM_EDIT_TITLE).toBe("Edit Solution");
  expect(SOLUTIONS_DELETE_CONFIRM_TITLE).toBe("Delete Solution");
  expect(SOLUTIONS_DELETE_CONFIRM_MESSAGE).toBe("Are you sure you want to delete this Solution?");
  expect(SOLUTIONS_FORM_PICKLIST_NONE).toBe("-None-");

  expect(solutionsFormRules.owner).toBe("Owner");
  expect(solutionsFormRules.initialFocus).toBe("Owner");
  expect(solutionsFormRules.laterModuleFields).toEqual({ Product_Name: "P2" });

  expect(buildSolutionsFormDefaults()).toEqual({
    Status: "Draft",
  });

  expect(solutionsFormRules.requiredFields).toEqual(["Solution_Title", "Question", "Answer"]);
  expect(solutionsFormRules.readOnlyFields).toEqual(["Solution_Number"]);

  expect(solutionsFormRules.omitted).toContain("Connected_To__s");
  expect(solutionsFormRules.omitted).toContain("Published");
  expect(solutionsFormRules.omitted).toContain("Add_Comment");
  expect(solutionsFormRules.omitted).toContain("Comments");
  expect(solutionsFormRules.omitted).toContain("No_of_comments");
  expect(solutionsFormRules.omitted).toContain("Tag");
  for (const name of SOLUTIONS_FORM_OMITTED_SYSTEM_FIELDS) {
    expect(solutionsFormRules.omitted).toContain(name);
  }
  expect(solutionsFormRules.omitted).not.toContain("Solution_Number");
  expect(SOLUTIONS_FORM_SYSTEM_FIELDS).toContain("Solution_Number");

  expect(solutionsFormRules.omittedSections).toEqual([
    "Comment Information",
    "Solution Image",
    "Record Image",
  ]);
});

test("Solution Information follows the spec two-column order", () => {
  expect(SOLUTIONS_FORM_INFORMATION_COLUMNS[0]).toEqual([
    "Solution_Number",
    "Solution_Title",
    "Status",
  ]);
  expect(SOLUTIONS_FORM_INFORMATION_COLUMNS[1]).toEqual(["Owner", "Product_Name"]);
  expect(solutionsFormRules.fallbackColumns).toEqual({
    "Solution Information": SOLUTIONS_FORM_INFORMATION_COLUMNS,
  });
});
