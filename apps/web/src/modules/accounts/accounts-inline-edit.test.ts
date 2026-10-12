import { expect, test } from "vitest";
import { isAccountInlineEditable } from "./accounts-inline-edit";
import { accountField } from "./test-metadata";

test("retains shared writable-field policy and excludes Accounts composites", () => {
  expect(isAccountInlineEditable(accountField("Industry"))).toBe(true);
  expect(isAccountInlineEditable(accountField("Phone", { dataType: "phone" }))).toBe(true);
  expect(isAccountInlineEditable(accountField("Annual_Revenue", { dataType: "currency" }))).toBe(
    true,
  );

  for (const name of [
    "Billing_Address",
    "Shipping_Address",
    "Billing_Coordinates",
    "Shipping_Coordinates",
    "Created_By",
    "Modified_By",
    "Created_Time",
    "Modified_Time",
  ]) {
    expect(isAccountInlineEditable(accountField(name))).toBe(false);
  }

  expect(isAccountInlineEditable(accountField("Parent_Account", { dataType: "lookup" }))).toBe(
    false,
  );
  expect(isAccountInlineEditable(accountField("Account_Number", { dataType: "bigint" }))).toBe(
    false,
  );
  expect(isAccountInlineEditable(accountField("Industry", { readOnly: true }))).toBe(false);
});
