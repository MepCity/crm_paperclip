import { expect, test } from "vitest";
import {
  buildSolutionsFormDefaults,
  SOLUTIONS_DELETE_CONFIRM_MESSAGE,
  SOLUTIONS_DELETE_CONFIRM_TITLE,
  SOLUTIONS_FORM_CREATE_TITLE,
  SOLUTIONS_FORM_EDIT_TITLE,
  SOLUTIONS_FORM_SYSTEM_FIELDS,
  solutionsFormRules,
} from "./solutions-form-rules";

test("Solutions form rules configure owner, defaults, omitted fields, and titles", () => {
  expect(SOLUTIONS_FORM_CREATE_TITLE).toBe("Create Solution");
  expect(SOLUTIONS_FORM_EDIT_TITLE).toBe("Edit Solution");
  expect(SOLUTIONS_DELETE_CONFIRM_TITLE).toBe("Delete Solution");
  expect(SOLUTIONS_DELETE_CONFIRM_MESSAGE).toBe("Are you sure you want to delete this Solution?");

  expect(solutionsFormRules.owner).toBe("Owner");
  expect(solutionsFormRules.laterModuleFields).toEqual({ Product_Name: "P2" });

  expect(buildSolutionsFormDefaults()).toEqual({
    Status: "Draft",
  });

  expect(solutionsFormRules.omitted).toContain("Connected_To__s");
  for (const name of SOLUTIONS_FORM_SYSTEM_FIELDS) {
    expect(solutionsFormRules.omitted).toContain(name);
  }
  expect(solutionsFormRules.omitted).toContain("Solution_Number");
});
