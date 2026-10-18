import { expect, test } from "vitest";
import {
  buildCasesFormDefaults,
  CASES_DELETE_CONFIRM_MESSAGE,
  CASES_DELETE_CONFIRM_TITLE,
  CASES_FORM_CREATE_TITLE,
  CASES_FORM_EDIT_TITLE,
  CASES_FORM_INFORMATION_COLUMNS,
  CASES_FORM_PICKLIST_NONE,
  CASES_FORM_SYSTEM_FIELDS,
  casesFormRules,
} from "./cases-form-rules";

test("Cases form rules configure owner, defaults, omitted fields, and titles", () => {
  expect(CASES_FORM_CREATE_TITLE).toBe("Create Case");
  expect(CASES_FORM_EDIT_TITLE).toBe("Edit Case");
  expect(CASES_DELETE_CONFIRM_TITLE).toBe("Delete Case");
  expect(CASES_DELETE_CONFIRM_MESSAGE).toBe("Are you sure you want to delete this Case?");

  expect(casesFormRules.owner).toBe("Owner");
  expect(casesFormRules.laterModuleFields).toEqual({ Product_Name: "P2" });

  expect(buildCasesFormDefaults()).toEqual({
    Status: "New",
    Priority: CASES_FORM_PICKLIST_NONE,
    Type: CASES_FORM_PICKLIST_NONE,
    Case_Reason: CASES_FORM_PICKLIST_NONE,
    Case_Origin: CASES_FORM_PICKLIST_NONE,
  });

  expect(casesFormRules.omitted).toContain("Connected_To__s");
  for (const name of CASES_FORM_SYSTEM_FIELDS) {
    expect(casesFormRules.omitted).toContain(name);
  }
  expect(casesFormRules.omitted).not.toContain("Case_Number");
  for (const name of ["Add_Comment", "Comments", "No_of_comments"]) {
    expect(casesFormRules.omitted).toContain(name);
  }
  expect(CASES_FORM_INFORMATION_COLUMNS[0][0]).toBe("Case_Number");
  expect(CASES_FORM_INFORMATION_COLUMNS[1][0]).toBe("Owner");
});
