import { expect, test } from "vitest";
import { buildDealsFilterGroups, dealsFilterGroups } from "./list-filters";
import { dealField } from "./test-metadata";

test("preserves Deals system filter inventory (DL-17, DL-19, DL-20 - DL-25) in reference order", () => {
  expect(dealsFilterGroups[0]?.items.map((row) => [row.label, row.laterModule])).toEqual([
    ["Activities", undefined],
    ["Latest Email Status", "M10"],
    ["Locked", undefined],
    ["Record Action", undefined],
    ["Related Records Action", undefined],
    ["Touched Records", undefined],
    ["Untouched Records", undefined],
    ["Cadences", "P3"],
  ]);
  expect(dealsFilterGroups[0]?.items[0]).toEqual({
    id: "Activities",
    label: "Activities",
    systemEditor: "activities",
  });

  const systemLabels = dealsFilterGroups[0]?.items.map((row) => row.label) ?? [];
  expect(systemLabels).toContain("Activities");
  expect(systemLabels).toContain("Latest Email Status");
  expect(systemLabels).not.toContain("Campaigns");
});

test("preserves initial field rows with inventory module keys (DL-26, DL-27, DL-65 - DL-69)", () => {
  expect(
    dealsFilterGroups[1]?.items.slice(0, 6).map((row) => [row.label, row.laterModule]),
  ).toEqual([
    ["Account Name", undefined],
    ["Amount", undefined],
    ["Campaign Source", "M7"],
    ["Closing Date", undefined],
    ["Connected To", undefined],
    ["Contact Name", undefined],
  ]);
});

test("resolves picklist, ownerlookup, currency and special fields from metadata", () => {
  const groups = buildDealsFilterGroups({
    fields: [
      dealField("Deal_Name", { label: "Deal Name" }),
      dealField("Owner", { label: "Deal Owner", dataType: "ownerlookup" }),
      dealField("Stage", {
        label: "Stage",
        dataType: "picklist",
        picklist: [{ storedValue: "Qualification", displayValue: "Qualification" }],
      }),
      dealField("Amount", { label: "Amount", dataType: "currency" }),
      dealField("Connected_To__s", { label: "Connected To", dataType: "multi_module_lookup" }),
      dealField("Tag", { label: "Tag" }),
    ],
    users: [{ userId: "u1", name: "Alice", email: "alice@example.com" }],
    linkField: "Deal_Name",
    currencyCode: "TRY",
  });

  expect(groups[1]?.items.find((item) => item.label === "Deal Name")?.id).toBe("Deal_Name");
  expect(groups[1]?.items.find((item) => item.id === "Owner")?.editor?.options).toEqual([
    { id: "u1", label: "Alice", detail: "alice@example.com" },
  ]);
  expect(groups[1]?.items.find((item) => item.id === "Stage")?.editor?.options).toEqual([
    { id: "Qualification", label: "Qualification" },
  ]);
  expect(groups[1]?.items.find((item) => item.id === "Amount")?.editor?.currencyCode).toBe("TRY");
  expect(groups[1]?.items.find((item) => item.id === "Connected_To__s")?.editor?.fieldType).toBe(
    "multilookup",
  );
  expect(groups[1]?.items.find((item) => item.id === "Tag")?.editor?.fieldType).toBe("tag");
});
