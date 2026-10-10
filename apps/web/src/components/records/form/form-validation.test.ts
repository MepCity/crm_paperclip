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

test("isEmailFormatValid accepts common addresses", () => {
  expect(isEmailFormatValid("user@example.test")).toBe(true);
  expect(isEmailFormatValid("bad")).toBe(false);
});
