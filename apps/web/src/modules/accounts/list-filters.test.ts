import { expect, test } from "vitest";
import { accountsFilterGroups, buildAccountsFilterGroups } from "./list-filters";
import { accountField } from "./test-metadata";

test("preserves Accounts system filter inventory (AL-20 - AL-25) and initial field rows with live Activities", () => {
  expect(accountsFilterGroups[0]?.items.map((row) => [row.label, row.laterModule])).toEqual([
    ["Activities", undefined],
    ["Locked", undefined],
    ["Record Action", undefined],
    ["Related Records Action", undefined],
    ["Touched Records", undefined],
    ["Untouched Records", undefined],
    ["Cadences", "P3"],
  ]);
  expect(accountsFilterGroups[0]?.items[0]).toEqual({
    id: "Activities",
    label: "Activities",
    systemEditor: "activities",
  });

  const systemLabels = accountsFilterGroups[0]?.items.map((row) => row.label) ?? [];
  expect(systemLabels).toContain("Activities");
  expect(systemLabels).not.toContain("Campaigns");
  expect(systemLabels).not.toContain("Latest Email Status");

  expect(accountsFilterGroups[1]?.items.map((row) => row.label)).toEqual([
    "Account Name",
    "Account Number",
    "Account Owner",
    "Account Site",
    "Account Type",
    "Annual Revenue",
    "Billing Address",
    "Billing Address - City",
  ]);
});

test("resolves title, owner, picklist and compound address editors from metadata", () => {
  const groups = buildAccountsFilterGroups({
    fields: [
      accountField("Account_Name", { label: "Account Name" }),
      accountField("Owner", { label: "Account Owner", dataType: "ownerlookup" }),
      accountField("Industry", {
        label: "Industry",
        dataType: "picklist",
        picklist: [{ storedValue: "tech", displayValue: "Technology" }],
      }),
      accountField("Annual_Revenue", { label: "Annual Revenue", dataType: "currency" }),
      accountField("Billing_Address", { label: "Billing Address" }),
      accountField("Connected_To__s", { label: "Connected To", dataType: "multi_module_lookup" }),
      accountField("Tag", { label: "Tag" }),
    ],
    users: [{ userId: "sample-user", name: "Sample User", email: "user@example.com" }],
    linkField: "Account_Name",
    currencyCode: "TRY",
  });

  expect(groups[1]?.items.find((item) => item.label === "Account Name")?.id).toBe("Account_Name");
  expect(groups[1]?.items.find((item) => item.id === "Owner")?.editor?.options).toEqual([
    { id: "sample-user", label: "Sample User", detail: "user@example.com" },
  ]);
  expect(groups[1]?.items.find((item) => item.id === "Industry")?.editor?.options).toEqual([
    { id: "tech", label: "Technology" },
  ]);
  expect(groups[1]?.items.find((item) => item.id === "Annual_Revenue")?.editor?.currencyCode).toBe(
    "TRY",
  );
  expect(groups[1]?.items.find((item) => item.id === "Billing_Address")?.editor?.fieldType).toBe(
    "compound_address",
  );
  expect(groups[1]?.items.find((item) => item.id === "Connected_To__s")?.editor?.fieldType).toBe(
    "multilookup",
  );
  expect(groups[1]?.items.find((item) => item.id === "Tag")?.editor?.fieldType).toBe("tag");
});
