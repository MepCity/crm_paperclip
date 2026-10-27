import { expect, test } from "vitest";
import { type FieldRow, groupAddressRows } from "./fields-model";

test("the field listing groups address storage and omits derived system fields without removing custom fields", () => {
  const rows: FieldRow[] = [
    {
      apiName: "Street",
      label: "Address - Street Address",
      dataType: "Single Line",
      custom: false,
    },
    { apiName: "City", label: "Address - City", dataType: "Single Line", custom: false },
    { apiName: "Full_Name", label: "Full Name", dataType: "Single Line", custom: false },
    { apiName: "Created_Time", label: "Created Time", dataType: "Date/Time", custom: false },
    { apiName: "Email", label: "Email", dataType: "Email", custom: false },
    { apiName: "Custom_Address", label: "My address", dataType: "Single Line", custom: true },
  ];
  const projected = groupAddressRows(rows, "Leads");
  expect(projected.map((row) => row.apiName)).toEqual(["Email", "Custom_Address", "Address"]);
  expect(rows).toHaveLength(6);
  expect(groupAddressRows(rows, "Accounts")).toEqual(rows);
});
