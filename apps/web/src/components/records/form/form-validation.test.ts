import type { FieldDefinition } from "@crm/core/records";
import { expect, test } from "vitest";
import {
  isEmailFormatValid,
  validateRecordForm,
  validationEmptyMessage,
  validationFormatMessage,
} from "./form-validation";

const views = { view: true, create: true, edit: true, quickCreate: false };

function field(
  apiName: string,
  label: string,
  dataType: FieldDefinition["dataType"],
  required = false,
): FieldDefinition {
  return {
    apiName,
    label,
    dataType,
    required,
    readOnly: false,
    unique: false,
    massUpdate: false,
    views,
  };
}

test("validation messages include field labels", () => {
  expect(validationEmptyMessage("Company")).toBe("Company cannot be empty.");
  expect(validationFormatMessage("Email")).toBe("Please enter a valid Email.");
});

test("optional empty fields stay valid", () => {
  const fields = [field("Email", "Email", "email", false)];
  expect(validateRecordForm(fields, { Email: null }, (f) => f.label)).toEqual({});
});

test("required empty fields fail with empty message", () => {
  const fields = [
    field("Company", "Company", "text", true),
    field("Last_Name", "Last Name", "text", true),
  ];
  const errors = validateRecordForm(fields, {}, (f) => f.label);
  expect(errors).toEqual({
    Company: "Company cannot be empty.",
    Last_Name: "Last Name cannot be empty.",
  });
});

test("email and integer format failures use format message", () => {
  const fields = [
    field("Email", "Email", "email", false),
    field("No_of_Employees", "No. of Employees", "integer", false),
  ];
  const errors = validateRecordForm(
    fields,
    { Email: "not-an-email", No_of_Employees: 12.5 },
    (f) => f.label,
  );
  expect(errors.Email).toBe("Please enter a valid Email.");
  expect(errors.No_of_Employees).toBe("Please enter a valid No. of Employees.");
});

test("whole numbers and empty optional integers pass", () => {
  const fields = [field("No_of_Employees", "No. of Employees", "integer", false)];
  for (const value of [12, 0, null]) {
    expect(validateRecordForm(fields, { No_of_Employees: value }, (f) => f.label)).toEqual({});
  }
});

test("bigint accepts digit text and reports an entry that is not digits", () => {
  const optional = [field("Account_Number", "Account Number", "bigint", false)];
  for (const value of ["9007199254740993", "0", " 123456789012345678 ", null]) {
    expect(validateRecordForm(optional, { Account_Number: value }, (f) => f.label)).toEqual({});
  }
  for (const value of ["12a", "1.5", "12 34", "1e5", "-5", 123456789012, 12.5]) {
    expect(validateRecordForm(optional, { Account_Number: value }, (f) => f.label)).toEqual({
      Account_Number: "Please enter a valid Account Number.",
    });
  }
  const required = [field("Account_Number", "Account Number", "bigint", true)];
  expect(validateRecordForm(required, {}, (f) => f.label)).toEqual({
    Account_Number: "Account Number cannot be empty.",
  });
  // Spaces alone are a cleared field, not a format failure.
  expect(validateRecordForm(required, { Account_Number: "   " }, (f) => f.label)).toEqual({
    Account_Number: "Account Number cannot be empty.",
  });
});

test("isEmailFormatValid accepts common addresses", () => {
  expect(isEmailFormatValid("user@example.test")).toBe(true);
  expect(isEmailFormatValid("bad")).toBe(false);
});

test("date accepts a real day and an empty field", () => {
  const fields = [field("Date_of_Birth", "Date of Birth", "date", false)];
  for (const value of ["2026-02-15", "2024-02-29", null]) {
    expect(validateRecordForm(fields, { Date_of_Birth: value }, (f) => f.label)).toEqual({});
  }
});

test("date rejects a day that never happened", () => {
  const fields = [field("Date_of_Birth", "Date of Birth", "date", false)];
  expect(validateRecordForm(fields, { Date_of_Birth: "2026-02-30" }, (f) => f.label)).toEqual({
    Date_of_Birth: "Please enter a valid Date of Birth.",
  });
});

test("date rejects a half-typed entry instead of reading it as empty", () => {
  const fields = [field("Date_of_Birth", "Date of Birth", "date", false)];
  for (const value of ["1", "15.", "15.02", "15.02.202", "1.2.2024"]) {
    expect(validateRecordForm(fields, { Date_of_Birth: value }, (f) => f.label)).toEqual({
      Date_of_Birth: "Please enter a valid Date of Birth.",
    });
  }
});

test("an optional date stays valid when the entry is really cleared", () => {
  const fields = [field("Date_of_Birth", "Date of Birth", "date", false)];
  expect(validateRecordForm(fields, { Date_of_Birth: null }, (f) => f.label)).toEqual({});
  const requiredFields = [field("Date_of_Birth", "Date of Birth", "date", true)];
  expect(validateRecordForm(requiredFields, { Date_of_Birth: null }, (f) => f.label)).toEqual({
    Date_of_Birth: "Date of Birth cannot be empty.",
  });
  // Half an entry is not empty, so a required field reports the format, not the empty message.
  expect(
    validateRecordForm(requiredFields, { Date_of_Birth: "15.02.202" }, (f) => f.label),
  ).toEqual({ Date_of_Birth: "Please enter a valid Date of Birth." });
});

test("date rejects anything outside the contract shape", () => {
  const fields = [field("Date_of_Birth", "Date of Birth", "date", false)];
  for (const value of ["15.02.2026", "2026-2-15", "2026-13-01", 20260215, true]) {
    expect(validateRecordForm(fields, { Date_of_Birth: value }, (f) => f.label)).toEqual({
      Date_of_Birth: "Please enter a valid Date of Birth.",
    });
  }
});

test("required date reports the empty message before the format", () => {
  const fields = [field("Date_of_Birth", "Date of Birth", "date", true)];
  expect(validateRecordForm(fields, {}, (f) => f.label)).toEqual({
    Date_of_Birth: "Date of Birth cannot be empty.",
  });
});

test("datetime keeps being skipped until its own form task", () => {
  const fields = [field("Created_Time", "Created Time", "datetime", true)];
  expect(validateRecordForm(fields, {}, (f) => f.label)).toEqual({});
});

test("required lookup fields require a populated reference", () => {
  const fields = [field("Account_Name", "Account Name", "lookup", true)];
  expect(validateRecordForm(fields, {}, (f) => f.label)).toEqual({
    Account_Name: "Account Name cannot be empty.",
  });
  expect(validateRecordForm(fields, { Account_Name: null }, (f) => f.label)).toEqual({
    Account_Name: "Account Name cannot be empty.",
  });
  expect(
    validateRecordForm(
      fields,
      { Account_Name: { module: "Accounts", id: "", name: "" } },
      (f) => f.label,
    ),
  ).toEqual({
    Account_Name: "Account Name cannot be empty.",
  });
  expect(
    validateRecordForm(
      fields,
      { Account_Name: { module: "Accounts", id: "acc-1", name: "Acme" } },
      (f) => f.label,
    ),
  ).toEqual({});
});

test("optional lookup fields accept null or populated references", () => {
  const fields = [field("Account_Name", "Account Name", "lookup", false)];
  expect(validateRecordForm(fields, {}, (f) => f.label)).toEqual({});
  expect(validateRecordForm(fields, { Account_Name: null }, (f) => f.label)).toEqual({});
  expect(
    validateRecordForm(
      fields,
      { Account_Name: { module: "Accounts", id: "acc-1", name: "Acme" } },
      (f) => f.label,
    ),
  ).toEqual({});
});
