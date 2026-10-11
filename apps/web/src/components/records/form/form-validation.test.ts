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

test("isEmailFormatValid accepts common addresses", () => {
  expect(isEmailFormatValid("user@example.test")).toBe(true);
  expect(isEmailFormatValid("bad")).toBe(false);
});

test("date fields await their dedicated form UI just like datetime fields", () => {
  for (const type of ["date", "datetime"] as const)
    expect(validateRecordForm([field("Day", "Day", type, true)], {}, (f) => f.label)).toEqual({});
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
