import { expect, test } from "vitest";
import { isContactInlineEditable } from "./contacts-inline-edit";
import { contactField } from "./test-metadata";

test("retains shared writable-field policy and excludes Contacts composites", () => {
  expect(isContactInlineEditable(contactField("Department"))).toBe(true);
  for (const name of [
    "Full_Name",
    "Mailing_Address",
    "Other_Address",
    "Mailing_Coordinates",
    "Other_Coordinates",
    "Created_By",
  ])
    expect(isContactInlineEditable(contactField(name))).toBe(false);
  expect(isContactInlineEditable(contactField("Reporting_To", { dataType: "lookup" }))).toBe(false);
  expect(isContactInlineEditable(contactField("Email", { readOnly: true }))).toBe(false);
});
