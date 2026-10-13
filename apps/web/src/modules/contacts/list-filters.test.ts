import { expect, test } from "vitest";
import { buildContactsFilterGroups, contactsFilterGroups } from "./list-filters";
import { contactField } from "./test-metadata";

test("preserves inventory order and later-module keys before metadata resolves", () => {
  expect(contactsFilterGroups[0]?.items.map((row) => [row.label, row.laterModule])).toEqual([
    ["Activities", "M5"],
    ["Campaigns", "M7"],
    ["Latest Email Status", "M10"],
    ["Locked", undefined],
    ["Record Action", undefined],
    ["Related Records Action", undefined],
    ["Touched Records", undefined],
    ["Untouched Records", undefined],
    ["Cadences", "P3"],
  ]);
  expect(contactsFilterGroups[1]?.items.map((row) => row.label)).toEqual([
    "Account Name",
    "Assistant",
    "Asst Phone",
    "Connected To",
    "Contact Name",
    "Contact Owner",
  ]);
  expect(contactsFilterGroups[1]?.items[0]?.laterModule).toBeUndefined();
  expect(contactsFilterGroups[1]?.items[0]?.disabled).toBe(true);
});
test("resolves title, owner, lookup and picklist editors from small service metadata", () => {
  const groups = buildContactsFilterGroups({
    fields: [
      contactField("Full_Name", { label: "Full Name" }),
      contactField("Owner", { label: "Contact Owner", dataType: "ownerlookup" }),
      contactField("Account_Name", {
        label: "Account Name",
        dataType: "lookup",
        lookup: { module: "Accounts" },
      }),
      contactField("Lead_Source", {
        label: "Lead Source",
        dataType: "picklist",
        picklist: [{ storedValue: "sample", displayValue: "Sample" }],
      }),
    ],
    users: [{ userId: "sample-user", name: "Sample User" }],
    linkField: "Full_Name",
    currencyCode: "TRY",
  });
  expect(groups[1]?.items.find((item) => item.label === "Contact Name")?.id).toBe("Full_Name");
  expect(groups[1]?.items.find((item) => item.id === "Account_Name")?.editor?.fieldType).toBe(
    "lookup",
  );
  expect(groups[1]?.items.find((item) => item.id === "Owner")?.editor?.options).toEqual([
    { id: "sample-user", label: "Sample User" },
  ]);
  expect(groups[1]?.items.find((item) => item.id === "Lead_Source")?.editor?.options).toEqual([
    { id: "sample", label: "Sample" },
  ]);
});
