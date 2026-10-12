import { expect, test } from "vitest";
import { buildFormModel, formFields } from "@/components/records/form/form-model";
import {
  ACCOUNTS_FORM_ADDRESS_CHILD_ORDER,
  ACCOUNTS_FORM_ADDRESS_GROUPS,
  ACCOUNTS_FORM_CREATE_TITLE,
  ACCOUNTS_FORM_EDIT_TITLE,
  ACCOUNTS_FORM_INFORMATION_COLUMNS,
  accountsFormRules,
} from "./accounts-form-rules";
import { accountField, accountMetadata } from "./test-metadata";

test("preserves Account form titles, owner key, currency field, and address configuration", () => {
  expect(ACCOUNTS_FORM_CREATE_TITLE).toBe("Create Account");
  expect(ACCOUNTS_FORM_EDIT_TITLE).toBe("Edit Account");

  expect(accountsFormRules.owner).toBe("Owner");
  expect(accountsFormRules.currency).toBe("Annual_Revenue");
  expect(accountsFormRules.omitted).toEqual(["Connected_To__s"]);
  expect(accountsFormRules.countries).toHaveLength(2);
  expect(accountsFormRules.addresses).toHaveLength(2);
});

test("reads required Account Name from metadata and supplies current-user owner key", () => {
  const metadata = {
    ...accountMetadata([
      accountField("Owner"),
      accountField("Account_Name", { required: true }),
      accountField("Annual_Revenue", { dataType: "currency" }),
    ]),
    layout: [
      {
        label: "Account Information",
        columnCount: 2,
        columns: [["Owner", "Account_Name"], ["Annual_Revenue"]],
        fields: ["Owner", "Account_Name", "Annual_Revenue"],
      },
    ],
  };

  const fields = formFields(
    metadata,
    buildFormModel(metadata, "create"),
    "create",
    accountsFormRules,
  );
  expect(fields.find((field) => field.apiName === "Account_Name")?.required).toBe(true);
  expect(fields.find((field) => field.apiName === "Annual_Revenue")?.dataType).toBe("currency");
});

test("exports spec 8-row column order for Account Information and address composites", () => {
  expect(ACCOUNTS_FORM_INFORMATION_COLUMNS[0]).toEqual([
    "Owner",
    "Account_Name",
    "Account_Site",
    "Parent_Account",
    "Account_Number",
    "Account_Type",
    "Industry",
    "Annual_Revenue",
  ]);
  expect(ACCOUNTS_FORM_INFORMATION_COLUMNS[1]).toEqual([
    "Rating",
    "Phone",
    "Fax",
    "Website",
    "Ticker_Symbol",
    "Ownership",
    "Employees",
    "SIC_Code",
  ]);

  expect(
    ACCOUNTS_FORM_ADDRESS_GROUPS.map((group) => [group.field, group.latitude, group.longitude]),
  ).toEqual([
    ["Billing_Address", "Billing_Latitude", "Billing_Longitude"],
    ["Shipping_Address", "Shipping_Latitude", "Shipping_Longitude"],
  ]);
  expect(ACCOUNTS_FORM_ADDRESS_CHILD_ORDER).toEqual([
    "Country",
    "Flat_House_No_Building_Apartment_Name",
    "Street",
    "City",
    "State",
    "Code",
    "Latitude",
    "Longitude",
  ]);
});
