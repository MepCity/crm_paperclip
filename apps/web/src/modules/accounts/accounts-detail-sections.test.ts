import { expect, test } from "vitest";
import {
  buildAccountsBusinessCardFields,
  buildAccountsDetailSections,
  formatAccountsAddress,
} from "./accounts-detail-sections";
import { accountField, accountMetadata, accountRecord } from "./test-metadata";

test("uses service business-card order (Account Owner, Industry, Employees, Annual Revenue, Phone) and visibility", () => {
  const fields = [
    accountField("Owner"),
    accountField("Industry"),
    accountField("Employees"),
    accountField("Annual_Revenue"),
    accountField("Phone", {
      views: { view: false, create: true, edit: true, quickCreate: false },
    }),
  ];
  const metadata = {
    ...accountMetadata(fields),
    businessCardFields: ["Owner", "Industry", "Employees", "Annual_Revenue", "Phone", "Missing"],
  };
  const record = accountRecord({
    Owner: "user-1",
    Industry: "Technology",
    Employees: 50,
    Annual_Revenue: 1000000,
    Phone: "555-1234",
  });

  expect(
    buildAccountsBusinessCardFields(metadata, record).map((row) => [row.field.apiName, row.value]),
  ).toEqual([
    ["Owner", "user-1"],
    ["Industry", "Technology"],
    ["Employees", 50],
    ["Annual_Revenue", 1000000],
  ]);
});

test("uses layout columns, audit timestamps, and full-width description", () => {
  const metadata = {
    ...accountMetadata([
      accountField("Account_Name"),
      accountField("Owner"),
      accountField("Created_By"),
      accountField("Description"),
    ]),
    layout: [
      { label: "Account Image", columnCount: 1, columns: [[]], fields: [] },
      {
        label: "Account Information",
        columnCount: 2,
        columns: [["Owner", "Created_By"], ["Account_Name"]],
        fields: ["Owner", "Created_By", "Account_Name"],
      },
      {
        label: "Description Information",
        columnCount: 1,
        columns: [["Description"]],
        fields: ["Description"],
      },
    ],
  };
  const sections = buildAccountsDetailSections(
    metadata,
    accountRecord({
      Account_Name: "Acme Corp",
      Owner: "user-1",
      Created_By: "sample-user",
      Created_Time: "2026-01-01T00:00:00Z",
      Description: "Sample notes",
    }),
  );

  expect(sections.map((section) => section.title)).toEqual([
    "Account Information",
    "Description Information",
  ]);
  expect(sections[0]?.fields.map((entry) => [entry.column, entry.field.apiName])).toEqual([
    ["left", "Owner"],
    ["left", "Created_By"],
    ["right", "Account_Name"],
  ]);
  expect(sections[0]?.fields[1]?.auditTimestamp).toBe("2026-01-01T00:00:00Z");
  expect(sections[1]?.fields[0]?.column).toBe("full");
  expect(sections[1]?.fields[0]?.value).toBe("Sample notes");
});

test("renders separate Billing and Shipping address composites without duplicating component fields", () => {
  const names = [
    "Billing_Address",
    "Billing_City",
    "Billing_Code",
    "Shipping_Address",
    "Shipping_Country",
  ];
  const metadata = {
    ...accountMetadata(names.map((name) => accountField(name))),
    layout: [
      {
        label: "Address Information",
        columnCount: 2,
        columns: [names.slice(0, 3), names.slice(3)],
        fields: names,
      },
    ],
  };
  const record = accountRecord({
    Billing_City: "Istanbul",
    Billing_Code: "34000",
    Shipping_Country: "Turkey",
  });

  expect(formatAccountsAddress(record, "Billing")).toBe("Istanbul, 34000");
  expect(formatAccountsAddress(record, "Shipping")).toBe("Turkey");

  const sections = buildAccountsDetailSections(metadata, record);
  expect(sections[0]?.fields.map((entry) => [entry.column, entry.value])).toEqual([
    ["left", "Istanbul, 34000"],
    ["right", "Turkey"],
  ]);
});
